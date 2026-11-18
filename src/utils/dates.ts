/**
 * Date parsing and formatting utilities for catalog data.
 * The catalog stores dates in DD/MM/YYYY format (e.g., "18/11/2026").
 */

export function parseCatalogDate(dateStr: string | null | undefined): Date | null {
    if (!dateStr) return null;
    const s = dateStr.trim();
    if (!s) return null;

    // Check for DD/MM/YYYY
    const parts = s.split('/');
    if (parts.length === 3) {
        const day = parseInt(parts[0], 10);
        const month = parseInt(parts[1], 10) - 1; // 0-indexed in JS Date
        const year = parseInt(parts[2], 10);
        if (!isNaN(day) && !isNaN(month) && !isNaN(year)) {
            const d = new Date(year, month, day);
            if (!isNaN(d.getTime())) return d;
        }
    }

    // Fallback for ISO format YYYY-MM-DD or standard parseable strings
    const fallback = new Date(s);
    return isNaN(fallback.getTime()) ? null : fallback;
}

/**
 * Returns true if the port was updated within the last N days.
 */
export function isRecentlyUpdated(dateStr: string | null | undefined, days = 7): boolean {
    const d = parseCatalogDate(dateStr);
    if (!d) return false;

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const itemDay = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
    const diffDays = (today - itemDay) / (1000 * 60 * 60 * 24);

    // Allow diffDays >= -1 to tolerate slight timezone offsets
    return diffDays >= -1 && diffDays <= days;
}

/**
 * Formats a catalog date into a human-friendly string (e.g., "Nov 18, 2026").
 */
export function formatDisplayDate(dateStr: string | null | undefined): string | null {
    const d = parseCatalogDate(dateStr);
    if (!d) return null;

    return new Intl.DateTimeFormat('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
    }).format(d);
}
