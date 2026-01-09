// Example background script for a Chrome extension
//chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
//  console.log("Background got message:", message, "from:", sender?.tab?.url);
//  sendResponse({ ok: true });
//});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
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

    if (message.seedPhraseTextFound && message.seedPhraseInputsFound) {
        riskLevel = "CRITICAL";
    }

    sendResponse({ 
        ok: true, 
        riskLevel,
        reasons: riskLevel === "CRITICAL" ? ["SEED_PHRASE_FORM"] : [],
    });
});
