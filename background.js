// Example background script for a Chrome extension
//chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
//  console.log("Background got message:", message, "from:", sender?.tab?.url);
//  sendResponse({ ok: true });
//});

// Store last decision per tab
const tabResults = new Map();

function getTabId(sender, message) {
    return sender?.tab?.id ?? message?.tabId ?? null;
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    // popup asking for last known result
    if (message && message.type === "GET_LAST_RESULT") {
        const tabId = message.tabId;
        const data = tabResults.get(tabId);

        sendResponse(
        data
            ? { ok: true, ...data }
            : { ok: true, riskLevel: "UNKNOWN", reasons: [], url: null, ts: null }
        );
        return true;
    }

    // content script sending signals
    if (!message || message.type !== "PAGE_SIGNALS") {
        sendResponse({ ok: true, ignored: true });
        return true;
    }

    const tabId = getTabId(sender, message);
    const url = sender?.tab?.url || message.url || "(unknown)";

    // scoring logic
    let riskLevel = "SAFE";
    let reasons = [];

    if (message.seedPhraseTextFound && message.seedPhraseInputsFound) {
        riskLevel = "CRITICAL";
        reasons.push("SEED_PHRASE_FORM");
    }

    // Store decision per tab so popup can read it later
    if (tabId !== null) {
        tabResults.set(tabId, {
        riskLevel,
        reasons,
        url,
        ts: Date.now(),
        });
    }

    console.log(`[CryptoSafety] Stored result for tab ${tabId}:`, { riskLevel, reasons, url });

    sendResponse({ ok: true, riskLevel, reasons });
    return true;
});

// remove stored results when a tab closes
chrome.tabs.onRemoved.addListener((tabId) => {
    tabResults.delete(tabId);
});

// clear result on navigation
chrome.tabs.onUpdated.addListener((tabId, changeInfo) => {
    if (changeInfo.status === "loading") {
        tabResults.delete(tabId);
    }
});