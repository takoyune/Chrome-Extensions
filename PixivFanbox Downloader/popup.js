// popup.js — Logic for the Fanbox Downloader extension popup

// ─── DOM refs ──────────────────────────────────────────────────────
const statusEl      = document.getElementById('status');
const statusDot     = document.getElementById('statusDot');
const downloadBtn   = document.getElementById('downloadBtn');
const imageList     = document.getElementById('image-preview');
const qualityNote   = document.getElementById('qualityNote');
const qualityText   = document.getElementById('qualityNoteText');
const btnFull       = document.getElementById('btnFull');
const btnPreview    = document.getElementById('btnPreview');

// ─── State ─────────────────────────────────────────────────────────
let imageData   = { full: [], preview: [] }; // from content.js
let postId      = 'unknown';
let quality     = 'full'; // 'full' | 'preview'

// ─── SVG Icons ─────────────────────────────────────────────────────
const DOWNLOAD_ICON = `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3"/></svg>`;
const CHECK_ICON    = `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5"/></svg>`;
const IMAGE_ICON    = `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.8" stroke="currentColor" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909M3.75 18h16.5M3.75 4.5h16.5a1.5 1.5 0 0 1 1.5 1.5v10.5a1.5 1.5 0 0 1-1.5 1.5H3.75a1.5 1.5 0 0 1-1.5-1.5V6a1.5 1.5 0 0 1 1.5-1.5Z"/></svg>`;

// ─── Helpers ───────────────────────────────────────────────────────
function setStatus(msg, type = '') {
  statusEl.innerHTML = msg;
  statusEl.className = type;
  statusDot.className = 'status-dot ' + (type || 'scanning');
}

function setBtnContent(html) {
  downloadBtn.innerHTML = html;
}

/** Return the currently selected image URL list */
function getActiveImages() {
  return quality === 'full' ? imageData.full : imageData.preview;
}

// ─── Quality Toggle ────────────────────────────────────────────────
function setQuality(newQuality) {
  quality = newQuality;

  const isFull = quality === 'full';

  btnFull.classList.toggle('active', isFull);
  btnPreview.classList.toggle('active', !isFull);
  btnFull.setAttribute('aria-pressed', isFull ? 'true' : 'false');
  btnPreview.setAttribute('aria-pressed', isFull ? 'false' : 'true');

  // Update quality note
  if (isFull) {
    qualityNote.className = 'quality-note full';
    qualityText.textContent = 'Original files · Best quality';
  } else {
    qualityNote.className = 'quality-note preview';
    qualityText.textContent = 'Thumbnail files · Smaller size';
  }

  // Re-render image list if we already have data
  const imgs = getActiveImages();
  if (imgs.length > 0) {
    renderImageList(imgs);
    const count = imgs.length;
    const chipHtml = `<span class="count-chip">${count} image${count > 1 ? 's' : ''}</span>`;
    statusEl.innerHTML = `Found ${chipHtml} ready to download`;
    statusEl.className = 'success';
    statusDot.className = 'status-dot success';
  }
}

btnFull.addEventListener('click',    () => setQuality('full'));
btnPreview.addEventListener('click', () => setQuality('preview'));

// ─── Render image filename list ────────────────────────────────────
function renderImageList(urls) {
  imageList.innerHTML = '';
  imageList.style.display = 'flex';

  urls.forEach((url, i) => {
    const filename = url.split('/').pop();
    const item = document.createElement('div');
    item.className = 'image-item';
    item.setAttribute('role', 'listitem');
    item.setAttribute('title', url);
    item.style.animationDelay = `${i * 25}ms`;
    item.innerHTML = IMAGE_ICON + `<span>${filename}</span>`;
    imageList.appendChild(item);
  });
}

// ─── Init ───────────────────────────────────────────────────────────
async function init() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

  if (!tab?.url) {
    setStatus('Cannot access this tab.', 'error');
    return;
  }

  const isFanbox = tab.url.includes('fanbox.cc');

  if (!isFanbox) {
    setStatus('Not on a Fanbox page.', 'warning');
    downloadBtn.disabled = false;
    setBtnContent('Open Fanbox');
    downloadBtn.addEventListener('click', () => {
      chrome.tabs.create({ url: 'https://www.fanbox.cc' });
      window.close();
    });
    return;
  }

  try {
    const results = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      files: ['content.js'],
    });

    const result = results?.[0]?.result;

    if (!result) {
      setStatus('Could not scan page. Try refreshing.', 'error');
      return;
    }

    imageData.full    = result.full    || [];
    imageData.preview = result.preview || [];
    postId            = result.postId  || 'unknown';

    const imgs = getActiveImages();

    if (imgs.length === 0) {
      setStatus('No images found on this page.', 'warning');
      return;
    }

    // Show status + list
    const count = imgs.length;
    const chipHtml = `<span class="count-chip">${count} image${count > 1 ? 's' : ''}</span>`;
    statusEl.innerHTML = `Found ${chipHtml} ready to download`;
    statusEl.className = 'success';
    statusDot.className = 'status-dot success';

    renderImageList(imgs);
    qualityNote.style.display = 'flex';

    downloadBtn.disabled = false;
    downloadBtn.addEventListener('click', startDownload);

  } catch (err) {
    setStatus('Error: ' + (err.message || 'Unknown error'), 'error');
    console.error('[Fanbox Downloader]', err);
  }
}

// ─── Download ───────────────────────────────────────────────────────
function startDownload() {
  const urls = getActiveImages();
  if (!urls.length) return;

  downloadBtn.disabled = true;
  setBtnContent(`<div class="spinner" aria-label="Downloading"></div> Downloading…`);

  chrome.runtime.sendMessage(
    { action: 'downloadImages', urls, postId },
    (response) => {
      if (chrome.runtime.lastError) {
        setStatus('Error: ' + chrome.runtime.lastError.message, 'error');
        downloadBtn.disabled = false;
        setBtnContent(DOWNLOAD_ICON + ' Download All');
        return;
      }

      if (response?.success) {
        const count = response.count;
        const chipHtml = `<span class="count-chip">${count} file${count > 1 ? 's' : ''}</span>`;
        statusEl.innerHTML = `Saving ${chipHtml} to Downloads…`;
        statusEl.className = 'success';
        statusDot.className = 'status-dot success';
        setBtnContent(CHECK_ICON + ' Done!');
        setTimeout(() => window.close(), 1800);
      } else {
        setStatus(response?.error || 'Download failed.', 'error');
        downloadBtn.disabled = false;
        setBtnContent(DOWNLOAD_ICON + ' Download All');
      }
    }
  );
}

// ─── Boot ────────────────────────────────────────────────────────────
setBtnContent(DOWNLOAD_ICON + ' Download All');
init();
