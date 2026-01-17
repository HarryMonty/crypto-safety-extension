(function () {
    const SEED_KEYWORDS = [
        "seed phrase",
        "recovery phrase",
        "secret recovery phrase",
        "private key",
        "wallet phrase",
        "12 words",
        "24 words",
    ];

    const URGENCY_KEYWORDS = [
        "urgant",
        "immediate action required",
        "act now",
        "your funds will be lost",
        "account will be closed",
        "limited time",
    ];

    // Normalize text: lower case, remove extra spaces
    function normalizeText(s) {
        return (s || "")
            .toLowerCase()
            .replace(/\s+/g, " ")
            .trim();
    }
    
    // Return a list of phrases
    function findPhraseMatched(text, phrases) {
        const t = normalizeText(text);
        const hits = [];

        for (const phrase of phrases) {
            const needle = normalizeText(phrase);
            if (!needle) continue;

            if (t.includes(needle)) {
                hits.push(phrase);
            }
        }

        return hits;
    }

    // Convenience wrappers
    function hasAny(text, phrases) {
        return findPhraseMatched(text, phrases).length > 0;
    }
    function seedPhraseMatches(text) {
        return findPhraseMatched(text, SEED_KEYWORDS);
    }
    function urgencyPhraseMatches(text) {
        return findPhraseMatched(text, URGENCY_KEYWORDS);
    }

    globalThis.TextScanUtils = {
        normalizeText,
        findPhraseMatched,
        hasAny,
        seedPhraseMatches,
        urgencyPhraseMatches,
        SEED_KEYWORDS,
        URGENCY_KEYWORDS,
    };
})();