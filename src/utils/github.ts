/**
 * GitHub URL utilities for resolving README relative assets to raw GitHub content.
 */

export interface GitHubRepoInfo {
    owner: string;
    repo: string;
}

export function parseGitHubRepo(repoUrl: string | null | undefined): GitHubRepoInfo | null {
    if (!repoUrl || !repoUrl.includes('github.com')) return null;

    const match = repoUrl.match(/github\.com\/([^/]+)\/([^/?#]+)/);
    if (!match) return null;

    const owner = match[1];
    const repo = match[2].replace(/\.git$/, '').replace(/\/$/, '');
    return { owner, repo };
}

/**
 * Resolves a relative path (e.g. "docs/images/pic.png" or "./assets/banner.png")
 * against the port repository's HEAD branch on GitHub:
 * https://raw.githubusercontent.com/{owner}/{repo}/HEAD/{clean_path}
 */
export function resolveGithubRawUrl(pathOrUrl: string | null | undefined, repoUrl: string | null | undefined): string {
    if (!pathOrUrl) return '';

    // If already absolute or special protocol
    if (/^(https?:|\/\/|data:|mailto:|blob:)/i.test(pathOrUrl) || pathOrUrl.startsWith('#')) {
        return pathOrUrl;
    }

    const repoInfo = parseGitHubRepo(repoUrl);
    if (!repoInfo) return pathOrUrl;

    // Clean relative path (remove leading './' or '/')
    const cleanPath = pathOrUrl.replace(/^(\.\/|\/)+/, '');
    return `https://raw.githubusercontent.com/${repoInfo.owner}/${repoInfo.repo}/HEAD/${cleanPath}`;
}
