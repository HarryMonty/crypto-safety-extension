(function () {
  const ext = (typeof browser !== "undefined") ? browser : chrome;
  globalThis.ext = ext;
})();