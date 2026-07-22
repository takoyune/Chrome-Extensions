document.addEventListener('DOMContentLoaded', () => {
  const extensionToggle = document.getElementById('extension-toggle');
  const modeSelector = document.getElementById('mode-selector');
  const radioButtons = document.querySelectorAll('input[name="skipMode"]');
  const statusMsg = document.getElementById('save-status');

  function showStatus() {
    statusMsg.classList.add('show');
    setTimeout(() => {
      statusMsg.classList.remove('show');
    }, 1500);
  }

  function updateUIState(enabled) {
    if (enabled) {
      modeSelector.classList.remove('disabled-overlay');
    } else {
      modeSelector.classList.add('disabled-overlay');
    }
  }

  // Load saved settings
  chrome.storage.local.get(['enabled', 'skipMode'], (result) => {
    const isEnabled = result.enabled !== undefined ? result.enabled : true;
    extensionToggle.checked = isEnabled;
    updateUIState(isEnabled);

    const savedMode = result.skipMode || 'auto';
    const activeRadio = document.querySelector(`input[name="skipMode"][value="${savedMode}"]`);
    if (activeRadio) {
      activeRadio.checked = true;
    }
  });

  // Listen for enable/disable toggle
  extensionToggle.addEventListener('change', (e) => {
    const enabled = e.target.checked;
    chrome.storage.local.set({ enabled }, () => {
      updateUIState(enabled);
      showStatus();
    });
  });

  // Listen for mode changes
  radioButtons.forEach(radio => {
    radio.addEventListener('change', (e) => {
      const newMode = e.target.value;
      chrome.storage.local.set({ skipMode: newMode }, () => {
        showStatus();
      });
    });
  });
});
