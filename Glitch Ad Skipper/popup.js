document.addEventListener('DOMContentLoaded', () => {
  const radioButtons = document.querySelectorAll('input[name="skipMode"]');
  const statusMsg = document.getElementById('save-status');

  // Load saved setting
  chrome.storage.local.get(['skipMode'], (result) => {
    const savedMode = result.skipMode || 'auto';
    const activeRadio = document.querySelector(`input[name="skipMode"][value="${savedMode}"]`);
    if (activeRadio) {
      activeRadio.checked = true;
    }
  });

  // Listen for changes
  radioButtons.forEach(radio => {
    radio.addEventListener('change', (e) => {
      const newMode = e.target.value;
      chrome.storage.local.set({ skipMode: newMode }, () => {
        // Show saved status
        statusMsg.classList.add('show');
        setTimeout(() => {
          statusMsg.classList.remove('show');
        }, 1500);
      });
    });
  });
});
