document.addEventListener('DOMContentLoaded', async () => {
  const toggleEl = document.getElementById('toggleFilter');
  const sliderEl = document.getElementById('thresholdSlider');
  const thresholdValEl = document.getElementById('thresholdValue');

  let { spFilterEnabled, spThreshold } = await chrome.storage.local.get({
    spFilterEnabled: false,
    spThreshold: 19
  });

  toggleEl.checked = spFilterEnabled;
  sliderEl.value = spThreshold;
  thresholdValEl.textContent = spThreshold;

  toggleEl.addEventListener('change', async () => {
    spFilterEnabled = toggleEl.checked;
    await chrome.storage.local.set({ spFilterEnabled });
    notifyContentScript();
  });

  sliderEl.addEventListener('input', async () => {
    spThreshold = parseInt(sliderEl.value, 10);
    thresholdValEl.textContent = spThreshold;
    await chrome.storage.local.set({ spThreshold });
    notifyContentScript();
  });

  function notifyContentScript() {
    chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
      if (!tabs.length) return;
      chrome.tabs.sendMessage(tabs[0].id, {
        spFilterEnabled,
        spThreshold
      });
    });
  }
});
