let spFilterEnabled = false;
let spThreshold = 19;

const observer = new MutationObserver((mutationsList, observer) => {
  if (!spFilterEnabled) return;
  applyFilter();
});
observer.observe(document.body, { childList: true, subtree: true });

initFromStorage();

async function initFromStorage() {
  const { spFilterEnabled: enabled, spThreshold: threshold } = await chrome.storage.local.get({
    spFilterEnabled: false,
    spThreshold: 19
  });
  spFilterEnabled = enabled;
  spThreshold = threshold;
  if (spFilterEnabled) applyFilter();
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.spFilterEnabled !== undefined) {
    spFilterEnabled = message.spFilterEnabled;
    spThreshold = message.spThreshold;
    if (spFilterEnabled) {
      applyFilter();
    } else {
      removeFilter();
    }
    sendResponse({ status: 'ok' });
  }
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
 * Returns true if the card should be hidden.
 *
 * Conditions:
 * 1. If a card has a .sticker-percentage element:
 *    a. If its text does not contain "%SP" (case-insensitive), hide the card.
 *    b. If its text starts with ">", hide the card.
 *    c. If its text matches the pattern "X% SP" and X is greater than or equal to the threshold, hide the card.
 * 2. If no .sticker-percentage element exists, hide the card.
 */
function shouldHide(card) {
  const stickerElem = card.querySelector('.sticker-percentage');
  if (stickerElem) {
    const txt = stickerElem.textContent.trim();
    // Remove if text does not contain "%SP"
    if (!/%\s*SP/i.test(txt)) {
      return true;
    }
    // Remove if text starts with ">"
    if (txt.startsWith('>')) {
      return true;
    }
    // Match the "X% SP" pattern and compare numeric value
    const match = txt.match(/^(\d+(\.\d+)?)%\s*SP$/i);
    if (match) {
      const value = parseFloat(match[1]);
      return value >= spThreshold;
    }
    // If sticker text exists but does not match the valid pattern, remove the card.
    return true;
  }
  // Hide the card if there is no sticker-percentage element.
  return true;
}
