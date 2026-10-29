// Only acts on text the user explicitly selects and chooses to check; no page content is read otherwise.
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: 'satark-check-selection',
    title: 'Check with Satark Saathi',
    contexts: ['selection'],
  });
});

chrome.contextMenus.onClicked.addListener(async (info) => {
  if (info.menuItemId !== 'satark-check-selection' || !info.selectionText) return;
  await chrome.storage.session.set({ pendingText: info.selectionText.slice(0, 4000) });
  chrome.action.setBadgeText({ text: '1' });
  chrome.action.setBadgeBackgroundColor({ color: '#176B58' });
  try {
    await chrome.action.openPopup();
  } catch {
    // openPopup is unavailable on some Chrome versions; the badge tells the user to click the icon.
  }
});
