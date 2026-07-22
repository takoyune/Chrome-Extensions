# PixivFanbox Downloader & Duplicate Viewer

A browser extension and Python utility combo for downloading full-resolution images from Pixiv Fanbox posts and managing image duplicates.

## Features

- **One-Click Download**: Extract and download all original full-resolution images from a Pixiv Fanbox post.
- **Background Downloads**: Uses Chrome's `downloads` API for reliable downloading.
- **Duplicate Viewer Utility**: Includes a Python GUI script (`duplicate_viewer.py`) to inspect and delete duplicate image files.

## Directory Structure

- `manifest.json`: Chrome Extension Manifest V3 configuration.
- `content.js`: Scrapes image URLs from Pixiv Fanbox post DOM.
- `background.js`: Handles download requests via Chrome downloads API.
- `popup.html` & `popup.js`: Popup interface showing image preview counts and trigger button.
- `duplicate_viewer.py`: Desktop Python application for reviewing and cleaning up duplicate images.

## Installation

1. Open Chrome and navigate to `chrome://extensions/`.
2. Enable **Developer mode** in the top right corner.
3. Click **Load unpacked**.
4. Select the `PixivFanbox Downloader` folder.

## How to Use

1. Navigate to any Pixiv Fanbox post (`https://*.fanbox.cc/...`).
2. Click the **Fanbox Image Downloader** extension icon in your toolbar.
3. Click the download button in the popup to save all post images.
4. *(Optional)* Run `python duplicate_viewer.py` to organize and clean up downloaded images on your computer.
