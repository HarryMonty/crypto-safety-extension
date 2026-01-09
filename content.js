// Notify the background script that the page has loaded
//chrome.runtime.sendMessage(
//  { type: "PAGE_LOADED", url: window.location.href },
//  (response) => {
//    console.log("Content got response:", response);
//  }
//);

(() => {
    // Prevent duplicates
    if (window._cryotoSafetyInjected) return;
    window._cryotoSafetyInjected = true;

    const KEYWORDS = [
        "seed phrase",
        "recovery phrase",
        "secret recovery phrase",
        "private key",
        "12 words",
        "24 words",
    ];

    // Detect signals
    const pageText = (document.body?.innerText || "").toLowerCase();
    const seedPhraseTextFound = KEYWORDS.some((keyword) => pageText.includes(keyword));

    // Detect inputs/form signal
    const inputs = Array.from(document.querySelectorAll("input"));
    const textareas = Array.from(document.querySelectorAll("textarea"));

    const inputCount = inputs.length;
    const hasTextArea = textareas.length > 0;

    // Simple rules for V1:
        // * Text area often used to paste full seed phrase
        // * 12+ inputs often used for 12-word phrase
        // * 24+ inputs sometimes used for 24-word phrase
    const seedPhraseInputsFound = hasTextArea || inputCount >= 12;

    // Build signals object
    const pageSignals = {
        type: "PAGE_SIGNALS",
        url: window.location.href,
        seedPhraseTextFound,
        inputCount,
        hasTextArea,
        seedPhraseInputsFound,
    };

    console.log("[CryptoSafety]: Signals:", pageSignals);

    // Send signals to background, get risk decision
    chrome.runtime.sendMessage(pageSignals, (response) => {
        console.log("[CryptoSafety]: Background response:", response);

        if (!response || !response.ok) return;

        if (response.riskLevel === "CRITICAL") {
            showWarningPopup(response.reasons || []);
        }
    });

    function showWarningPopup(reasons) {
        if (document.getElementById("cryptoSafetyWarningPopup")) return;

        const container = document.createElement("div");
        container.id = "cryptoSafetyWarningPopup";

        const reasonsText =
            reasons && reasons.length > 0
            ? reasons.join(", ")
            : "suspicious seed phrase form pattern";

        const domain = window.location.hostname;

        container.innerHTML = `
            <div class="cs-card">
                <div class="cs-header">
                    <div class="cs-title">
                        <span>⚠ Crypto Safety</span>
                        <span class="cs-badge">HIGH RISK</span>
                    </div>
                    <div class="cs-actions">
                        <button id="csMinBtn" title="Minimize">Minimize</button>
                        <button id="csDismissBtn" title="Dismiss">Dismiss</button>
                    </div>
                </div>

                <div class="cs-body">
                    <div class="cs-msg">
                        This site appears to be asking for your seed phrase/private key.
                        Never enter your seed phrase into a website.
                    </div>

                    <div class="cs-meta">
                        Site: <b>${domain}</b><br/>
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

        dismissBtn.addEventListener("click", () => container.remove());

        minBtn.addEventListener("click", () => {
            container.classList.toggle("cs-min");
            minBtn.textContent = container.classList.contains("cs-min") ? "Expand" : "Minimize";
        });
    }
})();
