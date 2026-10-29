import { invoke } from "@tauri-apps/api/core";
import { isTauri } from "../utils/env";

export async function fetchGameCoverUrl(title: string, steamgriddbId?: string | null, fallbackUrl?: string | null): Promise<string | null> {
    if (!isTauri) {
        // Web mode: Do not query SteamGridDB to avoid exposing API keys. Just return the provided grid URL.
        return fallbackUrl || null;
    }

    try {
        const cachedUrl = await invoke<string>("cache_cover_image", {
            title,
            url: null
        });

        if (cachedUrl && !cachedUrl.includes("placeholder")) {
           return cachedUrl;
        }

        const apiKey = localStorage.getItem("sgdb_api_key");
        if (!apiKey) {
            // If no API key is set in desktop mode, fallback to catalog image
            if (fallbackUrl) {
                 return await invoke<string>("cache_cover_image", { title, url: fallbackUrl });
            }
            return null;
        }

        let gameId = steamgriddbId;

        if (!gameId) {
             const searchRes = await fetch(`https://www.steamgriddb.com/api/v2/search/autocomplete/${encodeURIComponent(title)}`, {
                 headers: { Authorization: `Bearer ${apiKey}` }
             });

             if (!searchRes.ok) return fallbackUrl || null;
             const searchData = await searchRes.json();
             if (searchData.data && searchData.data.length > 0) {
                 gameId = searchData.data[0].id;
             }
        }

        if (gameId) {
             const gridsRes = await fetch(`https://www.steamgriddb.com/api/v2/grids/game/${gameId}?dimensions=600x900`, {
                 headers: { Authorization: `Bearer ${apiKey}` }
             });

             if (!gridsRes.ok) return fallbackUrl || null;
             const gridsData = await gridsRes.json();

             if (gridsData.data && gridsData.data.length > 0) {
                 const imageUrl = gridsData.data[0].url;

                 // Cache the image
                 const newlyCachedUrl = await invoke<string>("cache_cover_image", {
                     title,
                     url: imageUrl
                 });

                 return newlyCachedUrl;
             }
        }

        // If all else fails, use the fallback url if available
        if (fallbackUrl) {
            return await invoke<string>("cache_cover_image", { title, url: fallbackUrl });
        }

        return null;
    } catch (e) {
        console.error("SteamGridDB fetch failed", e);
        return fallbackUrl || null;
    }
}
