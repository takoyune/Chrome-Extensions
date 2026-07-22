# 🌐 Translate Web — Chrome Extension

A beautiful, powerful Chrome Extension to translate any selected text or full page using **Google Cloud Translation API**.

## Features

- 🖱 **Right-click** any selected text → "Translate with Translate Web"
- ⌨️ **Hotkey** (default: Alt+T) translates selected text instantly
- 🎯 **Floating popup** with source/target language detection — no page navigation
- 📋 **One-click copy** translation to clipboard
- 🔧 **Toolbar popup** for typing/pasting text directly
- ⚙️ **Options page** for API key, language, and hotkey settings
- 🌙 Beautiful dark UI using Shadow DOM — never breaks website styles

## Setup

### 1. Get a Google Translate API Key (Free)

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a project → Enable **Cloud Translation API**
3. Go to **APIs & Services → Credentials → Create API Key**
4. Copy the key

> **Free tier:** 500,000 characters/month — plenty for personal use.

### 2. Install the Extension

1. Open `chrome://extensions`
2. Enable "Developer mode" (top right)
3. Click "Load unpacked" → select this folder
4. Click the 🌐 icon in the toolbar

### 3. Add Your API Key

1. Click ⚙ in the toolbar popup or right-click the icon → "Options"
2. Paste your API key and click "Test Connection"
3. Click "Save Settings"

## Usage

| Action | How |
|--------|-----|
| Translate selected text | Select text → right-click → "Translate with Translate Web" |
| Translate with hotkey | Select text → press `Alt+T` |
| Type text to translate | Click toolbar icon → type/paste → click Translate |
| Change target language | Options page → "Translate To" |
| Change hotkey | Options page → Hotkey section |

## Privacy

- Your API key is stored locally in `chrome.storage.sync` (synced to your Google account)
- Text is sent directly to Google Cloud Translation API — no third-party servers
