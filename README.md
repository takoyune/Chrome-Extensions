# Chrome Extensions Suite & Utilities

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Manifest V3](https://img.shields.io/badge/Chrome-Manifest%20V3-green.svg)](https://developer.chrome.com/docs/extensions/mv3/intro/)
[![Latest Release](https://img.shields.io/github/v/release/takoyune/Chrome-Extensions?color=orange)](https://github.com/takoyune/Chrome-Extensions/releases/latest)
[![Package Extensions](https://github.com/takoyune/Chrome-Extensions/actions/workflows/package.yml/badge.svg)](https://github.com/takoyune/Chrome-Extensions/actions)
[![Status](https://img.shields.io/badge/Status-Active%20%26%20Growing-brightgreen.svg)](#)

A growing monorepo collection of custom Chrome Extensions (Manifest V3) and companion desktop utilities designed for media automation, ad skipping, translation, productivity, and video streaming.

> 📌 **Note:** New extensions and small utility tools will be continuously added to this repository as they are developed.

---

## ⚡ Download Pre-packaged Extensions (Releases)

Download ready-to-use `.zip` packages directly from the official **GitHub Releases**:

📦 **[Download v1.0.0 Release Packages](https://github.com/takoyune/Chrome-Extensions/releases/tag/v1.0.0)**

---

## 📂 Projects Directory

| Project Name | Type | Description | Link |
| :--- | :--- | :--- | :--- |
| **Glitch Ad Skipper** | Chrome Extension + Windows Helper | YouTube ad skipper using injected player controls and custom protocol triggers. | [View Project](./Glitch%20Ad%20Skipper/) |
| **PixivFanbox Downloader** | Chrome Extension + Python Tool | One-click Pixiv Fanbox full-resolution image downloader with a Python duplicate viewer app. | [View Project](./PixivFanbox%20Downloader/) |
| **Translate Web** | Chrome Extension | Multilingual webpage and text selection translator powered by Google Translation API. | [View Project](./Translate%20Web/) |
| **VLC Extensions** | Chrome Extension + Windows Helper | Open current YouTube videos in desktop VLC Media Player at exact timestamps using `yt-dlp`. | [View Project](./VLC%20Extensions/) |

---

## 🛠️ General Installation (Chrome Extensions)

All extensions in this repository are built for **Chrome Manifest V3**.

### Option A: From GitHub Releases (Recommended)
1. Go to the [Latest Release Page](https://github.com/takoyune/Chrome-Extensions/releases/latest).
2. Download the `.zip` file for the extension you want (e.g. `Glitch-Ad-Skipper.zip`, `PixivFanbox-Downloader.zip`, etc.).
3. Extract the `.zip` file.
4. Open Chrome and go to `chrome://extensions/`.
5. Enable **Developer mode** in the top right corner.
6. Click **Load unpacked** and select the unzipped folder.

### Option B: From Source Code
1. Clone this repository:
   ```bash
   git clone https://github.com/takoyune/Chrome-Extensions.git
   ```
2. Open Google Chrome and navigate to `chrome://extensions/`.
3. Enable **Developer mode** using the toggle switch in the top-right corner.
4. Click **Load unpacked** and select the desired project folder.

---

## 📋 Overview of Included Tools

### ⚡ [Glitch Ad Skipper](./Glitch%20Ad%20Skipper/)
- Injects a "Glitch Skip" button directly into the YouTube HTML5 player.
- Instantly skips video ads using protocol handler triggers and player manipulation.

### 🖼️ [PixivFanbox Downloader](./PixivFanbox%20Downloader/)
- Scrapes original high-resolution images from Pixiv Fanbox posts (`*.fanbox.cc`).
- Includes `duplicate_viewer.py` to inspect and clean up duplicate image files locally.

### 🌐 [Translate Web](./Translate%20Web/)
- Full-featured page and selection translator.
- Includes context menus, inline overlays, and customizable language options.

### 🎬 [VLC Extensions](./VLC%20Extensions/)
- Seamlessly hand off YouTube streams from Chrome to local VLC Media Player.
- Preserves playback timestamp and uses `yt-dlp` for stream processing.

---

## ➕ Adding New Extensions

Whenever a new extension is created in this folder:
1. Create a new directory named after the extension.
2. Include a `manifest.json` (Manifest V3) and relevant content/background scripts.
3. Add a project-level `README.md` inside the project folder explaining its feature set.
4. Update the main table in the root `README.md`.

---

## 📄 License

Distributed under the **MIT License**. See [`LICENSE`](LICENSE) for more information.
