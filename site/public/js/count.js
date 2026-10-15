// Cookieless visit counter. Sends only the page language and whether this is the first page
// in this browser tab session. No identifiers, no cookies, no fingerprinting.
(() => {
  const script = document.currentScript;
  const lang = script && script.dataset.lang;
  if (!lang || navigator.webdriver) return;
  if (navigator.doNotTrack === "1" || navigator.globalPrivacyControl === true) return;

  let firstInSession = false;
  try {
    if (!sessionStorage.getItem("zn-visit")) {
      sessionStorage.setItem("zn-visit", "1");
      firstInSession = true;
    }
  } catch {
    // Storage blocked: still count the view, never the visit.
  }

  const body = JSON.stringify({ l: lang, v: firstInSession ? 1 : 0 });
  const blob = new Blob([body], { type: "application/json" });
  if (!(navigator.sendBeacon && navigator.sendBeacon("/api/hit", blob))) {
    fetch("/api/hit", { method: "POST", body, headers: { "content-type": "application/json" }, keepalive: true }).catch(() => {});
  }
})();
