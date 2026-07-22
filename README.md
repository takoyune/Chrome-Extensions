# Chrome Extensions Suite & Utilities

A collection of custom Chrome Extensions (Manifest V3) and companion desktop utilities designed to enhance YouTube playback, media downloading, web translation, and video streaming.

---

## 📂 Projects Directory

| Project Name | Type | Description | Link |
| :--- | :--- | :--- | :--- |
| **Glitch Ad Skipper** | Chrome Extension + Windows Helper | YouTube ad skipper using injected player controls and custom protocol triggers. | [View Project](./Glitch%20Ad%20Skipper/) |
| **Photo Downloader** | Chrome Extension + Python Tool | One-click Pixiv Fanbox full-resolution image downloader with a Python duplicate viewer app. | [View Project](./Photo%20Downloader/) |
| **Translate Web** | Chrome Extension | Multilingual webpage and text selection translator powered by Google Translation API. | [View Project](./Translate%20Web/) |
| **VLC Extensions** | Chrome Extension + Windows Helper | Open current YouTube videos in desktop VLC Media Player at exact timestamps using `yt-dlp`. | [View Project](./VLC%20Extensions/) |

---

## 🛠️ General Installation (Chrome Extensions)

All extensions in this repository are built with **Manifest V3**.

1. Clone or download this repository:
   ```bash
   git clone https://github.com/your-username/your-repo-name.git
   ```
2. Open Google Chrome and go to `chrome://extensions/`.
3. Enable **Developer mode** using the toggle switch in the top-right corner.
4. Click **Load unpacked**.
5. Select the specific extension folder (or `extension/` subfolder for VLC Extensions).

---

## 📋 Overview of Included Tools

### ⚡ [Glitch Ad Skipper](./Glitch%20Ad%20Skipper/)
- Injects a "Glitch Skip" button directly into the YouTube HTML5 player.
- Instantly skips video ads using protocol handler triggers and player manipulation.

### 🖼️ [Photo Downloader](./Photo%20Downloader/)
- Scrapes original high-resolution images from Pixiv Fanbox posts (`*.fanbox.cc`).
- Includes `duplicate_viewer.py` to inspect and clean up duplicate image files locally.

### 🌐 [Translate Web](./Translate%20Web/)
- Full-featured page and selection translator.
- Includes context menus, inline overlays, and customizable language options.

### 🎬 [VLC Extensions](./VLC%20Extensions/)
- Seamlessly hand off YouTube streams from Chrome to local VLC Media Player.
- Preserves playback timestamp and uses `yt-dlp` for stream processing.

---

## 📄 License

This repository is maintained for personal use and custom browser extensions. Feel free to adapt and modify the scripts for your own setups.
