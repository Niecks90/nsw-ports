mod commands;

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_store::Builder::new().build())
        .invoke_handler(tauri::generate_handler![
            commands::catalog::fetch_remote_catalog,
            commands::downloader::download_port,
            commands::downloader::inject_game_assets,
            commands::deploy::deploy_local,
            commands::deploy::deploy_ftp,
            commands::deploy::test_ftp_connection,
            commands::cache::cache_cover_image,
            commands::cache::clear_image_cache,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
