import { PortData } from "../types";

export async function fetchCatalog(urlOverride?: string): Promise<PortData[]> {
    const url = urlOverride || './catalog.json';

    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return await response.json() as PortData[];
    } catch (e) {
        console.error("Failed to fetch catalog:", e);
        return [];
    }
}
