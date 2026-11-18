/**
 * Version string cleaner and formatter.
 * Strips raw Markdown asterisks and prerelease annotations (e.g. "0.7.0 *prerelease*" -> "v0.7.0").
 */

export function formatVersion(version: string | null | undefined): string {
    if (!version) return '';
    let v = version.trim();
    if (!v) return '';

    // If it has a version number followed by a markdown tag e.g. "0.7.0 *prerelease*" or "0.310 *pre-release*"
    const match = v.match(/^(v?[\d.]+[\w.-]*)\s*\*[^*]+\*$/i);
    if (match) {
        v = match[1].trim();
    } else {
        // Strip any remaining raw asterisks e.g. "*released*" -> "released"
        v = v.replace(/\*/g, '').trim();
    }

    // Add "v" prefix if starting with a digit
    if (/^\d/.test(v)) {
        return `v${v}`;
    }

    return v;
}
