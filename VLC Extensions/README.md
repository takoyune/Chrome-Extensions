# VLC YouTube Launcher

A hybrid Chrome extension and Windows helper that lets you open the currently playing YouTube video directly inside **VLC Media Player** at the exact current timestamp with one click.

## Features

- **Timestamp Sync**: Opens videos in VLC starting right where you paused/left off in Chrome.
- **High-Quality Streaming**: Uses `yt-dlp` in the background to handle stream extraction.
- **One-Click Execution**: Integrated Chrome popup button and optional context menu.

## Components

- **`extension/`**: Chrome Extension (Manifest V3)
  - Grabs active YouTube video URL and current player timestamp.
  - Sends launch request via custom protocol link.
- **`windows/`**: Windows Native Helper & Scripts
  - `install.bat`: Registers the custom URI protocol handler in the Windows Registry.
  - `launch_vlc.bat` / `launch_vlc.vbs`: Launches VLC with the extracted stream.
  - `yt-dlp.exe`: Stream extraction engine.

## Installation

### 1. Setup Windows Protocol Handler
1. Open the `windows/` folder.
2. Run `install.bat` as Administrator to register the protocol handler in Windows.

### 2. Load Chrome Extension
1. Open Chrome and navigate to `chrome://extensions/`.
2. Enable **Developer mode** in the top right.
3. Click **Load unpacked** and select the `VLC Extensions/extension` directory.

## Usage

1. Watch any YouTube video in Chrome.
2. Click the **Open in VLC** extension icon.
3. The video will automatically open in desktop VLC Media Player at your current playback position.
