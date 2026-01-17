async function getActiveTab() {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    return tab;
}

function getIgnoredDomains() {
    return new Promise((resolve) => {
        chrome.storage.local.get({ ignoredDomains: [] }, (data) => {
            resolve(Array.isArray(data.ignoredDomains) ? data.ignoredDomains : []);
        });
    });
}

function setIgnoredDomains(list) {
    return new Promise((resolve) => {
        chrome.storage.local.set({ ignoredDomains: list }, () => resolve());
    });
}

function setBadge(riskLevel) {
    const badge = document.getElementById("riskBadge");
    badge.classList.remove("safe", "critical");

    badge.textContent = riskLevel || "UNKNOWN";

    if (riskLevel === "SAFE") badge.classList.add("safe");
    if (riskLevel === "CRITICAL") badge.classList.add("critical");
}

function setReasons(reasons) {
    const ul = document.getElementById("reasonsList");
    ul.innerHTML = "";

    if (!reasons || reasons.length === 0) {
        const li = document.createElement("li");
        li.textContent = "No reasons (or not scanned yet).";
        ul.appendChild(li);
        return;
    }

    for (const r of reasons) {
        const li = document.createElement("li");
        li.textContent = r;
        ul.appendChild(li);
    }
}

async function refreshUI() {
    const tab = await getActiveTab();
    const siteKey = getSiteKeyFromUrl(tab?.url || "");
    document.getElementById("siteValue").textContent = siteKey || "-";

    const ignored = await getIgnoredDomains();
    const isIgnored = siteKey ? ignored.includes(siteKey) : false;
    document.getElementById("ignoredValue").textContent = isIgnored ? "YES" : "NO";

    const toggleBtn = document.getElementById("toggleIgnoreBtn");
    toggleBtn.textContent = isIgnored ? "Unignore site" : "Ignore site";
    toggleBtn.disabled = !siteKey || siteKey.length === 0;

    chrome.runtime.sendMessage(
        { type: MessagingUtils.MSG.GET_LAST_RESULT, tabId: tab?.id },
        (res) => {
            if (chrome.runtime.lastError) {
            // Popup likely closed or background not reachable
            console.log("GET_LAST_RESULT error:", chrome.runtime.lastError.message);
            setBadge("UNKNOWN");
            setReasons(["No result yet (or popup closed)."]);
            return;
            }

            setBadge(res?.riskLevel || "UNKNOWN");
            setReasons(res?.reasons || []);
        }
    );
}

document.getElementById("toggleIgnoreBtn").addEventListener("click", async () => {
    const tab = await getActiveTab();
    const siteKey = getSiteKeyFromUrl(tab?.url || "");
    if (!siteKey || !tab?.id) return;

    const ignored = await getIgnoredDomains();
    const idx = ignored.indexOf(siteKey);

    let nowIgnored = false;

    if (idx >= 0) {
        ignored.splice(idx, 1);
        nowIgnored = false;
    } else {
        ignored.push(siteKey);
        nowIgnored = true;
    }

    await setIgnoredDomains(ignored);

    chrome.tabs.sendMessage(
        tab.id,
        { type: MessagingUtils.MSG.IGNORE_DOMAIND_UPDATED, siteKey, ignored: nowIgnored },
        () => {
        if (chrome.runtime.lastError) {
            console.log("tabs.sendMessage failed:", chrome.runtime.lastError.message);
        }
        }
    );

    await refreshUI();
});


document.getElementById("refreshBtn").addEventListener("click", async () => {
    const tab = await getActiveTab();
    if (!tab?.id) return;

    chrome.tabs.sendMessage(tab.id, { type: MessagingUtils.MSG.RESCAN }, () => {
    if (chrome.runtime.lastError) {
        console.log("RESCAN sendMessage failed:", chrome.runtime.lastError.message);
    }
    refreshUI();
    });
});

refreshUI();
