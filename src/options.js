function getSettings() {
    return new Promise((resolve) => {
        chrome.storage.local.get(
            {
                ignoredDomains: [],
                showCaution: true,
                showWarning: true,
            },
            resolve
        );
    });
}

function saveSettings(data) {
    return new Promise((resolve) => {
        chrome.storage.local.set(data, resolve);
    });
}

async function renderIgnoredDomains() {
    const { ignoredDomains } = await getSettings();
    const list = document.getElementById("ignoredList");
    const empty = document.getElementById("emptyState");

    list.innerHTML = "";

    if (!ignoredDomains.length) {
        empty.style.display = "block";
        return;
    }

    empty.style.display = "none";

    for (const domain of ignoredDomains) {
        const li = document.createElement("li");
        li.textContent = domain;

        const btn = document.createElement("button");
        btn.textContent = "Remove";
        btn.onclick = async () => {
            const updated = ignoredDomains.filter(d => d !== domain);
            await saveSettings({ ignoredDomains: updated });
            renderIgnoredDomains();
        };

        li.appendChild(btn);
        list.appendChild(li);
    }
}

async function init() {
    const settings = await getSettings();

    document.getElementById("showCaution").checked = settings.showCaution;
    document.getElementById("showWarning").checked = settings.showWarning;

    document.getElementById("showCaution").onchange = async (e) =>
        saveSettings({ showCaution: e.target.checked });

    document.getElementById("showWarning").onchange = async (e) =>
        saveSettings({ showWarning: e.target.checked });

    renderIgnoredDomains();
}

init();

chrome.storage.onChanged.addListener((changes, area) => {
    if (area !== "local") return;
    if (changes.ignoredDomains) {
        renderIgnoredDomains();
    }
});