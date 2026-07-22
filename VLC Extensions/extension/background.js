/**
 * background.js — VLC YouTube Launcher
 *
 * Service Worker for the extension.
 * Handles extension install/update events.
 */

chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    console.log('[VLC Launcher] Extension installed successfully.');
  } else if (details.reason === 'update') {
    console.log('[VLC Launcher] Extension updated to version', chrome.runtime.getManifest().version);
  }
});
