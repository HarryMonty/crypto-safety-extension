(function () {
    const MSG = {
        PAGE_SIGNALS: "PAGE_SIGNALS",
        GET_LAST_RESULT: "GET_LAST_RESULT",
        RESCAN: "RESCAN",
        IGNORE_DOMAIN_UPDATED: "IGNORE_DOMAIN_UPDATED"
    };

    // Helper wrap
    function sendRuntimeMessage(message) {
        return new Promise((resolve) => {
            try {
                chrome.runtime.sendMessage(message, (response) => resolve(response));
            } catch (e) {
                resolve(null);
            }
        });
    }

    globalThis.MessagingUtils = {
        MSG,
        sendRuntimeMessage
    };
})();