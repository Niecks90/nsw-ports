# Changelog

All notable changes to the **NSW Ports** project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.1.0] - 2026-11-18

### Added
- **Game Detail Modal UX (`SidebarModal`)**:
  - Raw HTML rendering support in GitHub README previews via `rehype-raw` (e.g., centered `<p align="center">` headers, tables, and styled text).
  - Relative asset URL transformer resolving relative paths (e.g. `docs/images/pic.png`, `./assets/banner.png`) against repository raw content on GitHub (`https://raw.githubusercontent.com/{owner}/{repo}/HEAD/{clean_path}`).
  - Steam/Playnite-inspired ambient glow effect rendering blurred game cover art (`blur-2xl opacity-20 scale-110`) behind the sidebar column.
  - Dedicated **"Save Cover"** overlay button on the poster for downloading 600x900 box art directly.
  - Formatted `last_updated` date badge displayed alongside version and author tags.
  - Clickable **`By {author}`** badge to quickly filter the catalog by developer, with active filter indicator and reset option.
  - Compact notice reminding users that original commercial game files are required to play ports.
- **Main Grid & Card Readability (`GameCard`, `GameGrid`)**:
  - Permanent footer metadata below each 2:3 vertical poster displaying bold white game title and author for immediate readability on dark covers.
  - High-contrast console badges with `shadow-md` and `ring-1 ring-black/40`.
  - Glowing green `NEW` badge on cards updated within the last 7 days.
  - Dynamic result counter above the grid (`Showing X ports`) with active sub-filter chips and quick clear buttons.
- **Navigation & Discovery Controls (`Header`)**:
  - Matching port count badges inside all platform filter pills (e.g. `All (483)`, `PC (89)`, `Xbox 360 (85)`).
  - **"Recently Updated"** filter toggle chip with sparkles icon next to the sort dropdown.
  - **"Random Port"** button (dice icon) to quickly discover and inspect a random game.
- **Date & Version Utilities**:
  - Added `parseCatalogDate`, `isRecentlyUpdated`, and `formatDisplayDate` supporting `DD/MM/YYYY` catalog dates.
  - Added `formatVersion` utility stripping raw Markdown asterisks and prerelease annotations (e.g. `0.7.0 *prerelease*` → `v0.7.0`).

### Changed
- Rebranded leftover `"PortsDL-NX Desktop Launcher"` text to **"NSW Ports Desktop Launcher"** in the sidebar callout card.
- Capped desktop grid density at 7–8 columns (`grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 2xl:grid-cols-8`) for improved card breathing room.
- Fixed catalog date sorting by parsing `DD/MM/YYYY` strings instead of relying on default JS Date parsing.

---

## [1.0.0] - 2026-11-04

### Added
- **Brand Identity & Theming**:
  - Rebranded the application from *PortsDL-NX* to **NSW Ports**.
  - Vector SVG logo component (`Logo.tsx` / `logo.svg`) styled after Switch Joy-Con rails in neon cyan (`#00C3E3`) and neon red (`#FF4554`) with a centered port glyph.
  - Color-coded console badge palette for all platforms (Xbox, Xbox 360, GameCube, N64, Super Nintendo, Game Boy, GBA, GBC, Wii, Wii U, PlayStation, Dreamcast, Megadrive, Android, PC, Arcade).
- **Responsive UI / UX**:
  - Two-row wrapped filter bar layout on desktop viewports eliminating horizontal scrollbars.
  - Touch-friendly horizontal swipe for filter chips on mobile viewports (`overflow-x-auto no-scrollbar`).
  - Compact mobile navigation header with icon-based quick action triggers.
  - Fully scrollable detail modal (`SidebarModal.tsx`) with constrained mobile poster heights (`overflow-y-auto`).
  - Integrated Ko-fi support button linking directly to the project support page.
- **Community & Documentation**:
  - Dedicated footer component crediting RobZilla10001 with links to GitHub and the official GBAtemp thread.
  - Legal disclaimer specifying independent hobby status and non-affiliation with Nintendo.
  - Comprehensive `README.md` detailing project architecture, workflow automation, and local development guides.

### Changed
- Standardized and shortened platform labels across all game cards and filters (e.g., *Nintendo GameCube* → *GameCube*, *Sega Genesis* → *Megadrive*, *Microsoft Xbox 360* → *Xbox 360*).
- Chained GitHub Pages static deployment to trigger automatically upon successful completion of the catalog scraper (`workflow_run`).
- Repository relocated to `https://github.com/Niecks90/nsw-ports`.

### Fixed
- Resolved GitHub Actions `remote: Internal Server Error` (500) and `commit_refs` failures by switching to full history checkouts (`fetch-depth: 0`) and pulling with `--rebase`.
- Resolved GitHub Pages concurrency lockups by enabling `cancel-in-progress: true` on deployment runs.
- Fixed badge truncation bugs on card posters that cut off labels with ellipses (e.g., *Nintendo GameC...*).
- Removed legacy local asset requirement checks and heuristic warnings from the catalog output.

---

## [0.2.0] - 2026-10-29

### Added
- **Community Release & Public Showcase**:
  - First public deployment of the web showcase on GitHub Pages under the initial project name *PortsDL-NX*[cite: 16].
  - Announcement and presentation on the official GBAtemp forums[cite: 16].
- **Card Artwork Features**:
  - Added support for right-click / context menu saving of box art posters directly from the game detail view[cite: 16].
  - Introduced the manual `overrides.json` dictionary mapping to fix missing or misidentified SteamGridDB IDs[cite: 16].

---

## [0.1.0] - 2026-10-28

### Added
- **Scraper & Pipeline Automation**:
  - Initial implementation of the Python standalone parser (`update_catalog.py`) extracting community ports from RobZilla10001's upstream `README.md`[cite: 13, 14].
  - Automatic conversion and normalization of raw GitHub repository slugs (`user/repo`) into valid HTTPS URLs[cite: 13].
  - Integration with SteamGridDB autocomplete and grid endpoints to fetch vertical 600x900 cover artwork[cite: 14].
  - Automated GitHub Actions workflow (`.github/workflows/update-catalog.yml`) with scheduled cron runs and `workflow_dispatch`[cite: 13].
- **Desktop Companion App Core (WIP)**:
  - Tauri v2 application skeleton initialized with React and Tailwind CSS[cite: 14, 15].
  - Rust IPC commands for file extraction, staging, and single-threaded passive FTP transfers tailored for Switch `sys-ftpd` on port 5000[cite: 14, 15].
  - Persistent settings management configured via `@tauri-apps/plugin-store` for SteamGridDB API credentials and console IP addresses[cite: 15].

### Fixed
- Fixed regex character range parsing errors (`bad character range \s-:`) when reading Markdown table separators in `update_catalog.py`[cite: 13].
