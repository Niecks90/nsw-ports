use std::fs::{self, File};
use std::io::{self, Write};
use std::path::Path;
use tauri::{AppHandle, Emitter};
use futures_util::StreamExt;
use reqwest::Client;
use zip::ZipArchive;

#[derive(Clone, serde::Serialize)]
struct ProgressPayload {
    progress: f64,
}

#[tauri::command]
pub async fn download_port(app: AppHandle, url: String, target_staging_dir: String) -> Result<String, String> {
    let client = Client::builder()
        .user_agent("PortsDL-NX")
        .build()
        .map_err(|e| e.to_string())?;

    let res = client.get(&url).send().await.map_err(|e| e.to_string())?;

    if !res.status().is_success() {
        return Err(format!("Download failed with status: {}", res.status()));
    }

    let total_size = res.content_length().unwrap_or(0);
    let mut downloaded: u64 = 0;
    let mut stream = res.bytes_stream();

    let staging_path = Path::new(&target_staging_dir);
    if !staging_path.exists() {
        fs::create_dir_all(staging_path).map_err(|e| e.to_string())?;
    }

    let is_zip = url.ends_with(".zip");

    let file_name = url.split('/').last().unwrap_or("download");
    let file_path = staging_path.join(file_name);

    // Spawn blocking task for initial file creation
    let file_path_clone = file_path.clone();
    let file = tokio::task::spawn_blocking(move || {
        File::create(&file_path_clone)
    }).await.map_err(|e| e.to_string())?.map_err(|e| e.to_string())?;

    while let Some(chunk) = stream.next().await {
        let chunk = chunk.map_err(|e| e.to_string())?;

        // Spawn blocking task for writing chunk
        let chunk_clone = chunk.clone();
        let mut file_clone = file.try_clone().map_err(|e| e.to_string())?;
        tokio::task::spawn_blocking(move || {
            file_clone.write_all(&chunk_clone)
        }).await.map_err(|e| e.to_string())?.map_err(|e| e.to_string())?;

        downloaded += chunk.len() as u64;

        if total_size > 0 {
            let progress = (downloaded as f64 / total_size as f64) * 100.0;
            let _ = app.emit("download-progress", ProgressPayload { progress });
        }
    }
    let _ = app.emit("download-progress", ProgressPayload { progress: 100.0 });

    if is_zip {
        let staging_path_clone = staging_path.to_path_buf();
        let file_path_clone2 = file_path.clone();

        // Spawn blocking task for extracting zip
        tokio::task::spawn_blocking(move || -> Result<(), String> {
            let file = File::open(&file_path_clone2).map_err(|e| e.to_string())?;
            let mut archive = ZipArchive::new(file).map_err(|e| e.to_string())?;

            for i in 0..archive.len() {
                let mut file = archive.by_index(i).map_err(|e| e.to_string())?;
                let outpath = match file.enclosed_name() {
                    Some(path) => staging_path_clone.join(path),
                    None => continue,
                };

                if file.is_dir() {
                    fs::create_dir_all(&outpath).map_err(|e| e.to_string())?;
                } else {
                    if let Some(p) = outpath.parent() {
                        if !p.exists() {
                            fs::create_dir_all(p).map_err(|e| e.to_string())?;
                        }
                    }
                    let mut outfile = File::create(&outpath).map_err(|e| e.to_string())?;
                    io::copy(&mut file, &mut outfile).map_err(|e| e.to_string())?;
                }
            }

            fs::remove_file(&file_path_clone2).map_err(|e| e.to_string())?;
            Ok(())
        }).await.map_err(|e| e.to_string())??;
    }

    Ok(format!("Successfully downloaded and extracted to {:?}", staging_path))
}

#[tauri::command]
pub fn inject_game_assets(source_path: String, target_subpath: String) -> Result<(), String> {
    let source = Path::new(&source_path);
    let target = Path::new(&target_subpath);

    if !source.exists() {
        return Err(format!("Source path does not exist: {:?}", source));
    }

    if source.is_dir() {
        if !target.exists() {
            fs::create_dir_all(target).map_err(|e| e.to_string())?;
        }

        for entry in walkdir::WalkDir::new(source) {
            let entry = entry.map_err(|e| e.to_string())?;
            let path = entry.path();

            let relative_path = path.strip_prefix(source).map_err(|e| e.to_string())?;
            let target_path = target.join(relative_path);

            if path.is_dir() {
                if !target_path.exists() {
                    fs::create_dir_all(&target_path).map_err(|e| e.to_string())?;
                }
            } else {
                if let Some(p) = target_path.parent() {
                    if !p.exists() {
                        fs::create_dir_all(p).map_err(|e| e.to_string())?;
                    }
                }
                fs::copy(path, &target_path).map_err(|e| e.to_string())?;
            }
        }
    } else {
        if let Some(p) = target.parent() {
            if !p.exists() {
                fs::create_dir_all(p).map_err(|e| e.to_string())?;
            }
        }
        fs::copy(source, target).map_err(|e| e.to_string())?;
    }

    Ok(())
}
