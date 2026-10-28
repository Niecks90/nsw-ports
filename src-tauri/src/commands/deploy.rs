use std::fs;
use std::path::Path;
use suppaftp::FtpStream;
use tauri::{AppHandle, Emitter};

#[derive(Clone, serde::Serialize)]
struct FtpProgressPayload {
    file: String,
    progress: f64, // could just be a mock or per-file completion
}

#[tauri::command]
pub fn deploy_local(staging_path: String, output_dir: Option<String>) -> Result<(), String> {
    let dest_dir = output_dir.unwrap_or_else(|| "./switch/".to_string());
    let dest = Path::new(&dest_dir);
    let source = Path::new(&staging_path);

    if !source.exists() {
        return Err(format!("Staging path does not exist: {:?}", source));
    }

    if !dest.exists() {
        fs::create_dir_all(dest).map_err(|e| e.to_string())?;
    }

    for entry in walkdir::WalkDir::new(source) {
        let entry = entry.map_err(|e| e.to_string())?;
        let path = entry.path();

        let relative_path = path.strip_prefix(source).map_err(|e| e.to_string())?;
        let target_path = dest.join(relative_path);

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

    Ok(())
}

fn ftp_create_dirs(ftp: &mut FtpStream, path: &str) -> Result<(), String> {
    let parts: Vec<&str> = path.split('/').filter(|s| !s.is_empty()).collect();
    let mut current = String::new();

    for part in parts {
        current.push_str("/");
        current.push_str(part);
        let _ = ftp.mkdir(&current); // Ignore error if it exists
    }
    Ok(())
}

#[tauri::command]
pub fn deploy_ftp(app: AppHandle, host: String, port: u16, staging_path: String, remote_dest: String) -> Result<(), String> {
    let _port = if port == 0 { 5000 } else { port };

    let mut ftp_stream = FtpStream::connect((host.as_str(), _port)).map_err(|e| e.to_string())?;
    ftp_stream.login("anonymous", "").map_err(|e| e.to_string())?;
    // Explicitly set passive mode for Switch sys-ftpd compatibility if active by default, though suppaftp might be passive default. We rely on the connection being single-threaded as requested.

    let source = Path::new(&staging_path);
    if !source.exists() {
        return Err(format!("Staging path does not exist: {:?}", source));
    }

    let entries: Vec<_> = walkdir::WalkDir::new(source)
        .into_iter()
        .filter_map(|e| e.ok())
        .collect();

    let total_files = entries.iter().filter(|e| !e.path().is_dir()).count();
    let mut uploaded_files = 0;

    for entry in entries {
        let path = entry.path();

        let relative_path = path.strip_prefix(source).map_err(|e| e.to_string())?;
        let target_path = format!("{}/{}", remote_dest, relative_path.to_string_lossy().replace("\\", "/"));

        if path.is_dir() {
            ftp_create_dirs(&mut ftp_stream, &target_path)?;
        } else {
            if let Some(parent) = Path::new(&target_path).parent() {
                ftp_create_dirs(&mut ftp_stream, &parent.to_string_lossy().replace("\\", "/"))?;
            }
            let mut file = std::fs::File::open(path).map_err(|e| e.to_string())?;
            ftp_stream.put_file(&target_path, &mut file).map_err(|e| e.to_string())?;

            uploaded_files += 1;
            let progress = (uploaded_files as f64 / total_files as f64) * 100.0;
            let _ = app.emit("ftp-progress", FtpProgressPayload {
                file: path.to_string_lossy().to_string(),
                progress
            });
        }
    }

    let _ = ftp_stream.quit();
    Ok(())
}

#[tauri::command]
pub fn test_ftp_connection(host: String, port: u16) -> Result<bool, String> {
    let _port = if port == 0 { 5000 } else { port };
    let mut ftp_stream = FtpStream::connect((host.as_str(), _port)).map_err(|e| e.to_string())?;
    ftp_stream.login("anonymous", "").map_err(|e| e.to_string())?;
    let _ = ftp_stream.quit();
    Ok(true)
}
