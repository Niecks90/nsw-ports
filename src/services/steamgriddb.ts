import { invoke } from "@tauri-apps/api/core";

export async function fetchGameCoverUrl(title: string, steamgriddbId?: string | null): Promise<string | null> {
    try {
        const cachedUrl = await invoke<string>("cache_cover_image", {
            title,
            url: null
        });

        if (cachedUrl && !cachedUrl.includes("placeholder")) {
           return cachedUrl;
        }

        const apiKey = localStorage.getItem("sgdb_api_key");
        if (!apiKey) return null;

        let gameId = steamgriddbId;

        if (!gameId) {
             const searchRes = await fetch(`https://www.steamgriddb.com/api/v2/search/autocomplete/${encodeURIComponent(title)}`, {
                 headers: { Authorization: `Bearer ${apiKey}` }
             });

             if (!searchRes.ok) return null;
             const searchData = await searchRes.json();
             if (searchData.data && searchData.data.length > 0) {
                 gameId = searchData.data[0].id;
             }
        }

        if (gameId) {
             const gridsRes = await fetch(`https://www.steamgriddb.com/api/v2/grids/game/${gameId}?dimensions=600x900`, {
                 headers: { Authorization: `Bearer ${apiKey}` }
             });

             if (!gridsRes.ok) return null;
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

        return null;
    } catch (e) {
        console.error("SteamGridDB fetch failed", e);
        return null;
    }
}
