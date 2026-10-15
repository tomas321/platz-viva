// On the bare domain, send visitors to their browser's language if we have it.
(() => {
  const s = document.currentScript;
  if (!s || location.pathname !== "/") return;
  const available = (s.dataset.langs || "").split(",").filter(Boolean);
  const wanted = navigator.languages && navigator.languages.length ? navigator.languages : [navigator.language || ""];
  for (const tag of wanted) {
    const t = tag.toLowerCase();
    const hit = available.find((a) => a.toLowerCase() === t) || available.find((a) => a.split("-")[0].toLowerCase() === t.split("-")[0]);
    if (hit) return location.replace(`/${hit}/`);
  }
  if (s.dataset.default) location.replace(`/${s.dataset.default}/`);
})();
