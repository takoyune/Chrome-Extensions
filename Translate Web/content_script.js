// ─── State ───────────────────────────────────────────────────────────────────
let popupHost = null;       // The <div> injected into the page
let shadowRoot = null;      // The Shadow DOM root
let popupEl = null;         // The .tw-popup element inside shadow DOM
let hideTimer = null;

// Translation State
let isPageTranslated = false;
const originalTextMap = new Map();

// ─── Create popup once (uses Shadow DOM to avoid CSS conflicts) ──────────────
function ensurePopup() {
  if (popupHost) return;

  popupHost = document.createElement('div');
  popupHost.id = 'translate-web-host';
  popupHost.style.cssText = 'all:unset;position:fixed;z-index:2147483646;';
  document.documentElement.appendChild(popupHost);

  shadowRoot = popupHost.attachShadow({ mode: 'open' });

  // Inject stylesheet into shadow DOM
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = chrome.runtime.getURL('content_style.css');
  shadowRoot.appendChild(link);

  popupEl = document.createElement('div');
  popupEl.className = 'tw-popup';
  shadowRoot.appendChild(popupEl);

  // Close on outside click
  document.addEventListener('mousedown', (e) => {
    if (popupHost && !popupHost.contains(e.target)) {
      hidePopup();
    }
  });

  // Keyboard: Escape to close
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') hidePopup();
  });
}

// ─── Position popup near mouse/selection ─────────────────────────────────────
function positionPopup(x, y) {
  const margin = 12;
  const popupW = 460;
  const popupH = 200; // approximate

  let left = x + margin;
  let top = y + margin;

  if (left + popupW > window.innerWidth) left = x - popupW - margin;
  if (top + popupH > window.innerHeight) top = y - popupH - margin;

  left = Math.max(margin, left);
  top = Math.max(margin, top);

  popupEl.style.left = `${left}px`;
  popupEl.style.top = `${top}px`;
}

// ─── Show loading state ───────────────────────────────────────────────────────
function showLoading(x, y, message = 'Translating…', progress = null) {
  ensurePopup();
  clearTimeout(hideTimer);

  let progressHtml = '';
  if (progress !== null) {
    progressHtml = `<div style="width:100%; height:4px; background:rgba(255,255,255,0.1); border-radius:2px; margin-top:12px; overflow:hidden;">
                      <div style="width:${progress}%; height:100%; background:#6c63ff; transition:width 0.2s;"></div>
                    </div>
                    <div style="font-size:11px; text-align:right; margin-top:4px; color:#8888a0;">${progress}%</div>`;
  }

  popupEl.innerHTML = `
    <div class="tw-header">
      <span class="tw-brand"><span class="tw-brand-icon">🌐</span> Translate Web</span>
      <button class="tw-close" title="Close">×</button>
    </div>
    <div class="tw-loading" style="display:flex; flex-direction:column; align-items:flex-start;">
      <div style="display:flex; align-items:center; gap:10px;">
        <div class="tw-spinner"></div>
        ${escHtml(message)}
      </div>
      ${progressHtml}
    </div>
  `;

  shadowRoot.querySelector('.tw-close').addEventListener('click', hidePopup);
  positionPopup(x, y);
  requestAnimationFrame(() => popupEl.classList.add('tw-visible'));
}

// ─── Show Success ─────────────────────────────────────────────────────────────
function showSuccess(x, y, message) {
  ensurePopup();
  clearTimeout(hideTimer);

  popupEl.innerHTML = `
    <div class="tw-header">
      <span class="tw-brand"><span class="tw-brand-icon">🌐</span> Translate Web</span>
      <button class="tw-close" title="Close">×</button>
    </div>
    <div class="tw-loading" style="display:flex; align-items:center; gap:10px; color:#4ade80;">
      <span style="font-size:18px;">✓</span> ${escHtml(message)}
    </div>
  `;
  
  shadowRoot.querySelector('.tw-close').addEventListener('click', hidePopup);
  positionPopup(x, y);
  requestAnimationFrame(() => popupEl.classList.add('tw-visible'));
  
  hideTimer = setTimeout(() => {
    hidePopup();
  }, 3000);
}

// ─── Show translation result ──────────────────────────────────────────────────
function showTranslation({ originalText, result, showOriginal, copyOnClick }) {
  const detectedLang = result.detectedSourceLanguage ?? '??';

  popupEl.innerHTML = `
    <div class="tw-header">
      <span class="tw-brand"><span class="tw-brand-icon">🌐</span> Translate Web</span>
      <div style="display:flex;align-items:center;gap:8px;">
        <span class="tw-lang-badge">
          ${detectedLang.toUpperCase()} <span class="arrow">→</span> EN
        </span>
        <button class="tw-close" title="Close">×</button>
      </div>
    </div>
    <div class="tw-body">
      ${showOriginal && originalText ? `<div class="tw-original">${escHtml(originalText)}</div>` : ''}
      <div class="tw-translation" title="${copyOnClick ? 'Click to copy' : ''}">${escHtml(result.translatedText)}</div>
    </div>
    <div class="tw-footer">
      <div class="tw-actions">
        <button class="tw-btn" id="tw-copy-btn">📋 Copy</button>
        <button class="tw-btn" id="tw-settings-btn">⚙ Settings</button>
      </div>
      <span class="tw-powered">Powered by Google Translate</span>
    </div>
  `;

  const translationEl = shadowRoot.querySelector('.tw-translation');
  shadowRoot.querySelector('.tw-close').addEventListener('click', hidePopup);

  shadowRoot.querySelector('#tw-copy-btn').addEventListener('click', () => {
    navigator.clipboard.writeText(result.translatedText).then(() => {
      const btn = shadowRoot.querySelector('#tw-copy-btn');
      btn.textContent = '✓ Copied!';
      setTimeout(() => { btn.textContent = '📋 Copy'; }, 2000);
    });
  });

  shadowRoot.querySelector('#tw-settings-btn').addEventListener('click', () => {
    chrome.runtime.sendMessage({ action: 'openOptions' });
  });

  if (copyOnClick) {
    translationEl.addEventListener('click', () => {
      navigator.clipboard.writeText(result.translatedText).then(() => {
        translationEl.classList.add('tw-copied');
        setTimeout(() => translationEl.classList.remove('tw-copied'), 2000);
      });
    });
  }

  requestAnimationFrame(() => popupEl.classList.add('tw-visible'));
}

// ─── Show error ───────────────────────────────────────────────────────────────
function showError(message) {
  ensurePopup();
  popupEl.innerHTML = `
    <div class="tw-header">
      <span class="tw-brand"><span class="tw-brand-icon">🌐</span> Translate Web</span>
      <button class="tw-close" title="Close">×</button>
    </div>
    <div class="tw-error-msg">⚠️ ${escHtml(message)}</div>
  `;
  shadowRoot.querySelector('.tw-close').addEventListener('click', hidePopup);
  requestAnimationFrame(() => popupEl.classList.add('tw-visible'));
}

// ─── Hide popup ───────────────────────────────────────────────────────────────
function hidePopup() {
  if (!popupEl) return;
  popupEl.classList.remove('tw-visible');
}

// ─── HTML escape ─────────────────────────────────────────────────────────────
function escHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// ─── Expose for scripting.executeScript ──────────────────────────────────────
window.__translateWeb = { showError };

// ─── Hotkey listener ─────────────────────────────────────────────────────────
chrome.storage.sync.get({ hotkey: 'Alt+T', showOriginal: true, copyOnClick: false }, (settings) => {
  document.addEventListener('keydown', async (e) => {
    const hotkeyParts = settings.hotkey.split('+');
    const key = hotkeyParts.at(-1);
    const needsAlt = hotkeyParts.includes('Alt');
    const needsShift = hotkeyParts.includes('Shift');
    const needsCtrl = hotkeyParts.includes('Ctrl');

    const matches =
      e.key.toLowerCase() === key.toLowerCase() &&
      e.altKey === needsAlt &&
      e.shiftKey === needsShift &&
      e.ctrlKey === needsCtrl;

    if (!matches) return;

    const selectedText = window.getSelection()?.toString().trim();
    if (!selectedText) return;

    e.preventDefault();

    const sel = window.getSelection();
    const rect = sel.getRangeAt(0).getBoundingClientRect();
    const x = rect.left + rect.width / 2;
    const y = rect.bottom;

    showLoading(x, y);

    const response = await chrome.runtime.sendMessage({
      action: 'translate',
      text: selectedText,
    });

    if (response.success) {
      showTranslation({
        originalText: selectedText,
        result: response,
        showOriginal: settings.showOriginal,
        copyOnClick: settings.copyOnClick,
      });
    } else {
      showError(response.error);
    }
  });
});

// ─── Message handler (from service worker) ───────────────────────────────────
chrome.runtime.onMessage.addListener((message) => {
  if (message.action === 'showTranslation') {
    chrome.storage.sync.get({ showOriginal: true, copyOnClick: false }, (settings) => {
      ensurePopup();

      // Position near last click/selection
      const sel = window.getSelection();
      let x = window.innerWidth / 2;
      let y = window.innerHeight / 2;
      if (sel?.rangeCount) {
        const rect = sel.getRangeAt(0).getBoundingClientRect();
        x = rect.left + rect.width / 2;
        y = rect.bottom;
      }
      positionPopup(x, y);

      showTranslation({
        originalText: message.originalText,
        result: message.result,
        showOriginal: settings.showOriginal,
        copyOnClick: settings.copyOnClick,
      });
    });
  }

    if (message.action === 'showError') {
    showError(message.error);
  }
});

// ─── DOM Walker for Page Translation ─────────────────────────────────────────

// Find all visible text nodes containing text
function getTranslateableTextNodes(root) {
  const nodes = [];
  const skipTags = new Set(['SCRIPT', 'STYLE', 'NOSCRIPT', 'IFRAME', 'CODE', 'PRE', 'svg']);
  
  const walker = document.createTreeWalker(
    root,
    NodeFilter.SHOW_TEXT,
    {
      acceptNode: function(node) {
        if (!node.nodeValue.trim()) return NodeFilter.FILTER_REJECT;
        if (skipTags.has(node.parentElement?.tagName)) return NodeFilter.FILTER_REJECT;
        // Skip hidden elements
        const style = window.getComputedStyle(node.parentElement);
        if (style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0') {
          return NodeFilter.FILTER_REJECT;
        }
        return NodeFilter.FILTER_ACCEPT;
      }
    }
  );

  let currentNode;
  while ((currentNode = walker.nextNode())) {
    nodes.push(currentNode);
  }
  return nodes;
}

// ─── Translate Entire Page ───────────────────────────────────────────────────
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'getPageStatus') {
    sendResponse({ isTranslated: isPageTranslated });
    return false; // synchronous response
  }
  
  if (message.action === 'revertPage') {
    revertPage();
    sendResponse({ success: true });
    return false; // synchronous response
  }

  if (message.action === 'translatePage') {
    console.log(`[Translate Web] Received instruction to translate page to '${message.targetLang}'`);
    // Return immediately to close the popup, then start translating
    sendResponse({ success: true, started: true });
    doTranslatePage(message.targetLang).catch((err) => {
      console.error('[Translate Web] Translation failed:', err);
      showError(err.message);
    });
    return true;
  }
});

function revertPage() {
  console.log(`[Translate Web] Reverting ${originalTextMap.size} text nodes to original.`);
  for (const [node, originalText] of originalTextMap.entries()) {
    node.nodeValue = originalText;
  }
  isPageTranslated = false;
  // Keep the map around in case they translate again? We can clear it to save memory, 
  // they'll just re-map if they click translate again.
  originalTextMap.clear();
  
  // Show in top right corner
  const x = window.innerWidth - 300;
  const y = 20;
  showSuccess(x, y, 'Original text restored!');
}

async function doTranslatePage(targetLang) {
  // Show in top right corner
  const x = window.innerWidth - 300;
  const y = 20;
  
  console.log('[Translate Web] Starting DOM scan...');
  showLoading(x, y, 'Scanning page...', 0);
  
  const textNodes = getTranslateableTextNodes(document.body);
  console.log(`[Translate Web] Found ${textNodes.length} translatable text nodes.`);
  if (textNodes.length === 0) {
    console.warn('[Translate Web] No text found to translate.');
    showError("No text found to translate.");
    return;
  }
  
  // Store original text if we haven't already
  if (!isPageTranslated) {
    originalTextMap.clear();
    for (const node of textNodes) {
      originalTextMap.set(node, node.nodeValue);
    }
  }

  // We batch to avoid URL limits / payload limits
  const BATCH_SIZE = 100;
  const totalBatches = Math.ceil(textNodes.length / BATCH_SIZE);
  console.log(`[Translate Web] Split into ${totalBatches} batches of up to ${BATCH_SIZE} nodes.`);
  
  for (let i = 0; i < textNodes.length; i += BATCH_SIZE) {
    const currentBatch = Math.floor(i / BATCH_SIZE) + 1;
    const progress = Math.round((currentBatch / totalBatches) * 100);
    showLoading(x, y, `Translating...`, progress);
    
    const batchNodes = textNodes.slice(i, i + BATCH_SIZE);
    const strings = batchNodes.map(n => n.nodeValue.trim());

    try {
      console.log(`[Translate Web] Requesting translation for batch ${currentBatch}/${totalBatches}`);
      const response = await chrome.runtime.sendMessage({
        action: 'translateBatch',
        texts: strings,
        targetLang
      });

      if (response.success && response.translatedTexts) {
        let replacedCount = 0;
        for (let j = 0; j < batchNodes.length; j++) {
          // Replace only the trimmed part, preserve surrounding whitespace
          const original = batchNodes[j].nodeValue;
          const trimmed = original.trim();
          if (trimmed && response.translatedTexts[j]) {
            batchNodes[j].nodeValue = original.replace(trimmed, response.translatedTexts[j]);
            replacedCount++;
          }
        }
        console.log(`[Translate Web] Replaced ${replacedCount} nodes in batch ${currentBatch}`);
      }
    } catch (err) {
      console.error(`[Translate Web] Translation batch ${currentBatch} failed:`, err);
    }
  }

  isPageTranslated = true;
  console.log('[Translate Web] Page translation complete!');
  showSuccess(x, y, 'Translation complete!');
}
