// ─── Setup context menu on install ──────────────────────────────────────────
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: 'translate-selection',
    title: 'Translate with Translate Web',
    contexts: ['selection'],
  });
});

// ─── Cache Management ────────────────────────────────────────────────────────
const CACHE_KEY = 'tw_translation_cache';
const CACHE_LIFETIME = 30 * 24 * 60 * 60 * 1000; // 30 days in ms

async function getCache() {
  const data = await chrome.storage.local.get(CACHE_KEY);
  return data[CACHE_KEY] || {};
}

async function saveToCache(newEntries) {
  const cache = await getCache();
  const now = Date.now();
  for (const [key, val] of Object.entries(newEntries)) {
    cache[key] = { text: val, ts: now };
  }
  await chrome.storage.local.set({ [CACHE_KEY]: cache });
}

async function cleanOldCache() {
  const cache = await getCache();
  const now = Date.now();
  let changed = false;
  let deletedCount = 0;
  for (const key in cache) {
    if (now - cache[key].ts > CACHE_LIFETIME) {
      delete cache[key];
      changed = true;
      deletedCount++;
    }
  }
  if (changed) {
    await chrome.storage.local.set({ [CACHE_KEY]: cache });
    console.log(`[Translate Web] Cleaned ${deletedCount} old entries from cache.`);
  }
}

// Clean cache on startup
chrome.runtime.onStartup.addListener(cleanOldCache);
chrome.runtime.onInstalled.addListener(cleanOldCache);

// ─── Translation API call ────────────────────────────────────────────────────
async function callTranslateApi(textOrArray, targetLang, sourceLang, apiKey, provider = 'google', libreUrl = 'https://translate.argosopentech.com') {
  const isArray = Array.isArray(textOrArray);
  const texts = isArray ? textOrArray : [textOrArray];
  
  if (texts.length === 0) return { translatedTexts: [] };

  // 1. Check Cache
  const cache = await getCache();
  const results = new Array(texts.length);
  const missingIndices = [];
  const missingTexts = [];

  for (let i = 0; i < texts.length; i++) {
    const text = texts[i];
    const hashKey = `${provider}|${targetLang}|${text}`; // provider-scoped composite key
    if (cache[hashKey] && (Date.now() - cache[hashKey].ts < CACHE_LIFETIME)) {
      results[i] = cache[hashKey].text;
    } else {
      missingIndices.push(i);
      missingTexts.push(text);
    }
  }
  
  console.log(`[Translate Web] Processing ${texts.length} items. Cache hits: ${texts.length - missingTexts.length}, API calls needed: ${missingTexts.length} via ${provider}`);

  // 2. Fetch missing from API
  let detectedSourceLanguage = sourceLang;

  if (missingTexts.length > 0) {
    console.log(`[Translate Web] Calling ${provider} API for ${missingTexts.length} items...`);
    const newCacheEntries = {};
    let translatedArray = [];
    let detectedSource = null;

    if (provider === 'google') {
      const body = { q: missingTexts, target: targetLang, format: 'text' };
      if (sourceLang && sourceLang !== 'auto') body.source = sourceLang;

      const response = await fetch(`https://translation.googleapis.com/language/translate/v2?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await response.json();
      if (!response.ok || data.error) throw new Error(data.error?.message ?? `HTTP ${response.status}`);
      
      const translations = data.data?.translations || [];
      translatedArray = translations.map(t => t.translatedText);
      if (translations[0]?.detectedSourceLanguage) {
        detectedSource = translations[0].detectedSourceLanguage;
      }
    } 
    else if (provider === 'deepl') {
      const endpoint = apiKey.endsWith(':fx') ? 'api-free.deepl.com' : 'api.deepl.com';
      const body = { text: missingTexts, target_lang: targetLang.toUpperCase() };
      if (sourceLang && sourceLang !== 'auto') body.source_lang = sourceLang.toUpperCase();
      
      const response = await fetch(`https://${endpoint}/v2/translate`, {
        method: 'POST',
        headers: { 
          'Authorization': `DeepL-Auth-Key ${apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(body),
      });
      const data = await response.json();
      if (!response.ok || data.message) throw new Error(data.message || `HTTP ${response.status}`);
      
      const translations = data.translations || [];
      translatedArray = translations.map(t => t.text);
      if (translations[0]?.detected_source_language) {
        detectedSource = translations[0].detected_source_language;
      }
    }
    else if (provider === 'openai') {
      // OpenAI doesn't natively support batch arrays like Google/DeepL in a single structured response easily,
      // so we will prompt it to return a JSON array of strings.
      const prompt = `Translate the following JSON array of strings into ${targetLang}. Preserve the exact array structure, order, and length. ONLY return a valid JSON array of strings, no markdown formatting.\n\n` + JSON.stringify(missingTexts);
      
      const response = await fetch(`https://api.openai.com/v1/chat/completions`, {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          model: 'gpt-4o-mini',
          messages: [{ role: 'user', content: prompt }]
        }),
      });
      const data = await response.json();
      if (!response.ok || data.error) throw new Error(data.error?.message || `HTTP ${response.status}`);
      
      try {
        let content = data.choices[0].message.content.trim();
        // Remove markdown block if present
        if (content.startsWith('```json')) content = content.substring(7);
        if (content.startsWith('```')) content = content.substring(3);
        if (content.endsWith('```')) content = content.substring(0, content.length - 3);
        
        translatedArray = JSON.parse(content.trim());
      } catch (e) {
        throw new Error('OpenAI returned invalid JSON format');
      }
    }
    else if (provider === 'libre') {
      const body = { 
        q: missingTexts, // LibreTranslate supports arrays of strings
        target: targetLang, 
        source: sourceLang === 'auto' ? 'auto' : sourceLang,
        format: 'text'
      };
      if (apiKey) body.api_key = apiKey;

      const url = libreUrl || 'https://translate.argosopentech.com';
      const response = await fetch(`${url}/translate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await response.json();
      if (!response.ok || data.error) throw new Error(data.error || `HTTP ${response.status}`);
      
      translatedArray = Array.isArray(data.translatedText) ? data.translatedText : [data.translatedText];
    }

    if (detectedSource) detectedSourceLanguage = detectedSource;

    for (let i = 0; i < translatedArray.length; i++) {
      const text = translatedArray[i];
      const origIndex = missingIndices[i];
      results[origIndex] = text;
      // Prepare for cache
      const hashKey = `${provider}|${targetLang}|${missingTexts[i]}`;
      newCacheEntries[hashKey] = text;
    }

    // Save missing to cache
    await saveToCache(newCacheEntries);
  }

  if (isArray) {
    return { translatedTexts: results, detectedSourceLanguage };
  } else {
    return { translatedText: results[0], detectedSourceLanguage };
  }
}

// ─── Message handler (from content script or popup) ──────────────────────────
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'openOptions') {
    console.log('[Translate Web] Opening options page');
    chrome.runtime.openOptionsPage();
    return false;
  }

  if (message.action === 'translateBatch') {
    console.log(`[Translate Web] Received batch translation request for ${message.texts.length} strings`);
    chrome.storage.sync.get({ googleApiKey: '', deeplApiKey: '', openaiApiKey: '', libreApiKey: '', provider: 'google', libreUrl: 'https://translate.argosopentech.com' }, async (settings) => {
      const apiKey = settings[`${settings.provider}ApiKey`];
      if (settings.provider !== 'libre' && !apiKey) {
        console.error('[Translate Web] No API key configured!');
        sendResponse({ success: false, error: 'No API key' });
        return;
      }
      try {
        const result = await callTranslateApi(message.texts, message.targetLang, 'auto', apiKey, settings.provider, settings.libreUrl);
        console.log('[Translate Web] Batch translation successful');
        sendResponse({ success: true, ...result });
      } catch (err) {
        console.error('[Translate Web] Batch translation failed:', err);
        sendResponse({ success: false, error: err.message });
      }
    });
    return true;
  }

  if (message.action !== 'translate') return false;

  console.log('[Translate Web] Received individual translation request');
  const uiLang = chrome.i18n.getUILanguage().split('-')[0];

  chrome.storage.sync.get(
    { googleApiKey: '', deeplApiKey: '', openaiApiKey: '', libreApiKey: '', targetLang: uiLang, sourceLang: 'auto', autoDetect: true, provider: 'google', libreUrl: 'https://translate.argosopentech.com' },
    async (settings) => {
      const apiKey = settings[`${settings.provider}ApiKey`];
      if (settings.provider !== 'libre' && !apiKey) {
        sendResponse({ success: false, error: 'No API key set. Open Settings to add one.' });
        return;
      }

      const effectiveSource = settings.autoDetect ? 'auto' : settings.sourceLang;

      try {
        const result = await callTranslateApi(
          message.text,
          message.targetLang ?? settings.targetLang,
          effectiveSource,
          apiKey,
          settings.provider,
          settings.libreUrl
        );
        sendResponse({ success: true, ...result });
      } catch (err) {
        sendResponse({ success: false, error: err.message });
      }
    }
  );

  return true; // keep the message channel open for async response
});

// ─── Context menu click → translate → send to content script ─────────────────
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId !== 'translate-selection') return;
  if (!info.selectionText || !tab?.id) return;

  const uiLang = chrome.i18n.getUILanguage().split('-')[0];

  chrome.storage.sync.get(
    { googleApiKey: '', deeplApiKey: '', openaiApiKey: '', libreApiKey: '', targetLang: uiLang, sourceLang: 'auto', autoDetect: true, provider: 'google', libreUrl: 'https://translate.argosopentech.com' },
    async (settings) => {
      const apiKey = settings[`${settings.provider}ApiKey`];
      if (settings.provider !== 'libre' && !apiKey) {
        chrome.scripting.executeScript({
          target: { tabId: tab.id },
          func: () => window.__translateWeb?.showError?.('No API key set. Open Settings.'),
        });
        return;
      }

      const effectiveSource = settings.autoDetect ? 'auto' : settings.sourceLang;

      try {
        const result = await callTranslateApi(
          info.selectionText,
          settings.targetLang,
          effectiveSource,
          apiKey,
          settings.provider,
          settings.libreUrl
        );
        chrome.tabs.sendMessage(tab.id, {
          action: 'showTranslation',
          originalText: info.selectionText,
          result,
        });
      } catch (err) {
        chrome.tabs.sendMessage(tab.id, {
          action: 'showError',
          error: err.message,
        });
      }
    }
  );
});
