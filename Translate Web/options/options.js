// ─── Language list ──────────────────────────────────────────────────────────
const LANGUAGES = [
  { code: 'af', name: 'Afrikaans' }, { code: 'sq', name: 'Albanian' },
  { code: 'ar', name: 'Arabic' }, { code: 'hy', name: 'Armenian' },
  { code: 'az', name: 'Azerbaijani' }, { code: 'eu', name: 'Basque' },
  { code: 'be', name: 'Belarusian' }, { code: 'bn', name: 'Bengali' },
  { code: 'bs', name: 'Bosnian' }, { code: 'bg', name: 'Bulgarian' },
  { code: 'ca', name: 'Catalan' }, { code: 'ceb', name: 'Cebuano' },
  { code: 'zh-CN', name: 'Chinese (Simplified)' }, { code: 'zh-TW', name: 'Chinese (Traditional)' },
  { code: 'hr', name: 'Croatian' }, { code: 'cs', name: 'Czech' },
  { code: 'da', name: 'Danish' }, { code: 'nl', name: 'Dutch' },
  { code: 'en', name: 'English' }, { code: 'eo', name: 'Esperanto' },
  { code: 'et', name: 'Estonian' }, { code: 'fi', name: 'Finnish' },
  { code: 'fr', name: 'French' }, { code: 'gl', name: 'Galician' },
  { code: 'ka', name: 'Georgian' }, { code: 'de', name: 'German' },
  { code: 'el', name: 'Greek' }, { code: 'gu', name: 'Gujarati' },
  { code: 'ht', name: 'Haitian Creole' }, { code: 'ha', name: 'Hausa' },
  { code: 'he', name: 'Hebrew' }, { code: 'hi', name: 'Hindi' },
  { code: 'hu', name: 'Hungarian' }, { code: 'is', name: 'Icelandic' },
  { code: 'ig', name: 'Igbo' }, { code: 'id', name: 'Indonesian' },
  { code: 'ga', name: 'Irish' }, { code: 'it', name: 'Italian' },
  { code: 'ja', name: 'Japanese' }, { code: 'jv', name: 'Javanese' },
  { code: 'kn', name: 'Kannada' }, { code: 'kk', name: 'Kazakh' },
  { code: 'km', name: 'Khmer' }, { code: 'ko', name: 'Korean' },
  { code: 'ku', name: 'Kurdish' }, { code: 'ky', name: 'Kyrgyz' },
  { code: 'lo', name: 'Lao' }, { code: 'la', name: 'Latin' },
  { code: 'lv', name: 'Latvian' }, { code: 'lt', name: 'Lithuanian' },
  { code: 'lb', name: 'Luxembourgish' }, { code: 'mk', name: 'Macedonian' },
  { code: 'mg', name: 'Malagasy' }, { code: 'ms', name: 'Malay' },
  { code: 'ml', name: 'Malayalam' }, { code: 'mt', name: 'Maltese' },
  { code: 'mi', name: 'Maori' }, { code: 'mr', name: 'Marathi' },
  { code: 'mn', name: 'Mongolian' }, { code: 'my', name: 'Myanmar (Burmese)' },
  { code: 'ne', name: 'Nepali' }, { code: 'no', name: 'Norwegian' },
  { code: 'ny', name: 'Nyanja (Chichewa)' }, { code: 'or', name: 'Odia (Oriya)' },
  { code: 'ps', name: 'Pashto' }, { code: 'fa', name: 'Persian' },
  { code: 'pl', name: 'Polish' }, { code: 'pt', name: 'Portuguese' },
  { code: 'pa', name: 'Punjabi' }, { code: 'ro', name: 'Romanian' },
  { code: 'ru', name: 'Russian' }, { code: 'sm', name: 'Samoan' },
  { code: 'gd', name: 'Scots Gaelic' }, { code: 'sr', name: 'Serbian' },
  { code: 'st', name: 'Sesotho' }, { code: 'sn', name: 'Shona' },
  { code: 'sd', name: 'Sindhi' }, { code: 'si', name: 'Sinhala (Sinhalese)' },
  { code: 'sk', name: 'Slovak' }, { code: 'sl', name: 'Slovenian' },
  { code: 'so', name: 'Somali' }, { code: 'es', name: 'Spanish' },
  { code: 'su', name: 'Sundanese' }, { code: 'sw', name: 'Swahili' },
  { code: 'sv', name: 'Swedish' }, { code: 'tl', name: 'Tagalog (Filipino)' },
  { code: 'tg', name: 'Tajik' }, { code: 'ta', name: 'Tamil' },
  { code: 'tt', name: 'Tatar' }, { code: 'te', name: 'Telugu' },
  { code: 'th', name: 'Thai' }, { code: 'tr', name: 'Turkish' },
  { code: 'tk', name: 'Turkmen' }, { code: 'uk', name: 'Ukrainian' },
  { code: 'ur', name: 'Urdu' }, { code: 'ug', name: 'Uyghur' },
  { code: 'uz', name: 'Uzbek' }, { code: 'vi', name: 'Vietnamese' },
  { code: 'cy', name: 'Welsh' }, { code: 'xh', name: 'Xhosa' },
  { code: 'yi', name: 'Yiddish' }, { code: 'yo', name: 'Yoruba' },
  { code: 'zu', name: 'Zulu' },
];

// ─── Populate language selects ───────────────────────────────────────────────
function populateLanguageSelects(targetVal, sourceVal) {
  const targetSel = document.getElementById('targetLang');
  const sourceSel = document.getElementById('sourceLang');

  sourceSel.innerHTML = '<option value="auto">Auto Detect</option>';

  for (const { code, name } of LANGUAGES) {
    const tOpt = document.createElement('option');
    tOpt.value = code;
    tOpt.textContent = name;
    if (code === targetVal) tOpt.selected = true;
    targetSel.appendChild(tOpt);

    const sOpt = document.createElement('option');
    sOpt.value = code;
    sOpt.textContent = name;
    if (code === sourceVal) sOpt.selected = true;
    sourceSel.appendChild(sOpt);
  }
}

// ─── Load saved settings ─────────────────────────────────────────────────────
function updateProviderUI() {
  const provider = document.getElementById('provider').value;
  ['google', 'deepl', 'openai', 'libre'].forEach(p => {
    document.getElementById(`help-${p}`).classList.add('hidden');
  });
  document.getElementById(`help-${provider}`).classList.remove('hidden');
  
  if (provider === 'libre') {
    document.getElementById('libreUrlField').classList.remove('hidden');
    document.getElementById('apiKeyLabel').textContent = 'API Key (Optional)';
  } else {
    document.getElementById('libreUrlField').classList.add('hidden');
    document.getElementById('apiKeyLabel').textContent = 'API Key';
  }

  if (window.apiKeys) {
    document.getElementById('apiKey').value = window.apiKeys[provider] || '';
  }
}

function loadOptions() {
  const uiLang = chrome.i18n.getUILanguage().split('-')[0];
  chrome.storage.sync.get({
    provider: 'google',
    libreUrl: 'https://translate.argosopentech.com',
    googleApiKey: '',
    deeplApiKey: '',
    openaiApiKey: '',
    libreApiKey: '',
    targetLang: uiLang,
    sourceLang: 'auto',
    hotkey: 'Alt+T',
    showOriginal: true,
    autoDetect: true,
    copyOnClick: false,
  }, (items) => {
    window.apiKeys = {
      google: items.googleApiKey,
      deepl: items.deeplApiKey,
      openai: items.openaiApiKey,
      libre: items.libreApiKey
    };
    document.getElementById('provider').value = items.provider;
    document.getElementById('libreUrl').value = items.libreUrl;
    document.getElementById('apiKey').value = window.apiKeys[items.provider] || '';
    document.getElementById('hotkey').value = items.hotkey;
    document.getElementById('showOriginal').checked = items.showOriginal;
    document.getElementById('autoDetect').checked = items.autoDetect;
    document.getElementById('copyOnClick').checked = items.copyOnClick;
    populateLanguageSelects(items.targetLang, items.sourceLang);
    updateProviderUI();
  });
}

function saveOptions() {
  const settings = {
    provider: document.getElementById('provider').value,
    libreUrl: document.getElementById('libreUrl').value.trim(),
    googleApiKey: window.apiKeys?.google || '',
    deeplApiKey: window.apiKeys?.deepl || '',
    openaiApiKey: window.apiKeys?.openai || '',
    libreApiKey: window.apiKeys?.libre || '',
    targetLang: document.getElementById('targetLang').value,
    sourceLang: document.getElementById('sourceLang').value,
    hotkey: document.getElementById('hotkey').value,
    showOriginal: document.getElementById('showOriginal').checked,
    autoDetect: document.getElementById('autoDetect').checked,
    copyOnClick: document.getElementById('copyOnClick').checked,
  };

  chrome.storage.sync.set(settings, () => {
    const status = document.getElementById('saveStatus');
    status.textContent = '✓ Settings saved!';
    status.classList.add('visible');
    setTimeout(() => status.classList.remove('visible'), 2500);
  });
}

// ─── Test API key ─────────────────────────────────────────────────────────────
async function testApiKey() {
  const provider = document.getElementById('provider').value;
  const key = document.getElementById('apiKey').value.trim();
  const libreUrl = document.getElementById('libreUrl').value.trim() || 'https://translate.argosopentech.com';
  const result = document.getElementById('testResult');

  if (provider !== 'libre' && !key) {
    result.textContent = '✗ Please enter an API key first';
    result.className = 'test-result err';
    return;
  }

  result.textContent = 'Testing...';
  result.className = 'test-result';

  try {
    let res, data;
    
    if (provider === 'google') {
      res = await fetch(`https://translation.googleapis.com/language/translate/v2?key=${key}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ q: 'Hello', target: 'es', format: 'text' }),
      });
      data = await res.json();
      if (data.data?.translations?.[0]?.translatedText) {
        result.textContent = `✓ Connected! "Hello" → "${data.data.translations[0].translatedText}"`;
        result.className = 'test-result ok';
      } else {
        throw new Error(data.error?.message ?? 'Unknown error');
      }
    } 
    else if (provider === 'deepl') {
      // DeepL free API domain
      const endpoint = key.endsWith(':fx') ? 'api-free.deepl.com' : 'api.deepl.com';
      res = await fetch(`https://${endpoint}/v2/translate`, {
        method: 'POST',
        headers: { 
          'Authorization': `DeepL-Auth-Key ${key}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ text: ['Hello'], target_lang: 'ES' }),
      });
      data = await res.json();
      if (data.translations?.[0]?.text) {
        result.textContent = `✓ Connected! "Hello" → "${data.translations[0].text}"`;
        result.className = 'test-result ok';
      } else {
        throw new Error(data.message || 'Unknown error');
      }
    }
    else if (provider === 'openai') {
      res = await fetch(`https://api.openai.com/v1/chat/completions`, {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${key}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          model: 'gpt-4o-mini',
          messages: [{ role: 'user', content: 'Translate this to Spanish: Hello. ONLY reply with the translation.' }]
        }),
      });
      data = await res.json();
      if (data.choices?.[0]?.message?.content) {
        result.textContent = `✓ Connected! "Hello" → "${data.choices[0].message.content}"`;
        result.className = 'test-result ok';
      } else {
        throw new Error(data.error?.message || 'Unknown error');
      }
    }
    else if (provider === 'libre') {
      res = await fetch(`${libreUrl}/translate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ q: 'Hello', target: 'es', source: 'en', api_key: key }),
      });
      data = await res.json();
      if (data.translatedText) {
        result.textContent = `✓ Connected! "Hello" → "${data.translatedText}"`;
        result.className = 'test-result ok';
      } else {
        throw new Error(data.error || 'Unknown error');
      }
    }
  } catch (err) {
    result.textContent = `✗ API Error: ${err.message}`;
    result.className = 'test-result err';
  }
}

// ─── Toggle API key visibility ────────────────────────────────────────────────
function toggleApiKey() {
  const input = document.getElementById('apiKey');
  input.type = input.type === 'password' ? 'text' : 'password';
}

// ─── Init ─────────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', loadOptions);
document.getElementById('provider').addEventListener('change', updateProviderUI);
document.getElementById('apiKey').addEventListener('input', (e) => {
  const provider = document.getElementById('provider').value;
  if (window.apiKeys) {
    window.apiKeys[provider] = e.target.value.trim();
  }
});
document.getElementById('saveBtn').addEventListener('click', saveOptions);
document.getElementById('testApi').addEventListener('click', testApiKey);
document.getElementById('toggleApiKey').addEventListener('click', toggleApiKey);
