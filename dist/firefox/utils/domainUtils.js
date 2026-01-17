(function () {
    // Normalise host name
    function normalizeHostname(hostname){
        if (!hostname) return "";
        return hostname.toLowerCase().replace(/^www\./, '');
    }

    // Parse URL string and return the hostname
    function getHostnameFromUrl(url) {
        try {
            return normalizeHostname(new URL(url).hostname);
        } catch {
            return "";
        }
    }

    // IPv4 detection
    function isIpHostname(hostname) {
        const h = normalizeHostname(hostname);
        return /^\d{1,3}(\.\d{1,3}){3}$/.test(h);
    }

    // Get base domain
    function getBaseDomain(hostname) {
        const h = normalizeHostname(hostname);
        if (!h) return "";
        if (isIpHostname(h)) return h;

        const parts = h.split('.').filter(Boolean);
        if (parts.length <= 2) return h;
        return parts.slice(-2).join('.');
    }

    // Expose to global for scripts
    globalThis.DomainUtils = {
        normalizeHostname,
        getHostnameFromUrl,
        isIpHostname,
        getBaseDomain,
    };
})();