// background.js — Service Worker for Fanbox Image Downloader

chrome.action.onClicked.addListener(async (tab) => {
  // This won't fire when a popup is defined, but kept for safety.
  // The popup handles everything.
});

// Listen for messages from popup.js
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'downloadImages') {
    const { urls, postId } = message;

    if (!urls || urls.length === 0) {
      sendResponse({ success: false, count: 0, error: 'No images found on this page.' });
      return;
    }

    let downloadCount = 0;

    urls.forEach((url, index) => {
      // Extract original filename from URL
      const urlParts = url.split('/');
      const rawFilename = urlParts[urlParts.length - 1];

      // Build a clean filename: postId_index_originalname
      const filename = `fanbox_${postId}_${String(index + 1).padStart(2, '0')}_${rawFilename}`;

      chrome.downloads.download(
        {
          url: url,
          filename: filename,
          conflictAction: 'uniquify',
        },
        (downloadId) => {
          if (chrome.runtime.lastError) {
            console.error(`[Fanbox Downloader] Failed to download ${url}:`, chrome.runtime.lastError.message);
          } else {
            downloadCount++;
            console.log(`[Fanbox Downloader] Started download #${downloadId}: ${filename}`);
          }
        }
      );
    });

    sendResponse({ success: true, count: urls.length });
    return true; // Keep message channel open for async
  }
});
