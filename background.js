// Example background script for a Chrome extension
//chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
//  console.log("Background got message:", message, "from:", sender?.tab?.url);
//  sendResponse({ ok: true });
//});

const lastResultsByTab = new Map();

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message && message.type === "GET_LAST_RESULT") {
        const tabId = message.tabId;
        const result = lastResultsByTab.get(tabId) || { riskLevel: "UNKNOWN", reasons: [] };
        sendResponse(result);
        return;
    }

    if (!message || message.type !== "PAGE_SIGNALS") {
        sendResponse({ ok: true, ignored: true });
        return;
    }

    const url = sender?.tab?.url || message.url || "(unknown)";
    console.log(`[CryptoSafety]: Received signals for: ${url}`);
    console.log("[CryptoSafety]: Signals data:", message);

    // Temporary V1 rules
        // * If both suspicious text and suspicious inputs are present - CRITICAL
    let riskLevel = "SAFE";
    let reasons = [];

    if (message.seedPhraseTextFound && message.seedPhraseInputsFound) {
        riskLevel = "CRITICAL";
        reasons = ["SEED_PHRASE_FORM"];
    }
    
    const tabId = sender?.tab?.id;
    if (tabId !== null) {
        lastResultsByTab.set(tabId, { riskLevel, reasons });
    }

    sendResponse({ ok: true, riskLevel, reasons });
});
