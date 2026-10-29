import { invoke } from "@tauri-apps/api/core";
import { PortData } from "../types";
import { load } from "@tauri-apps/plugin-store";
import { isTauri } from "../utils/env";

export async function fetchCatalog(urlOverride?: string): Promise<PortData[]> {
    if (!isTauri) {
        // Web mode: Simply fetch the static catalog.json
        try {
            const url = urlOverride || `${import.meta.env.BASE_URL}catalog.json`;
            const response = await fetch(url);
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            return await response.json() as PortData[];
        } catch (e) {
            console.error("Failed to fetch web catalog:", e);
            return [];
        }
    }

    // Tauri Desktop mode
    let url = urlOverride;

    if (!url) {
        const store = await load('settings.json');
        const catalogUrl = await store.get<string>('catalog_url');
        if (catalogUrl) {
            url = catalogUrl;
        } else {
            // Default URL if not set
            url = "https://raw.githubusercontent.com/robzilla10001/SwitchPorts/main/catalog.json";
        }
    }

    try {
        const data = await invoke<PortData[]>("fetch_remote_catalog", { url });
        return data;
    } catch (e) {
        console.error("Failed to fetch catalog via Tauri, falling back to read JSON:", e);
        try {
            const response = await fetch('/catalog.json');
            return await response.json() as PortData[];
        } catch (innerE) {
            console.error("Fallback failed", innerE);
            return [];
        }
    }
}
