// contentScript.js

let settings = {
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
};

async function init() {
  try {
    const storedValues = await browser.storage.local.get(settings);
    Object.assign(settings, storedValues);
  } catch (err) {}
  applyFilter();
}

browser.runtime.onMessage.addListener((message) => {
  Object.assign(settings, message);
  applyFilter();
});

const observer = new MutationObserver(() => {
  try {
    applyFilter();
  } catch (error) {}
});
observer.observe(document.body, { childList: true, subtree: true });

function applyFilter() {
  const cards = document.querySelectorAll('item-card');
  cards.forEach((card) => {
    if (shouldHide(card)) {
      card.style.display = 'none';
    } else {
      card.style.display = '';
    }
  });
}

function shouldHide(card) {
  return (
    (settings.stickerFilterEnabled && checkSticker(card)) ||
    (settings.fadeFilterEnabled && checkFade(card)) ||
    (settings.watchFilterEnabled && checkWatchCount(card)) ||
    (settings.appraisalFilterEnabled && checkAppraisal(card)) ||
    (settings.paintSeedFilterEnabled && checkPaintSeed(card))
  );
}

function checkSticker(card) {
  try {
    const stickerElem = card.querySelector('.sticker-percentage');
    if (!stickerElem) return true;
    const match = stickerElem.textContent.trim().match(/>?(\d+(\.\d+)?)%\s*SP/i);
    return match ? parseFloat(match[1]) >= settings.stickerThreshold : true;
  } catch (error) {
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
    return false;
  }
}

function checkWatchCount(card) {
  try {
    const watchElem = card.querySelector('.count');
    if (!watchElem) return true;
    const watchText = watchElem.textContent.replace(/[^\d]/g, '').trim();
    if (!watchText) return true;
    const watchValue = parseInt(watchText, 10);
    return watchValue < settings.watchThreshold;
  } catch (error) {
    return true;
  }
}

function checkAppraisal(card) {
  try {
    const appraisalElem = card.querySelector('.reference .percentage');
    if (!appraisalElem) return false;
    const match = appraisalElem.textContent.trim().match(/-?\d+(\.\d+)?/);
    if (!match) return false;
    const appraisalValue = parseFloat(match[0]);
    return appraisalValue < settings.appraisalThreshold;
  } catch (error) {
    return false;
  }
}

function checkPaintSeed(card) {
  try {
    const seedElem = card.querySelector('.paint-seed');
    if (!seedElem) return true;
    const seedText = seedElem.textContent.trim();
    if (!seedText) return true;
    const seedValue = parseInt(seedText, 10);
    let allowedList = settings.allowedPaintSeeds
      .split(' ')
      .map(s => parseInt(s, 10))
      .filter(n => !isNaN(n));
    return !allowedList.includes(seedValue);
  } catch (error) {
    return true;
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
