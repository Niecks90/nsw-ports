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
- 🏷️ **Console Badging**: Color-coded, authentic platform tags (Dreamcast, Xbox, GameCube, N64, Megadrive, PC, Android, etc.) with responsive two-row filtering.
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
