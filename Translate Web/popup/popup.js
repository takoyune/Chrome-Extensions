const LANGUAGES = [
  { code: 'af', name: 'Afrikaans' }, { code: 'ar', name: 'Arabic' },
  { code: 'zh-CN', name: 'Chinese (Simplified)' }, { code: 'zh-TW', name: 'Chinese (Traditional)' },
  { code: 'cs', name: 'Czech' }, { code: 'da', name: 'Danish' },
  { code: 'nl', name: 'Dutch' }, { code: 'en', name: 'English' },
  { code: 'fi', name: 'Finnish' }, { code: 'fr', name: 'French' },
  { code: 'de', name: 'German' }, { code: 'el', name: 'Greek' },
  { code: 'he', name: 'Hebrew' }, { code: 'hi', name: 'Hindi' },
  { code: 'hu', name: 'Hungarian' }, { code: 'id', name: 'Indonesian' },
  { code: 'it', name: 'Italian' }, { code: 'ja', name: 'Japanese' },
  { code: 'ko', name: 'Korean' }, { code: 'ms', name: 'Malay' },
  { code: 'no', name: 'Norwegian' }, { code: 'fa', name: 'Persian' },
  { code: 'pl', name: 'Polish' }, { code: 'pt', name: 'Portuguese' },
  { code: 'ro', name: 'Romanian' }, { code: 'ru', name: 'Russian' },
  { code: 'es', name: 'Spanish' }, { code: 'sv', name: 'Swedish' },
  { code: 'th', name: 'Thai' }, { code: 'tr', name: 'Turkish' },
  { code: 'uk', name: 'Ukrainian' }, { code: 'ur', name: 'Urdu' },
  { code: 'vi', name: 'Vietnamese' },
];

// ─── Populate selects ─────────────────────────────────────────────────────────
function populateSelects(targetVal) {
  const sourceSel = document.getElementById('sourceLangSelect');
  const targetSel = document.getElementById('targetLangSelect');
  const pageTargetSel = document.getElementById('pageTargetLang');

  for (const { code, name } of LANGUAGES) {
    const sOpt = document.createElement('option');
    sOpt.value = code;
    sOpt.textContent = name;
    sourceSel.appendChild(sOpt);

    const tOpt = document.createElement('option');
    tOpt.value = code;
    tOpt.textContent = name;
    if (code === targetVal) tOpt.selected = true;
    targetSel.appendChild(tOpt);

    const pOpt = document.createElement('option');
    pOpt.value = code;
    pOpt.textContent = name;
    if (code === targetVal) pOpt.selected = true;
    pageTargetSel.appendChild(pOpt);
  }
}

// ─── Init ─────────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  const uiLang = chrome.i18n.getUILanguage().split('-')[0];
  chrome.storage.sync.get({ targetLang: uiLang, googleApiKey: '', deeplApiKey: '', openaiApiKey: '', libreApiKey: '', provider: 'google' }, (settings) => {
    populateSelects(settings.targetLang);

    const apiKey = settings[`${settings.provider}ApiKey`];
    if (settings.provider !== 'libre' && !apiKey) {
      document.getElementById('setupLink').classList.remove('hidden');
    }
  });

  // Check current tab to toggle UI modes
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    const tab = tabs[0];
    if (tab && tab.url && (tab.url.startsWith('http://') || tab.url.startsWith('https://'))) {
      console.log('[Translate Web] Detected valid web page. Switching to Page Mode.');
      document.getElementById('textMode').classList.add('hidden');
      document.getElementById('pageMode').classList.remove('hidden');
      
      // Check if already translated
      chrome.tabs.sendMessage(tab.id, { action: 'getPageStatus' }, (response) => {
        if (!chrome.runtime.lastError && response && response.isTranslated) {
          const btn = document.getElementById('translatePageBtn');
          const label = document.getElementById('pageBtnLabel');
          if (label) label.textContent = 'Revert to Original';
          btn.classList.add('revert-btn');
          btn.dataset.action = 'revert';
        }
      });
    } else {
      console.log('[Translate Web] Restricted page detected (e.g. chrome://). Using Text Mode.');
    }
  });

  const inputEl = document.getElementById('inputText');
  const charCountEl = document.getElementById('charCount');

  inputEl.addEventListener('input', () => {
    charCountEl.textContent = inputEl.value.length;
  });

  document.getElementById('translateBtn').addEventListener('click', doTranslate);

  inputEl.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') doTranslate();
  });

  document.getElementById('swapLangs').addEventListener('click', () => {
    const src = document.getElementById('sourceLangSelect');
    const tgt = document.getElementById('targetLangSelect');
    if (src.value === 'auto') return;
    const tmp = src.value;
    src.value = tgt.value;
    tgt.value = tmp;
  });

  document.getElementById('copyResult').addEventListener('click', () => {
    const text = document.getElementById('resultText').textContent;
    navigator.clipboard.writeText(text).then(() => {
      const btn = document.getElementById('copyResult');
      btn.textContent = '✓ Copied!';
      setTimeout(() => { btn.textContent = '📋 Copy'; }, 2000);
    });
  });

  document.getElementById('openSettings').addEventListener('click', () => {
    chrome.runtime.openOptionsPage();
  });

  document.getElementById('setupLink').addEventListener('click', (e) => {
    e.preventDefault();
    chrome.runtime.openOptionsPage();
  });

  // Page Translation action
  document.getElementById('translatePageBtn').addEventListener('click', async () => {
    const btn = document.getElementById('translatePageBtn');
    
    // Handle Revert
    if (btn.dataset.action === 'revert') {
      console.log(`[Translate Web] "Revert to Original" clicked.`);
      const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
      if (tabs[0]) {
        chrome.tabs.sendMessage(tabs[0].id, { action: 'revertPage' }, () => {
          window.close();
        });
      }
      return;
    }
    
    // Handle Translate
    const targetLang = document.getElementById('pageTargetLang').value;
    console.log(`[Translate Web] "Translate Page" clicked. Target: ${targetLang}`);
    
    // update button UI
    const label = document.getElementById('pageBtnLabel') || btn; // fallback if no label span
    const spinner = document.getElementById('pageBtnSpinner');
    
    btn.disabled = true;
    label.textContent = 'Translating...';
    if (spinner) spinner.classList.remove('hidden');

    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tabs[0]) {
      chrome.tabs.sendMessage(tabs[0].id, {
        action: 'translatePage',
        targetLang
      }, (response) => {
        if (chrome.runtime.lastError || !response) {
          btn.disabled = false;
          label.textContent = 'Translate Page';
          if (spinner) spinner.classList.add('hidden');
          showError(chrome.runtime.lastError?.message || 'Content script not found. Please refresh the page.');
        } else if (!response.success) {
          btn.disabled = false;
          label.textContent = 'Translate Page';
          if (spinner) spinner.classList.add('hidden');
          showError(response.error || 'Translation failed');
        } else {
          // Translation has successfully started in the background, close popup
          window.close();
        }
      });
    }
  });
});

// ─── Translate action ─────────────────────────────────────────────────────────
async function doTranslate() {
  const text = document.getElementById('inputText').value.trim();
  if (!text) return;

  const targetLang = document.getElementById('targetLangSelect').value;
  const sourceLang = document.getElementById('sourceLangSelect').value;

  setLoading(true);
  hideResult();
  hideError();

  const response = await chrome.runtime.sendMessage({
    action: 'translate',
    text,
    targetLang,
    sourceLang: sourceLang === 'auto' ? undefined : sourceLang,
  });

  setLoading(false);

  if (response.success) {
    showResult(response);
  } else {
    showError(response.error);
  }
}

function setLoading(on) {
  const btn = document.getElementById('translateBtn');
  const label = document.getElementById('btnLabel');
  const spinner = document.getElementById('btnSpinner');
  btn.disabled = on;
  label.textContent = on ? 'Translating…' : 'Translate';
  spinner.classList.toggle('hidden', !on);
}

function showResult({ translatedText, detectedSourceLanguage }) {
  document.getElementById('resultArea').classList.remove('hidden');
  document.getElementById('resultText').textContent = translatedText;
  if (detectedSourceLanguage) {
    document.getElementById('detectedLang').textContent =
      `Detected: ${detectedSourceLanguage.toUpperCase()}`;
  }
}

function hideResult() {
  document.getElementById('resultArea').classList.add('hidden');
}

function showError(msg) {
  const el = document.getElementById('errorArea');
  el.textContent = `⚠️ ${msg}`;
  el.classList.remove('hidden');
}

function hideError() {
  document.getElementById('errorArea').classList.add('hidden');
}
