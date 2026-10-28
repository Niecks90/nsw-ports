use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize)]
pub struct GameEntry {
    pub id: String,
}

#[tauri::command]
pub fn fetch_remote_catalog(url: String) -> Result<Vec<GameEntry>, String> {
    let client_res = reqwest::blocking::Client::builder()
        .user_agent("PortsDL-NX")
        .build();

    if let Ok(client) = client_res {
        if let Ok(response) = client.get(&url).send() {
            if response.status().is_success() {
                if let Ok(catalog) = response.json::<Vec<GameEntry>>() {
                    return Ok(catalog);
                }
            }
        }
    }

    // Fallback to embedded local backup if network fails
    let embedded_catalog = include_str!("../assets/catalog.json");
    let fallback_catalog: Vec<GameEntry> = serde_json::from_str(embedded_catalog)
        .map_err(|e| format!("Failed to parse embedded catalog: {}", e))?;

    Ok(fallback_catalog)
}
