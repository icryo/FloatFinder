let settings = {
  stickerFilterEnabled: false,
  stickerThreshold: 19,
  fadeFilterEnabled: false,
  fadeThreshold: 90,
  watchFilterEnabled: false,
  watchThreshold: 10,
  appraisalFilterEnabled: false,
  appraisalThreshold: 100,
  paintSeedFilterEnabled: false,
  allowedPaintSeeds: "127"
};

async function loadSettings() {
  try {
    const storedValues = await chrome.storage.local.get(settings);
    Object.assign(settings, storedValues);
    console.log("[SP Filter] Loaded settings:", settings);
    applyFilter();
  } catch (error) {
    console.error("[SP Filter] Error loading settings:", error);
  }
}

const observer = new MutationObserver(() => {
  try {
    applyFilter();
  } catch (error) {
    console.error("[SP Filter] Error in MutationObserver:", error);
  }
});
observer.observe(document.body, { childList: true, subtree: true });

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  try {
    console.log("[SP Filter] Received new settings:", message);
    Object.assign(settings, message);
    applyFilter();
    sendResponse({ status: 'ok' });
  } catch (error) {
    console.error("[SP Filter] Error handling message:", error);
  }
});

async function init() {
  await loadSettings();
  applyFilter();
}

// Ensure initialization runs even if DOMContentLoaded has already fired
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

function applyFilter() {
  try {
    document.querySelectorAll('item-card').forEach((card) => {
      if (shouldHide(card)) {
        card.style.display = 'none';
      } else {
        card.style.display = '';
      }
    });
  } catch (error) {
    console.error("[SP Filter] Error applying filter:", error);
  }
}

function shouldHide(card) {
  return (
    (settings.stickerFilterEnabled && checkSticker(card)) ||
    (settings.fadeFilterEnabled && checkFade(card)) ||
    (settings.watchFilterEnabled && checkWatchCount(card)) ||
    (settings.appraisalFilterEnabled && checkAppraisal(card)) ||
    (settings.paintSeedFilterEnabled && !checkPaintSeed(card))
  );
}

function checkSticker(card) {
  try {
    const stickerElem = card.querySelector('.sticker-percentage');
    // If there's no SP element, remove the card when the toggle is on.
    if (!stickerElem) return true;
    const match = stickerElem.textContent.trim().match(/>?(\d+(\.\d+)?)%\s*SP/i);
    // If the text doesn't match, treat it as missing and remove the card.
    if (!match) return true;
    return parseFloat(match[1]) >= settings.stickerThreshold;
  } catch (error) {
    console.error("[SP Filter] Error checking sticker percentage:", error);
    return true;
  }
}

function checkFade(card) {
  try {
    const fadeElem = card.querySelector('.fade');
    if (!fadeElem) return false;
    const match = fadeElem.textContent.trim().match(/^(\d+(\.\d+)?)$/);
    return match ? parseFloat(match[1]) < settings.fadeThreshold : false;
  } catch (error) {
    console.error("[SP Filter] Error checking fade percentage:", error);
    return false;
  }
}

function checkWatchCount(card) {
  try {
    const watchElem = card.querySelector('.count');
    if (!watchElem) return false;
    const watchText = watchElem.textContent.replace(/[^\d]/g, '').trim();
    if (!watchText) return false;
    const watchValue = parseInt(watchText, 10);
    return watchValue < settings.watchThreshold;
  } catch (error) {
    console.error("[SP Filter] Error checking watch count:", error);
    return false;
  }
}

function checkAppraisal(card) {
  try {
    const appraisalElem = card.querySelector('.reference .percentage');
    if (!appraisalElem) return false;
    const appraisalText = appraisalElem.textContent.replace(/[^\d.]/g, '').trim();
    if (!appraisalText) return false;
    const appraisalValue = parseFloat(appraisalText);
    return appraisalValue < settings.appraisalThreshold;
  } catch (error) {
    console.error("[SP Filter] Error checking appraisal price:", error);
    return false;
  }
}

function checkPaintSeed(card) {
  try {
    // Assuming that the paint seed is shown in an element with the class "paint-seed"
    const seedElem = card.querySelector('.paint-seed');
    if (!seedElem) return false;
    const seedValue = seedElem.textContent.trim();
    // Split allowed seeds by whitespace or commas (e.g. "127 200 300" or "127,200,300")
    const allowedSeeds = settings.allowedPaintSeeds.split(/[\s,]+/);
    return allowedSeeds.includes(seedValue);
  } catch (error) {
    console.error("[SP Filter] Error checking paint seed:", error);
    return false;
  }
}
