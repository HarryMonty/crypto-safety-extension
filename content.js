(() => {
    // Storage helpers
    function getIgnoredDomains() {
        return new Promise((resolve) => {
            chrome.storage.local.get({ ignoredDomains: [] }, (data) => {
                resolve(Array.isArray(data.ignoredDomains) ? data.ignoredDomains : []);
            });
        });
    }

    function addIgnoredDomain(siteKey) {
        return new Promise((resolve) => {
            chrome.storage.local.get({ ignoredDomains: [] }, (data) => {
                const current = Array.isArray(data.ignoredDomains) ? data.ignoredDomains : [];
                if (!current.includes(siteKey)) current.push(siteKey);
                chrome.storage.local.set({ ignoredDomains: current }, () => resolve(current));
            });
        });
    }

    // Messages from popup
    chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
        if (!msg) return;

        if (msg.type === MessagingUtils.MSG.RESCAN) {
            window.location.reload();
            return;
        }

        if (msg.type === MessagingUtils.MSG.IGNORE_DOMAIN_UPDATED) {
            const existing = document.getElementById("cryptoSafetyWarningPopup");
            if (existing) existing.remove();

            console.log("[CryptoSafety] Ignore updated:", msg.siteKey, "ignored:", msg.ignored);
            sendResponse({ ok: true });
            return;
        }
    });

    // Prevent duplicates
    if (window._cryptoSafetyInjected) return;
    window._cryptoSafetyInjected = true;

    const siteKey = getSiteKeyFromUrl(window.location.href);

    // Scan + send
    (async () => {
        const ignored = await getIgnoredDomains();
        if (ignored.includes(siteKey)) {
            console.log(`[CryptoSafety] Site ${siteKey} is ignored, skipping checks.`);
            return;
        }

       const pageText = document.body?.innerText || "";
       const seedHits = TextScanUtils.seedPhraseMatches(pageText);
       const seedPhraseTextFound = seedHits.length > 0;
       console.log("[CryptoSafety] seed hits:", seedHits);

        const inputs = Array.from(document.querySelectorAll("input"));
        const textareas = Array.from(document.querySelectorAll("textarea"));

        const inputCount = inputs.length;
        const hasTextArea = textareas.length > 0;

        const pageSignals = {
            type: MessagingUtils.MSG.PAGE_SIGNALS,
            url: window.location.href,
            seedPhraseTextFound,
            seedHits,
            inputCount,
            hasTextArea
        };

        console.log("[CryptoSafety] Signals:", pageSignals);

        chrome.runtime.sendMessage(pageSignals, (response) => { // UTIL:msg
            console.log("[CryptoSafety] Background response:", response);

            if (!response || !response.ok) return;

            if (response.riskLevel === "CRITICAL") {
                showWarningPopup(response.reasons || []);
            }
        });
    })();

    // UI
    function showWarningPopup(reasons) {
        if (document.getElementById("cryptoSafetyWarningPopup")) return;

        const container = document.createElement("div");
        container.id = "cryptoSafetyWarningPopup";

        const reasonsText =
        reasons && reasons.length > 0 ? reasons.join(", ") : "suspicious seed phrase form pattern";

        container.innerHTML = `
        <div class="cs-card">
            <div class="cs-header">
            <div class="cs-title">
                <span>⚠ Crypto Safety</span>
                <span class="cs-badge">HIGH RISK</span>
            </div>
            <div class="cs-actions">
                <button id="csMinBtn" title="Minimize">Minimize</button>
                <button id="csIgnoreBtn" title="Don't warn on this site">Ignore site</button>
                <button id="csDismissBtn" title="Dismiss">Dismiss</button>
            </div>
            </div>

            <div class="cs-body">
            <div class="cs-msg">
                This site appears to be asking for your seed phrase/private key.
                Never enter your seed phrase into a website.
            </div>

            <div class="cs-meta">
                Site: <b>${siteKey}</b><br/>
                Detected: <b>${reasonsText}</b>
            </div>

            <details>
                <summary>Why am I seeing this?</summary>
                <div class="cs-detailText">
                Pages that request seed phrases/private keys are commonly phishing attempts.
                Legitimate wallets and dApps should never ask you to type your seed phrase into a web form.
                If you were sent here by a link or an “airdrop/claim” page, assume it’s a scam until proven otherwise.
                </div>
            </details>
            </div>
        </div>
        `;

        document.documentElement.appendChild(container);

        const dismissBtn = container.querySelector("#csDismissBtn");
        const minBtn = container.querySelector("#csMinBtn");
        const ignoreBtn = container.querySelector("#csIgnoreBtn");

        ignoreBtn.addEventListener("click", async () => {
            await addIgnoredDomain(siteKey);
            container.remove();
            console.log(`[CryptoSafety] Site ${siteKey} added to ignored list.`);
        });

        dismissBtn.addEventListener("click", () => container.remove());

        minBtn.addEventListener("click", () => {
            container.classList.toggle("cs-min");
            minBtn.textContent = container.classList.contains("cs-min") ? "Expand" : "Minimize";
        });
    }
})();
