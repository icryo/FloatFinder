// popup.js
document.addEventListener('DOMContentLoaded', async () => {
  const defaults = {
    stickerFilterEnabled: false,
    stickerThreshold: 19,
    fadeFilterEnabled: false,
    fadeThreshold: 90,
    watchFilterEnabled: false,
    watchThreshold: 10,
    appraisalFilterEnabled: false,
    appraisalThreshold: 0,
    appraisalDiscountedOnly: false,
    paintSeedFilterEnabled: false,
    allowedPaintSeeds: "127"
  };

  let storedValues;
  try {
    storedValues = await browser.storage.local.get(defaults);
  } catch (error) {
    storedValues = { ...defaults };
  }

  const toggleMappings = [
    { checkboxId: 'toggleStickerFilterSwitch', key: 'stickerFilterEnabled' },
    { checkboxId: 'toggleFadeFilterSwitch',    key: 'fadeFilterEnabled' },
    { checkboxId: 'toggleWatchFilterSwitch',   key: 'watchFilterEnabled' },
    { checkboxId: 'toggleAppraisalFilterSwitch', key: 'appraisalFilterEnabled' },
    { checkboxId: 'togglePaintSeedFilterSwitch', key: 'paintSeedFilterEnabled' },
    { checkboxId: 'toggleAppraisalDiscountedOnly', key: 'appraisalDiscountedOnly' }
  ];

  toggleMappings.forEach(({ checkboxId, key }) => {
    const checkboxEl = document.getElementById(checkboxId);
    if (!checkboxEl) return;
    checkboxEl.checked = storedValues[key];
    checkboxEl.addEventListener('change', async () => {
      await browser.storage.local.set({ [key]: checkboxEl.checked });
      sendUpdatedSettings();
    });
  });

  const sliderConfigs = [
    {
      sliderId: 'stickerThresholdSlider',
      key: 'stickerThreshold',
      displayId: 'stickerThresholdValue',
      inputId: 'stickerThresholdInput'
    },
    {
      sliderId: 'fadeThresholdSlider',
      key: 'fadeThreshold',
      displayId: 'fadeThresholdValue',
      inputId: 'fadeThresholdInput'
    },
    {
      sliderId: 'watchThresholdSlider',
      key: 'watchThreshold',
      displayId: 'watchThresholdValue',
      inputId: 'watchThresholdInput'
    },
    {
      sliderId: 'appraisalThresholdSlider',
      key: 'appraisalThreshold',
      displayId: 'appraisalThresholdValue',
      inputId: 'appraisalThresholdInput'
    }
  ];

  sliderConfigs.forEach(({ sliderId, key, displayId, inputId }) => {
    const sliderEl = document.getElementById(sliderId);
    const displayEl = document.getElementById(displayId);
    const inputEl = document.getElementById(inputId);
    if (!sliderEl || !displayEl || !inputEl) return;
    sliderEl.value = storedValues[key];
    displayEl.textContent = storedValues[key];
    inputEl.value = storedValues[key];

    const onValueChange = async (newVal) => {
      const numericVal = parseFloat(newVal);
      await browser.storage.local.set({ [key]: numericVal });
      displayEl.textContent = numericVal;
      sendUpdatedSettings();
    };

    sliderEl.addEventListener('input', () => {
      inputEl.value = sliderEl.value;
      onValueChange(sliderEl.value);
    });

    inputEl.addEventListener('input', () => {
      sliderEl.value = inputEl.value;
      onValueChange(inputEl.value);
    });
  });

  const paintSeedInput = document.getElementById('paintSeedListInput');
  if (paintSeedInput) {
    paintSeedInput.value = storedValues.allowedPaintSeeds;
    paintSeedInput.addEventListener('input', async () => {
      await browser.storage.local.set({ allowedPaintSeeds: paintSeedInput.value });
      sendUpdatedSettings();
    });
  }

  async function sendUpdatedSettings() {
    try {
      const latest = await browser.storage.local.get(defaults);
      const tabs = await browser.tabs.query({
        active: true,
        currentWindow: true,
        url: ["*://csfloat.com/*", "*://www.csfloat.com/*"]
      });
      if (tabs && tabs.length > 0) {
        await browser.tabs.sendMessage(tabs[0].id, latest);
      }
    } catch (err) {
      // In production, you might silently fail here.
    }
  }
});
