/**
 * popup.js — VLC YouTube Launcher
 *
 * Responsibilities:
 * 1. Query the active tab for YouTube video info (title, channel, thumbnail, timestamp)
 * 2. Render the correct state (loading, not-youtube, ready, error)
 * 3. On button click: pause YouTube in browser, build playvlc:// URI, open it
 */

/* ── State elements ── */
const stateLoading   = document.getElementById('state-loading');
const stateNotYT     = document.getElementById('state-not-youtube');
const stateError     = document.getElementById('state-error');
const stateReady     = document.getElementById('state-ready');
const errorMessage   = document.getElementById('error-message');

/* ── Ready-state elements ── */
const videoThumb     = document.getElementById('video-thumb');
const videoTitle     = document.getElementById('video-title');
const videoChannel   = document.getElementById('video-channel');
const timestampBadge = document.getElementById('timestamp-badge');
const btnOpenVlc     = document.getElementById('btn-open-vlc');
const useTimestamp   = document.getElementById('use-timestamp');
const successFlash   = document.getElementById('success-flash');

/* ── Helpers ── */
function showState(el) {
  [stateLoading, stateNotYT, stateError, stateReady].forEach(s => s.classList.add('hidden'));
  el.classList.remove('hidden');
}

function formatTimestamp(seconds) {
  const s = Math.floor(seconds);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (h > 0) {
    return `${h}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
  }
  return `${m}:${String(sec).padStart(2, '0')}`;
}

/** Extract YouTube video ID from a URL string */
function getVideoId(url) {
  try {
    const u = new URL(url);
    if (u.hostname.includes('youtu.be')) return u.pathname.slice(1);
    return u.searchParams.get('v') || null;
  } catch {
    return null;
  }
}

/* ── Main logic ── */
async function init() {
  showState(stateLoading);

  let tab;
  try {
    const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });
    tab = activeTab;
  } catch (err) {
    showState(stateError);
    errorMessage.textContent = 'Could not access the current tab.';
    return;
  }

  const url = tab.url || '';
  const videoId = getVideoId(url);

  if (!videoId) {
    showState(stateNotYT);
    return;
  }

  // Inject content script to get richer page data
  let pageData = null;
  try {
    const results = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: extractYouTubeData,
    });
    pageData = results[0]?.result;
  } catch (err) {
    // Fallback: use URL only
    pageData = null;
  }

  const currentTime = pageData?.currentTime ?? 0;
  const title       = pageData?.title ?? tab.title ?? 'Unknown Video';
  const channel     = pageData?.channel ?? '';

  // Build thumbnail URL from video ID (maxresdefault with fallback)
  const thumbUrl = `https://i.ytimg.com/vi/${videoId}/mqdefault.jpg`;

  // Populate UI
  videoThumb.src = thumbUrl;
  videoThumb.alt = `Thumbnail for ${title}`;
  videoTitle.textContent = title;
  videoTitle.title = title;
  videoChannel.textContent = channel;
  timestampBadge.textContent = formatTimestamp(currentTime);

  showState(stateReady);

  // Button handler
  btnOpenVlc.addEventListener('click', async () => {
    const shouldUseTimestamp = useTimestamp.checked;
    const ts = shouldUseTimestamp ? Math.floor(currentTime) : 0;

    // Build a clean YouTube URL with timestamp
    const ytBase = `https://www.youtube.com/watch?v=${videoId}`;
    const ytWithTs = ts > 0 ? `${ytBase}&t=${ts}` : ytBase;

    // Build a safe protocol URI Chrome won't normalize.
    // OLD: playvlc://encodedYouTubeUrl — Chrome treats encoded URL as "host" and strips it.
    // NEW: playvlc://localhost?v=VIDEO_ID&t=TIMESTAMP — clean params Chrome preserves.
    const protocolUri = `playvlc://localhost?v=${encodeURIComponent(videoId)}&t=${ts}`;

    // Auto-pause the YouTube video in the browser
    try {
      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: pauseYouTubeVideo,
      });
    } catch {
      // Silently ignore — pausing is best-effort
    }

    // Trigger the custom protocol by injecting a hidden anchor click into the
    // YouTube page. This is the ONLY reliable way to fire a custom protocol
    // handler (playvlc://) from a Chrome extension — chrome.tabs.create/update
    // do NOT invoke protocol handlers, but a real DOM anchor click does.
    try {
      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: (uri) => {
          const a = document.createElement('a');
          a.href = uri;
          a.style.display = 'none';
          document.body.appendChild(a);
          a.click();
          // Clean up after a short delay
          setTimeout(() => a.remove(), 1000);
        },
        args: [protocolUri],
      });
    } catch (err) {
      // Fallback: open in a new tab (user will see Chrome's "Open app?" prompt)
      await chrome.tabs.create({ url: protocolUri, active: true });
    }

    // Show success flash
    btnOpenVlc.disabled = true;
    successFlash.classList.remove('hidden');

    // Re-enable after 3 seconds
    setTimeout(() => {
      successFlash.classList.add('hidden');
      btnOpenVlc.disabled = false;
    }, 3000);
  });


}

/* ── Functions injected into the page (must be self-contained) ── */



/** Extracts video data from the YouTube DOM */
function extractYouTubeData() {
  const video = document.querySelector('video');
  const currentTime = video ? video.currentTime : 0;

  // Title
  const titleEl =
    document.querySelector('h1.ytd-watch-metadata yt-formatted-string') ||
    document.querySelector('#title h1 yt-formatted-string') ||
    document.querySelector('h1.title');
  const title = titleEl ? titleEl.textContent.trim() : document.title;

  // Channel
  const channelEl =
    document.querySelector('#channel-name a') ||
    document.querySelector('ytd-channel-name a') ||
    document.querySelector('#owner #channel-name');
  const channel = channelEl ? channelEl.textContent.trim() : '';

  return { currentTime, title, channel };
}

/** Pauses the YouTube video element */
function pauseYouTubeVideo() {
  const video = document.querySelector('video');
  if (video && !video.paused) {
    video.pause();
  }
}

/* ── Bootstrap ── */
document.addEventListener('DOMContentLoaded', init);
