<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="https://capsule-render.vercel.app/api?type=rect&color=0:0f172a,50:1e293b,100:0f172a&height=180&section=header&text=NSW%20Ports&fontSize=65&fontAlignY=42&desc=The%20Ultimate%20Nintendo%20Switch%20Ports%20Catalog%20%26%20Companion&descFontSize=19&descAlignY=66&fontColor=ffffff&stroke=00C3E3&strokeWidth=2">
    <img alt="NSW Ports Banner" src="https://capsule-render.vercel.app/api?type=rect&color=0:0f172a,50:1e293b,100:0f172a&height=180&section=header&text=NSW%20Ports&fontSize=65&fontAlignY=42&desc=The%20Ultimate%20Nintendo%20Switch%20Ports%20Catalog%20%26%20Companion&descFontSize=19&descAlignY=66&fontColor=ffffff">
  </picture>
</p>

<p align="center">
  <a href="https://niecks90.github.io/nsw-ports/"><img src="https://img.shields.io/badge/Live%20Showcase-Visit%20Website-00C3E3?style=for-the-badge&logo=googlechrome&logoColor=white" alt="Live Showcase"></a>
  <a href="https://ko-fi.com/niecks90"><img src="https://img.shields.io/badge/Support-Ko--Fi-FF5E5B?style=for-the-badge&logo=kofi&logoColor=white" alt="Ko-fi"></a>
  <a href="https://github.com/Niecks90/nsw-ports/actions"><img src="https://img.shields.io/github/actions/workflow/status/Niecks90/nsw-ports/update-catalog.yml?branch=main&label=Catalog%20Sync&style=for-the-badge&color=22c55e" alt="Catalog Status"></a>
  <img src="https://img.shields.io/badge/License-MIT-slate?style=for-the-badge" alt="License">
</p>

<p align="center">
  A modern, automated web visualizer and companion hub indexing over <b>400+ console and PC ports</b> created by the homebrew community for the <b>Nintendo Switch</b>.
</p>

---

## 🌟 Overview

**NSW Ports** bridges the gap between raw community documentation and players. Instead of browsing through massive text tables across multiple forums, this project provides a clean, visual, and reactive showcase with vertical 2:3 box arts, detailed release notes, asset requirements, and direct repository links.

### Key Highlights
- 🔄 **Fully Automated Scraper**: Runs on a daily schedule via GitHub Actions to sync additions directly from RobZilla10001's upstream list.
- 🎨 **Rich Box Art Integration**: Automatic high-resolution cover lookup powered by the **SteamGridDB** API, backed by a persistent cache and override dictionary.
- 🏷️ **Console Badging**: Color-coded, authentic platform tags (Dreamcast, Xbox, GameCube, Nintendo64, Megadrive, PC, Android, etc.) with responsive filtering.
- 📱 **Mobile & Desktop Optimized**: Clean swipeable filter chips on mobile devices and zero horizontal layout shifting.
- 🖥️ **Windows Companion App (WIP)**: A native desktop client powered by Tauri v2 and Rust designed for 1-click downloads, staging, and direct sequential FTP push to the Switch (`sys-ftpd` on port 5000).

---

## 🖥️ Live Showcase & Desktop App

| Component | Status | Access / Download |
| :--- | :--- | :--- |
| **Web Showcase** | 🟢 Live & Automated | [Launch NSW Ports](https://niecks90.github.io/nsw-ports/) |
| **Windows Desktop App** | 🟡 In Active Development | Tauri v2 (Rust) client featuring FTP / SD staging |

---

## ⚙️ Architecture & Pipeline

```
[robzilla10001/SwitchPorts] (Upstream README.md)
            │
            ▼  (Scheduled GitHub Actions Workflow / update_catalog.py)
   [Catalog Scraper] ───► Query SteamGridDB API (Missing covers only)
            │
            ├── Load overrides.json (Fixed art & IDs have priority)
            ├── Load existing catalog.json (Cache preservation)
            │
            ▼
    [catalog.json] (Normalized dataset)
            │
            ├───────────────┬────────────────┐
            ▼               ▼                ▼
     [GitHub Pages]   [Tauri Frontend]  [Tauri Rust Core]
    (Static Web UI)    (Desktop GUI)     (FTP / SD Staging)
```

### Automated Catalog Sync
1. `update_catalog.py` reads the upstream Markdown tables, parses titles, authors, releases, and firmware updates.
2. The script checks `overrides.json` for manually corrected box art URLs or SteamGridDB IDs.
3. If not overridden, it preserves previously discovered valid URLs from `catalog.json` to prevent unnecessary API consumption.
4. Changes are automatically committed by `github-actions[bot]` with `--rebase` and `fetch-depth: 0` to preserve repository integrity.

---

## 🛠️ Tech Stack

- **Frontend Showcase**: React 18, TypeScript, Tailwind CSS, Vite, Lucide Icons.
- **Scraper & CI/CD**: Python 3.11, GitHub Actions (automated cron & dispatch).
- **Artwork Provider**: SteamGridDB REST API.
- **Desktop Companion**: Tauri v2, Rust (Tokio, Reqwest, SuppaFTP).

---

## 💻 Local Development

### Prerequisites
- Node.js (v20 or newer)
- Python 3.11+
- Git

### Installation
```bash
# Clone the repository
git clone https://github.com/Niecks90/nsw-ports.git
cd nsw-ports

# Install web dependencies
npm install

# Start local web development server
npm run dev
```

### Running the Scraper Locally
```bash
# Optional: export your SteamGridDB API key
export SGDB_API_KEY="your_api_key_here"

# Execute the scraper
python update_catalog.py
```

---

## 🤝 Community Credits & Acknowledgments

This project would not exist without the dedication of homebrew developers and curators:

- **[RobZilla10001](https://github.com/robzilla10001)**: Creator and maintainer of the indispensable [SwitchPorts repository](https://github.com/robzilla10001/SwitchPorts) and the official [GBAtemp Ports Thread](https://gbatemp.net/threads/ultimate-switch-port-thread.683071/).
- **Homebrew Authors**: Huge respect to all developers porting classic PC games and console engines natively to Horizon OS (NaGaa95, ChanseyIsTheBest, Thorhax, delsonazevedo, Gerisson, and many more).
- **[SteamGridDB](https://www.steamgriddb.com/)**: For hosting and providing access to community box art and vertical grid artwork.

---

## ☕ Support the Project

If you find NSW Ports useful or want to support ongoing work on the web showcase and the upcoming Windows companion app:

<p align="center">
  <a href="https://ko-fi.com/niecks90">
    <img src="https://storage.ko-fi.com/cdn/kofi3.png?v=3" height="42" alt="Buy Me a Coffee at ko-fi.com" />
  </a>
</p>

---

## ⚖️ Legal Disclaimer

**NSW Ports is an independent community hobby project and is not affiliated with, endorsed, sponsored, or approved by Nintendo Co., Ltd., Nintendo of America Inc., or any game publisher.**

- *Nintendo Switch* is a registered trademark of Nintendo.
- NSW Ports does not host, distribute, or pirate proprietary game files, ROMs, or copyrighted game assets.
- All downloads and source links redirect to community-maintained open-source repositories, publicly hosted standalone homebrew executables (`.nro`), or official development threads. Users must provide their own legally acquired game assets when required.

---

<p align="center">
  Made with ❤️ and AI by <a href="https://github.com/Niecks90"><b>Niecks90</b></a>
</p>
