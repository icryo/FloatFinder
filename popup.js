document.addEventListener('DOMContentLoaded', async () => {
  const stickerToggleEl = document.getElementById('toggleStickerFilter');
  const stickerSliderEl = document.getElementById('stickerThresholdSlider');
  const stickerThresholdValEl = document.getElementById('stickerThresholdValue');

  const fadeToggleEl = document.getElementById('toggleFadeFilter');
  const fadeSliderEl = document.getElementById('fadeThresholdSlider');
  const fadeThresholdValEl = document.getElementById('fadeThresholdValue');

  let { stickerFilterEnabled, stickerThreshold, fadeFilterEnabled, fadeThreshold } = await chrome.storage.local.get({
    stickerFilterEnabled: false,
    stickerThreshold: 19,
    fadeFilterEnabled: false,
    fadeThreshold: 90
  });

  stickerToggleEl.checked = stickerFilterEnabled;
  stickerSliderEl.value = stickerThreshold;
  stickerThresholdValEl.textContent = stickerThreshold;

  fadeToggleEl.checked = fadeFilterEnabled;
  fadeSliderEl.value = fadeThreshold;
  fadeThresholdValEl.textContent = fadeThreshold;

  stickerToggleEl.addEventListener('change', async () => {
    stickerFilterEnabled = stickerToggleEl.checked;
    await chrome.storage.local.set({ stickerFilterEnabled });
    notifyContentScript();
  });

  stickerSliderEl.addEventListener('input', async () => {
    stickerThreshold = parseFloat(stickerSliderEl.value);
    stickerThresholdValEl.textContent = stickerThreshold;
    await chrome.storage.local.set({ stickerThreshold });
    notifyContentScript();
  });

  fadeToggleEl.addEventListener('change', async () => {
    fadeFilterEnabled = fadeToggleEl.checked;
    await chrome.storage.local.set({ fadeFilterEnabled });
    notifyContentScript();
  });

  fadeSliderEl.addEventListener('input', async () => {
    fadeThreshold = parseFloat(fadeSliderEl.value);
    fadeThresholdValEl.textContent = fadeThreshold;
    await chrome.storage.local.set({ fadeThreshold });
    notifyContentScript();
  });

  function notifyContentScript() {
    chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
      if (!tabs.length) return;
      chrome.tabs.sendMessage(tabs[0].id, {
        stickerFilterEnabled,
        stickerThreshold,
        fadeFilterEnabled,
        fadeThreshold
      });
    });
  }
});
