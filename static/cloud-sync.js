(() => {
  "use strict";

  const METRICS_KEY = "mikal_metrics_v2";
  let lastActivity = Date.now();

  function parse(value, fallback) {
    try { return JSON.parse(value); } catch { return fallback; }
  }

  function getMetrics() {
    const value = parse(localStorage.getItem(METRICS_KEY), {});
    return value && typeof value === "object" && !Array.isArray(value) ? value : {};
  }

  function saveMetrics(value) {
    localStorage.setItem(METRICS_KEY, JSON.stringify(value));
    window.dispatchEvent(new CustomEvent("mikal-progress-updated"));
  }

  function todayKey() {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
  }

  function markDay(metrics) {
    metrics.trainingDays = metrics.trainingDays || {};
    metrics.trainingDays[todayKey()] = true;
  }

  function bump(name, amount = 1) {
    const metrics = getMetrics();
    metrics[name] = Number(metrics[name] || 0) + amount;
    markDay(metrics);
    saveMetrics(metrics);
  }

  function addSeconds(section, seconds) {
    const metrics = getMetrics();
    metrics.secondsBySection = metrics.secondsBySection || {};
    metrics.secondsBySection[section] = Number(metrics.secondsBySection[section] || 0) + seconds;
    markDay(metrics);
    saveMetrics(metrics);
  }

  function sectionFromPath() {
    const p = location.pathname;
    if (p === "/skriva") return "skriva";
    if (p === "/lasa") return "lasa";
    if (p === "/lyssna") return "lyssna";
    if (p === "/lasloop") return "lasloop";
    if (p === "/ord") return "ord";
    return null;
  }

  function simpleHash(text) {
    let h = 2166136261;
    for (let i = 0; i < text.length; i++) {
      h ^= text.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return String(h >>> 0);
  }

  function pageExerciseSignature() {
    const main = document.querySelector("main, .container, .shell") || document.body;
    const text = (main.innerText || "").replace(/\s+/g, " ").trim().slice(0, 1800);
    return simpleHash(location.pathname + "|" + text);
  }

  function countOnce(metric, bucketName) {
    const metrics = getMetrics();
    metrics.completedSignatures = metrics.completedSignatures || {};
    metrics.completedSignatures[bucketName] = metrics.completedSignatures[bucketName] || {};

    const sig = pageExerciseSignature();
    if (metrics.completedSignatures[bucketName][sig]) return;

    metrics.completedSignatures[bucketName][sig] = Date.now();
    metrics[metric] = Number(metrics[metric] || 0) + 1;
    markDay(metrics);

    const entries = Object.entries(metrics.completedSignatures[bucketName]);
    if (entries.length > 300) {
      entries.sort((a,b) => b[1] - a[1]);
      metrics.completedSignatures[bucketName] = Object.fromEntries(entries.slice(0, 300));
    }

    saveMetrics(metrics);
  }

  function injectProfileActions() {
    if (location.pathname !== "/" || document.getElementById("mikalProfileActions")) return;

    const style = document.createElement("style");
    style.textContent = `
      #mikalProfileActions{display:flex;gap:7px;align-items:center;flex-wrap:wrap;margin-left:auto}
      #mikalProfileActions a{display:inline-flex;align-items:center;min-height:34px;padding:0 10px;border:1px solid #e6e7ef;border-radius:10px;background:#fff;color:#333747;text-decoration:none;font-size:9px;font-weight:900}
      #mikalProfileActions a:first-child{background:#efefff;color:#5456dc;border-color:#e0e1ff}
    `;
    document.head.appendChild(style);

    const el = document.createElement("div");
    el.id = "mikalProfileActions";
    el.innerHTML = `<a href="/utveckling">📊 Min utveckling</a><a href="/logout">Mikal · Logga ut</a>`;

    const top = document.querySelector(".top, header, nav");
    if (top) top.appendChild(el); else document.body.prepend(el);
  }

  document.addEventListener("click", (event) => {
    const el = event.target.closest("button, a");
    if (!el) return;

    const text = (el.textContent || "").trim().toLowerCase();

    if (location.pathname === "/lasa" && text.includes("ny text")) {
      countOnce("readingTexts", "reading");
    }

    if (location.pathname === "/skriva" && text.includes("ny text")) {
      countOnce("writingPasses", "writing");
    }
  }, true);

  let lastCorrectSignature = "";
  let lastCorrectAt = 0;

  const observer = new MutationObserver(() => {
    if (location.pathname !== "/lyssna") return;

    const bodyText = (document.body.innerText || "").toLowerCase();
    if (!bodyText.includes("rätt")) return;

    const sig = pageExerciseSignature();
    const now = Date.now();
    if (sig === lastCorrectSignature && now - lastCorrectAt < 2500) return;

    const likelyCorrect = Array.from(document.querySelectorAll("body *")).some(node => {
      const t = (node.textContent || "").trim();
      return /^(✅\s*)?rätt!?$/i.test(t);
    });

    if (likelyCorrect) {
      lastCorrectSignature = sig;
      lastCorrectAt = now;
      bump("listeningCorrect", 1);
    }
  });

  ["click","keydown","touchstart","pointerdown"].forEach(name => {
    window.addEventListener(name, () => { lastActivity = Date.now(); }, {passive:true});
  });

  setInterval(() => {
    const section = sectionFromPath();
    if (!section || document.hidden || Date.now() - lastActivity > 120000) return;
    addSeconds(section, 10);
  }, 10000);

  document.addEventListener("DOMContentLoaded", () => {
    injectProfileActions();
    observer.observe(document.body, {childList:true, subtree:true, characterData:true});
  });

  window.MikalProgress = { getMetrics, bump, addSeconds };
})();
