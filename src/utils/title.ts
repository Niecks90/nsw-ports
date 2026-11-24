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

/**
 * Cleans duplicate author suffix from game title if it matches the author,
 * and sanitizes HTML <br> tags and whitespace.
 * E.g., "Torchlight (liartes)" with author "liartes" -> "Torchlight"
 * Keeps non-author suffixes like "Sonic The Hedgehog (2006)" when author is "ChanseyIsTheBest".
 */
export function cleanGameTitle(title: string | null | undefined, author: string | null | undefined): string {
    const cleaned = cleanTitle(title);
    if (!cleaned) return '';
    if (!author) return cleaned;

    const trimmedAuthor = author.trim().toLowerCase();
    if (!trimmedAuthor) return cleaned;

    const match = cleaned.match(/\s*\(([^)]+)\)\s*$/);
    if (match) {
        const parenContent = match[1].trim().toLowerCase();
        if (parenContent === trimmedAuthor) {
            return cleaned.slice(0, match.index).trim();
        }
    }

    return cleaned;
}
