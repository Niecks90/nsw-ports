/**
 * Sanitizes game title strings by replacing HTML <br> tags with a single space
 * and collapsing multiple consecutive whitespace characters.
 */
export function cleanTitle(title: string | null | undefined): string {
    if (!title) return '';
    return title
        .replace(/<\s*br\s*\/?>/gi, ' ')
        .replace(/\s+/g, ' ')
        .trim();
}
