// Stealth content script — no identifying strings in console

// ── Stealth utilities ──────────────────────────────────────────────────────

/** Generate a random string prefix so no static IDs can be fingerprinted */
function _rnd(len) {
    return Math.random().toString(36).slice(2, 2 + len);
}

/** Random float between [min, max] */
function _rand(min, max) {
    return min + Math.random() * (max - min);
}

/** Random delay in ms between [min, max] to mimic human reaction time */
function _delay(min, max) {
    return new Promise(r => setTimeout(r, _rand(min, max)));
}

// ── Runtime state ─────────────────────────────────────────────────────────

let currentSkipMode = 'auto';
let liveStreamAdCount = 0;
let lastUrl = location.href;
const BTN_DATA_ATTR = 'data-gs-' + _rnd(6); // unique per page load, invisible to static scanners

chrome.storage.onChanged.addListener((changes, ns) => {
    if (ns === 'local' && changes.skipMode) {
        currentSkipMode = changes.skipMode.newValue;
    }
});

chrome.storage.local.get(['skipMode'], (r) => {
    if (r.skipMode) currentSkipMode = r.skipMode;
});

// Reset counters on YouTube SPA navigation
window.addEventListener('yt-navigate-finish', () => {
    liveStreamAdCount = 0;
    hasAutoSkipped = false;
    lastUrl = location.href;
});

function checkUrlChange() {
    if (location.href !== lastUrl) {
        lastUrl = location.href;
        liveStreamAdCount = 0;
        hasAutoSkipped = false;
    }
}

function isLiveStream() {
    if (location.pathname.includes('/live/')) return true;
    const badge = document.querySelector('.ytp-live-badge');
    if (badge && !badge.hasAttribute('hidden') && badge.offsetParent !== null) return true;
    const player = document.querySelector('#movie_player');
    if (player && player.classList.contains('ytp-live')) return true;
    return false;
}

function getEffectiveSkipMode() {
    if (currentSkipMode === 'v1') return 'v1';
    if (currentSkipMode === 'v2') return 'v2';

    // Auto smart mode:
    if (isLiveStream()) {
        // Stream: 1st ad uses V2, 2nd+ ad uses V1
        return liveStreamAdCount <= 1 ? 'v2' : 'v1';
    }
    // Normal video: Always V2
    return 'v2';
}

// ── Detection & State Helpers ─────────────────────────────────────────────

function detectAdState() {
    const player = document.querySelector('#movie_player');
    if (!player) return false;
    
    // Check multiple indicators for CSAI and SSAI (Side-by-Side / Double-Box) ad breaks
    if (player.classList.contains('ad-showing')) return true;
    if (player.classList.contains('ad-interrupting')) return true;
    if (player.classList.contains('ytp-ad-showing')) return true;
    if (document.querySelector('.ytp-ad-player-overlay')) return true;
    if (document.querySelector('.ytp-ad-text, .ytp-ad-preview-text')) return true;
    
    return false;
}

/** Restore main stream audio back to 100% volume and unmuted */
function restoreMainStreamAudio() {
    const mainVid = document.querySelector('video.html5-main-video, #movie_player video');
    if (mainVid) {
        try {
            mainVid.muted = false;
            mainVid.volume = 1.0;
        } catch (_) {}
    }
}

// ── Skip logic ────────────────────────────────────────────────────────────

function triggerV1Skip() {
    // Dismiss overlay banner ads if present
    const overlayClose = document.querySelector('.ytp-ad-overlay-close-button');
    if (overlayClose) try { overlayClose.click(); } catch (_) {}

    // 1. Restore main stream video audio to 100% volume immediately (un-duck audio)
    restoreMainStreamAudio();

    // 2. Target active ad video element (overlay ad or active ad layer)
    const adVid = document.querySelector('.ad-showing video, .ad-interrupting video, .ytp-ad-module video');
    if (adVid) {
        // Fast-forward playback speed & mute ad video specifically
        try {
            adVid.muted = true;
            adVid.playbackRate = 16;
        } catch (_) {}

        if (!isNaN(adVid.duration) && isFinite(adVid.duration) && adVid.duration > 0) {
            const tailOffset = _rand(0.05, 0.5);
            const target = adVid.duration - tailOffset;
            if (adVid.currentTime < target) {
                adVid.currentTime = target;
            }
        }
    } else {
        // If single video surface is used, fast-forward and mute current ad sequence
        const vid = document.querySelector('video');
        if (vid && detectAdState()) {
            try { vid.playbackRate = 16; } catch (_) {}
        }
    }

    // 3. Rapid clicker loop for YouTube native skip buttons
    const skipBtnSelectors = [
        '.ytp-skip-ad-button',
        '.ytp-ad-skip-button-modern',
        '.ytp-ad-skip-button',
        '.ytp-ad-skip-button-slot',
        '.ytp-ad-skip-button-container button'
    ];
    
    let attempts = 0;
    const interval = setInterval(() => {
        attempts++;
        for (const sel of skipBtnSelectors) {
            const btn = document.querySelector(sel);
            if (btn) {
                btn.click();
                clearInterval(interval);
                restoreMainStreamAudio();
                return;
            }
        }
        if (attempts >= 10) clearInterval(interval);
    }, 60);
}

function triggerV2Glitch() {
    const uri = 'glitchskip://trigger';
    // Append into the player container, not document.body, to avoid body-level observers
    const container = document.querySelector('#movie_player') || document.body;
    const a = document.createElement('a');
    a.setAttribute('href', uri);
    a.style.cssText = 'position:fixed;width:0;height:0;opacity:0;pointer-events:none;';
    container.appendChild(a);
    a.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
    setTimeout(() => { try { a.remove(); } catch (_) {} }, 800);
}

async function executeSkip() {
    // Random human-like delay before acting (80 – 520 ms), different every time
    await _delay(80, 520);
    const mode = getEffectiveSkipMode();
    if (mode === 'v1') {
        triggerV1Skip();
    } else {
        triggerV2Glitch();
    }
}

// ── Button injection ──────────────────────────────────────────────────────

function createStealthButton() {
    // Check if we already injected one this page load using our unique data attr
    if (document.querySelector('[' + BTN_DATA_ATTR + ']')) return null;

    const btn = document.createElement('button');
    btn.setAttribute(BTN_DATA_ATTR, '1');       // unique attr, not a static id/class
    btn.className = 'glitch-skip-btn';
    btn.innerText = 'GLITCH SKIP AD';

    btn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        btn.innerText = 'SKIPPING…';
        btn.disabled = true;
        executeSkip().finally(() => {
            setTimeout(() => {
                btn.innerText = 'GLITCH SKIP AD';
                btn.disabled = false;
            }, 2000);
        });
    });

    return btn;
}

// ── Ad detection ──────────────────────────────────────────────────────────

let hasAutoSkipped = false;
let _observerTick = null; // throttle observer callbacks

const observer = new MutationObserver(() => {
    // Throttle: only process once per idle frame to reduce detectable call rate
    if (_observerTick) return;
    _observerTick = requestIdleCallback
        ? requestIdleCallback(processAdState, { timeout: 250 })
        : setTimeout(processAdState, 50);
});

function processAdState() {
    _observerTick = null;
    checkUrlChange();

    const player = document.querySelector('#movie_player');
    if (!player) return;

    // Inject button if missing
    if (!document.querySelector('[' + BTN_DATA_ATTR + ']')) {
        const btn = createStealthButton();
        if (btn) player.appendChild(btn);
    }

    const isAdShowing = detectAdState();

    if (isAdShowing) {
        if (!hasAutoSkipped) {
            hasAutoSkipped = true;
            liveStreamAdCount++;
            const btn = document.querySelector('[' + BTN_DATA_ATTR + ']');
            if (btn && !btn.disabled) {
                btn.click();
            } else {
                executeSkip();
            }
        }
    } else {
        if (hasAutoSkipped) {
            restoreMainStreamAudio();
        }
        hasAutoSkipped = false;
    }
}

observer.observe(document.body, { childList: true, subtree: true, attributes: false });
