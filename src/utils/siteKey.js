// utils/siteKey.js
(function () {
  function getSiteKeyFromUrl(url) {
    try {
      const u = new URL(url);
      if (u.protocol === "file:") return `file://${u.pathname}`;
      return u.hostname;
    } catch {
      return null;
    }
  }

  // expose globally to content/popup/options
  globalThis.getSiteKeyFromUrl = getSiteKeyFromUrl;
})();
