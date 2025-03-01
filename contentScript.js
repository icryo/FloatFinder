let stickerFilterEnabled = false;
let stickerThreshold = 19;
let fadeFilterEnabled = false;
let fadeThreshold = 90;

const observer = new MutationObserver(() => {
  if (stickerFilterEnabled || fadeFilterEnabled) {
    applyFilter();
  }
});
observer.observe(document.body, { childList: true, subtree: true });

initFromStorage();

async function initFromStorage() {
  const { stickerFilterEnabled: stickerEnabled, stickerThreshold: stickerT, fadeFilterEnabled: fadeEnabled, fadeThreshold: fadeT } = await chrome.storage.local.get({
    stickerFilterEnabled: false,
    stickerThreshold: 19,
    fadeFilterEnabled: false,
    fadeThreshold: 90
  });
  stickerFilterEnabled = stickerEnabled;
  stickerThreshold = stickerT;
  fadeFilterEnabled = fadeEnabled;
  fadeThreshold = fadeT;
  applyFilter();
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.stickerFilterEnabled !== undefined) {
    stickerFilterEnabled = message.stickerFilterEnabled;
    stickerThreshold = message.stickerThreshold;
  }
  if (message.fadeFilterEnabled !== undefined) {
    fadeFilterEnabled = message.fadeFilterEnabled;
    fadeThreshold = message.fadeThreshold;
  }
  applyFilter();
  sendResponse({ status: 'ok' });
});

function applyFilter() {
  const cards = document.querySelectorAll('item-card');
  cards.forEach(card => {
    if (shouldHide(card)) {
      card.style.display = 'none';
    } else {
      card.style.display = '';
    }
  });
}

function removeFilter() {
  const cards = document.querySelectorAll('item-card');
  cards.forEach(card => {
    card.style.display = '';
  });
}

/**
 * Determines whether a card should be hidden.
 *
 * Sticker Filtering:
 * - Removes cards missing a valid "% SP" sticker.
 * - Removes cards with a sticker greater than or equal to the set threshold.
 * - Removes cards with ">100% SP".
 *
 * Fade Filtering:
 * - Removes cards with a fade percentage **below** the set threshold.
 */
function shouldHide(card) {
  let hideCard = false;

  if (stickerFilterEnabled) {
    const stickerElem = card.querySelector('.sticker-percentage');
    if (stickerElem) {
      const txt = stickerElem.textContent.trim();
      if (!/%\s*SP/i.test(txt)) return true;
      if (txt.startsWith('>')) return true;

      const match = txt.match(/^(\d+(\.\d+)?)%\s*SP$/i);
      if (match) {
        const value = parseFloat(match[1]);
        if (value >= stickerThreshold) hideCard = true;
      }
    } else {
      hideCard = true;
    }
  }

  if (fadeFilterEnabled) {
    const fadeElem = card.querySelector('.fade');
    if (fadeElem) {
      const fadeValue = parseFloat(fadeElem.textContent.trim());
      if (!isNaN(fadeValue) && fadeValue < fadeThreshold) hideCard = true;
    }
  }

  return hideCard;
}
