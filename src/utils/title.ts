/**
 * Cleans duplicate author suffix from game title if it matches the author.
 * E.g., "Torchlight (liartes)" with author "liartes" -> "Torchlight"
 * Keeps non-author suffixes like "Sonic The Hedgehog (2006)" when author is "ChanseyIsTheBest".
 */
export function cleanGameTitle(title: string | null | undefined, author: string | null | undefined): string {
    if (!title) return '';
    if (!author) return title;

    const trimmedAuthor = author.trim().toLowerCase();
    if (!trimmedAuthor) return title;

    const match = title.match(/\s*\(([^)]+)\)\s*$/);
    if (match) {
        const parenContent = match[1].trim().toLowerCase();
        if (parenContent === trimmedAuthor) {
            return title.slice(0, match.index).trim();
        }
    }

    return title;
}
