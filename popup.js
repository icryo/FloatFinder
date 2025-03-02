document.addEventListener('DOMContentLoaded', async () => {
  // Existing toggle settings for other filters...
  const settings = [
    { checkboxId: 'toggleStickerFilterSwitch', key: 'stickerFilterEnabled' },
    { checkboxId: 'toggleFadeFilterSwitch', key: 'fadeFilterEnabled' },
    { checkboxId: 'toggleWatchFilterSwitch', key: 'watchFilterEnabled' },
    { checkboxId: 'toggleAppraisalFilterSwitch', key: 'appraisalFilterEnabled' }
  ];

  // Existing slider definitions for other filters...
  const sliders = [
    { sliderId: 'stickerThresholdSlider', key: 'stickerThreshold', displayId: 'stickerThresholdValue', inputId: 'stickerThresholdInput', default: 19 },
    { sliderId: 'fadeThresholdSlider', key: 'fadeThreshold', displayId: 'fadeThresholdValue', inputId: 'fadeThresholdInput', default: 90 },
    { sliderId: 'watchThresholdSlider', key: 'watchThreshold', displayId: 'watchThresholdValue', inputId: 'watchThresholdInput', default: 10 },
    { sliderId: 'appraisalThresholdSlider', key: 'appraisalThreshold', displayId: 'appraisalThresholdValue', inputId: 'appraisalThresholdInput', default: 0 }
  ];

  // Load initial values from storage with new defaults for the paint seed filter.
  const storedValues = await chrome.storage.local.get({
    stickerFilterEnabled: false,
    stickerThreshold: 19,
    fadeFilterEnabled: false,
    fadeThreshold: 90,
    watchFilterEnabled: false,
    watchThreshold: 10,
    appraisalFilterEnabled: false,
    appraisalThreshold: 0,
    paintSeedFilterEnabled: false,
    allowedPaintSeeds: "127"
  });

  // Initialize toggles for other filters...
  settings.forEach(({ checkboxId, key }) => {
    const toggle = document.getElementById(checkboxId);
    toggle.checked = storedValues[key];
    toggle.addEventListener('change', async () => {
      await chrome.storage.local.set({ [key]: toggle.checked });
      notifyContentScript();
    });
  });

  // Initialize sliders for other filters...
  sliders.forEach(({ sliderId, key, displayId, inputId, default: defaultValue }) => {
    const slider = document.getElementById(sliderId);
    const display = document.getElementById(displayId);
    const inputBox = document.getElementById(inputId);

    slider.value = storedValues[key] ?? defaultValue;
    display.textContent = slider.value;
    inputBox.value = slider.value;

    slider.addEventListener('input', async () => {
      display.textContent = slider.value;
      inputBox.value = slider.value;
      await chrome.storage.local.set({ [key]: parseFloat(slider.value) });
      notifyContentScript();
    });

    inputBox.addEventListener('input', async () => {
      slider.value = inputBox.value;
      display.textContent = inputBox.value;
      await chrome.storage.local.set({ [key]: parseFloat(inputBox.value) });
      notifyContentScript();
    });
  });

  // --- New: Initialize Paint Seed Filter elements ---
  const paintSeedToggle = document.getElementById('togglePaintSeedFilterSwitch');
  paintSeedToggle.checked = storedValues.paintSeedFilterEnabled;
  paintSeedToggle.addEventListener('change', async () => {
    await chrome.storage.local.set({ paintSeedFilterEnabled: paintSeedToggle.checked });
    notifyContentScript();
  });

  const paintSeedInput = document.getElementById('paintSeedListInput');
  paintSeedInput.value = storedValues.allowedPaintSeeds || "127";
  paintSeedInput.addEventListener('input', async () => {
    await chrome.storage.local.set({ allowedPaintSeeds: paintSeedInput.value });
    notifyContentScript();
  });

  // Updated notify function to include paint seed filter settings
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
      appraisalThreshold: 0,
      paintSeedFilterEnabled: false,
      allowedPaintSeeds: "127"
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
