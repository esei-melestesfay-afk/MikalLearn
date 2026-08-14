document.addEventListener("DOMContentLoaded", () => {
  const $ = id => document.getElementById(id);
  const parse = (value, fallback = null) => { try { return JSON.parse(value); } catch { return fallback; } };

  function keys() {
    const out = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key) out.push(key);
    }
    return out;
  }

  function scoreFrom(value) {
    if (typeof value === "number" && Number.isFinite(value)) return value;
    if (typeof value === "boolean") return value ? 999 : 0;
    if (!value || typeof value !== "object") return 0;

    const fields = ["streak","correct","count","mastery","progress","successes","wins","times","score"];
    let best = 0;
    for (const field of fields) {
      if (typeof value[field] === "number" && Number.isFinite(value[field])) best = Math.max(best, value[field]);
    }
    if (value.mastered === true || value.done === true || value.complete === true) best = Math.max(best, 999);
    return best;
  }

  function seenFrom(value) {
    if (typeof value === "number") return value > 0;
    if (!value || typeof value !== "object") return false;
    if (scoreFrom(value) > 0) return true;
    for (const field of ["seen","attempts","tries","shown","appearances"]) {
      if (typeof value[field] === "number" && value[field] > 0) return true;
    }
    return false;
  }

  function candidateFromObject(obj, threshold, depth = 0) {
    if (!obj || typeof obj !== "object" || depth > 4) return [];
    const candidates = [];

    if (!Array.isArray(obj)) {
      const entries = Object.entries(obj);
      const scored = entries.map(([word, value]) => ({word, score:scoreFrom(value), seen:seenFrom(value)}));
      const useful = scored.filter(x => x.score > 0 || x.seen);

      if (entries.length >= 10 && useful.length >= 1) {
        candidates.push({
          mastered: scored.filter(x => x.score >= threshold).length,
          trained: useful.length,
          size: entries.length,
          quality: useful.length + Math.min(entries.length, 500) / 1000
        });
      }
    }

    if (Array.isArray(obj)) {
      const primitiveWords = obj.filter(x => typeof x === "string");
      if (primitiveWords.length >= 10) {
        candidates.push({mastered: primitiveWords.length, trained: primitiveWords.length, size: primitiveWords.length, quality: primitiveWords.length});
      }
    }

    for (const value of Object.values(obj)) {
      if (value && typeof value === "object") candidates.push(...candidateFromObject(value, threshold, depth + 1));
    }
    return candidates;
  }

  function analyzeStorage(hints, threshold) {
    const all = [];

    for (const key of keys()) {
      const lower = key.toLowerCase();
      if (!hints.some(h => lower.includes(h))) continue;
      if (lower.includes("timer")) continue;

      const parsed = parse(localStorage.getItem(key));
      if (!parsed || typeof parsed !== "object") continue;

      for (const c of candidateFromObject(parsed, threshold)) {
        c.key = key;
        all.push(c);
      }
    }

    all.sort((a,b) => (b.quality - a.quality) || (Math.abs(500-a.size) - Math.abs(500-b.size)));
    return all[0] || {mastered:0, trained:0, size:0, key:""};
  }

  function metrics() {
    return parse(localStorage.getItem("mikal_metrics_v2"), {}) || {};
  }

  function totalSeconds(m) {
    return Object.values(m.secondsBySection || {}).reduce((sum, value) => sum + Number(value || 0), 0);
  }

  function formatTime(seconds) {
    const h = Math.floor(seconds / 3600);
    const min = Math.floor((seconds % 3600) / 60);
    return h > 0 ? `${h} h ${min} min` : `${min} min`;
  }

  function setBar(id, value, total) {
    const percent = total > 0 ? Math.min(100, Math.max(0, value / total * 100)) : 0;
    $(id).style.width = percent + "%";
  }

  function render() {
    const loop = analyzeStorage(["lasloop"], 10);
    const words = analyzeStorage(["listening_words","listening-words","important","viktiga"], 5);
    const m = metrics();

    $("lasloopValue").textContent = `${loop.mastered} / 500`;
    $("lasloopSub").textContent = loop.trained ? `${loop.trained} ord har tränats` : "Börja träna så syns framstegen här";
    setBar("lasloopBar", loop.mastered, 500);

    $("wordsValue").textContent = `${words.mastered} / 500`;
    $("wordsSub").textContent = words.trained ? `${words.trained} ord har tränats · 5/5 krävs` : "5/5 krävs för att ordet ska bli klart";
    setBar("wordsBar", words.mastered, 500);

    $("readingValue").textContent = Number(m.readingTexts || 0);
    $("listeningValue").textContent = Number(m.listeningCorrect || 0);
    $("writingValue").textContent = Number(m.writingPasses || 0);
    $("timeValue").textContent = formatTime(totalSeconds(m));
    $("daysValue").textContent = Object.keys(m.trainingDays || {}).length;

    const totalMastered = Math.min(500, loop.mastered) + Math.min(500, words.mastered);
    $("overallValue").textContent = `${totalMastered} / 1000`;
    setBar("overallBar", totalMastered, 1000);

    const sectionSeconds = m.secondsBySection || {};
    const entries = [
      ["LäsLoop", Number(sectionSeconds.lasloop || 0)],
      ["Viktiga ord", Number(sectionSeconds.lyssna || 0) + Number(sectionSeconds.ord || 0)],
      ["Läsa", Number(sectionSeconds.lasa || 0)],
      ["Skriva", Number(sectionSeconds.skriva || 0)]
    ].sort((a,b) => b[1] - a[1]);

    const favorite = entries[0] && entries[0][1] > 0 ? entries[0][0] : "Ingen ännu";
    $("mostTrainedValue").textContent = favorite;
  }

  render();
  window.addEventListener("mikal-progress-updated", render);
  window.addEventListener("storage", render);
  setInterval(render, 3000);
});
