use std::fs::{self, File};
use std::io::Write;
use std::path::Path;

#[tauri::command]
pub fn cache_cover_image(game_id: String, image_url: String) -> Result<String, String> {
    let cache_dir = Path::new("./cache/covers/");
    if !cache_dir.exists() {
        fs::create_dir_all(cache_dir).map_err(|e| e.to_string())?;
    }

    let path = format!("./cache/covers/{}.jpg", game_id);
    let path_obj = Path::new(&path);

    if path_obj.exists() {
        return Ok(path);
    }

    let client = reqwest::blocking::Client::builder()
        .user_agent("PortsDL-NX")
        .build()
        .map_err(|e| e.to_string())?;

    let response = client.get(&image_url).send().map_err(|e| e.to_string())?;

    if response.status().is_success() {
        let bytes = response.bytes().map_err(|e| e.to_string())?;
        let mut file = File::create(path_obj).map_err(|e| e.to_string())?;
        file.write_all(&bytes).map_err(|e| e.to_string())?;
        Ok(path)
    } else {
        Err(format!("Failed to fetch cover image: {}", response.status()))
    }
}
