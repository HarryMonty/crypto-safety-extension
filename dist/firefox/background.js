// Example background script for a Chrome extension
//chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
//  console.log("Background got message:", message, "from:", sender?.tab?.url);
//  sendResponse({ ok: true });
//});

const tabResults = new Map();

function getTabId(sender, message) {
    return sender?.tab?.id ?? message?.tabId ?? null;
}

const lastResultByTab = {};

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (!message || !message.type) return;

    if (message.type === MessagingUtils.MSG.PAGE_SIGNALS) {
        const tabId = sender.tab?.id;

        if (tabId == null) {
            sendResponse({ ok: false, error: "No tab ID" });
            return;
        }

        const result = HeuristicUtils.evaluateSignals(message);

        lastResultByTab[tabId] = result;

        sendResponse({
            ok: true,
            ...result,
        });
        return;
    }

    if (message.type === MessagingUtils.MSG.GET_LAST_RESULT) {
        const tabId = message.tabId;

        sendResponse(lastResultByTab[tabId] || { riskLevel: "UNKNOWN", reasons: [] });
        return;
    }
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