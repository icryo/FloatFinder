document.addEventListener('DOMContentLoaded', async () => {
  const settings = [
    { id: 'toggleStickerFilter', key: 'stickerFilterEnabled' },
    { id: 'toggleFadeFilter', key: 'fadeFilterEnabled' },
    { id: 'toggleWatchFilter', key: 'watchFilterEnabled' },
    { id: 'toggleAppraisalFilter', key: 'appraisalFilterEnabled' }
  ];

  const sliders = [
    { id: 'stickerThresholdSlider', key: 'stickerThreshold', displayId: 'stickerThresholdValue', default: 19 },
    { id: 'fadeThresholdSlider', key: 'fadeThreshold', displayId: 'fadeThresholdValue', default: 90 },
    { id: 'watchThresholdSlider', key: 'watchThreshold', displayId: 'watchThresholdValue', default: 10 },
    { id: 'appraisalThresholdSlider', key: 'appraisalThreshold', displayId: 'appraisalThresholdValue', default: 100 }
  ];

  // Load initial values from storage with defaults
  const storedValues = await chrome.storage.local.get({
    stickerFilterEnabled: false,
    stickerThreshold: 19,
    fadeFilterEnabled: false,
    fadeThreshold: 90,
    watchFilterEnabled: false,
    watchThreshold: 10,
    appraisalFilterEnabled: false,
    appraisalThreshold: 100
  });

  // Initialize toggles
  settings.forEach(({ id, key }) => {
    const element = document.getElementById(id);
    element.checked = storedValues[key];
    element.addEventListener('change', async () => {
      await chrome.storage.local.set({ [key]: element.checked });
      notifyContentScript();
    });
  });

  // Initialize sliders
  sliders.forEach(({ id, key, displayId, default: defaultValue }) => {
    const slider = document.getElementById(id);
    const display = document.getElementById(displayId);
    slider.value = storedValues[key] ?? defaultValue;
    display.textContent = slider.value;

    slider.addEventListener('input', async () => {
      display.textContent = slider.value;
      await chrome.storage.local.set({ [key]: parseFloat(slider.value) });
      notifyContentScript();
    });
  });

  // Updated notify function to fetch the latest settings before messaging the content script
  async function notifyContentScript() {
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tabs.length) return;

    const updatedValues = await chrome.storage.local.get({
      stickerFilterEnabled: false,
      stickerThreshold: 19,
      fadeFilterEnabled: false,
      fadeThreshold: 90,
      watchFilterEnabled: false,
      watchThreshold: 10,
      appraisalFilterEnabled: false,
      appraisalThreshold: 100
    });

    chrome.scripting.executeScript({
      target: { tabId: tabs[0].id },
      files: ["contentScript.js"]
    }, () => {
      if (chrome.runtime.lastError) {
        console.warn("Content script not injected:", chrome.runtime.lastError);
        return;
      }
      chrome.tabs.sendMessage(tabs[0].id, updatedValues);
    });
  }
});
