import { invoke } from "@tauri-apps/api/core";
import { PortData } from "../types";

export async function fetchCatalog(): Promise<PortData[]> {
    try {
        const data = await invoke<PortData[]>("fetch_remote_catalog");
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
