(function () {
    // Risk thresholds
    const THRESHOLDS = {
        SAFE_MAX: 19,
        CAUTION_MAX: 39,
        WARNING_MAX: 69,
        CRITICAL_MIN: 70,
    };

    // Reason codes
    const REASONS = {
        SEED_TEXT: "Seed phrase language detected",
        SEED_INPUTS: "Inputs that may collect seed phrases",
        SEED_PATTERN: "Multiple fields consistent with 12/24-word seed phrase input",
    };

    // Seed phrase harvesting heuristic
    function evaluateSeedPhraseHeuristic(signals) {
        let score = 0;
        const reasons = [];

        const hasSeedText = signals.seedPhraseTextFound === true;
        const hasSeedInputs = (signals.hasTextArea === true) || ((signals.inputCount || 0) >= 12);
        if (hasSeedText) {
            score += 30;
            reasons.push(REASONS.SEED_TEXT);
        }

        if (hasSeedText && hasSeedInputs) {
            score += 40;
            reasons.push(REASONS.SEED_INPUTS);
        }

        if (hasSeedText && (signals.inputCount || 0) >= 12) {
            score += 20;
            reasons.push(REASONS.SEED_PATTERN);
        }

        return { scoreDelta: score, reasons };
    }

    // Numeric score to risk level
    function scoreToRiskLevel(score) {
        if (score <= THRESHOLDS.SAFE_MAX) return "SAFE";
        if (score <= THRESHOLDS.CAUTION_MAX) return "CAUTION";
        if (score <= THRESHOLDS.WARNING_MAX) return "WARNING";
        return "CRITICAL";
    }

    function evaluateSignals(signals) {
        let totalScore = 0;
        const allReasons = [];

        const seedResult = evaluateSeedPhraseHeuristic(signals);
        totalScore += seedResult.scoreDelta;
        allReasons.push(...seedResult.reasons);

        const riskLevel = scoreToRiskLevel(totalScore);

        return {
            score: totalScore,
            riskLevel,
            reasons: allReasons,
        };
    }

    globalThis.HeuristicUtils = {
        evaluateSignals,
        scoreToRiskLevel,
        THRESHOLDS,
        REASONS,
    };
})();