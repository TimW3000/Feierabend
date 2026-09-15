(() => {
  "use strict";

  const STORAGE_KEY = "feierabend-rechner-state";

  const el = {
    startTime: document.getElementById("startTime"),
    workHours: document.getElementById("workHours"),
    breakMinutes: document.getElementById("breakMinutes"),
    setNow: document.getElementById("setNow"),
    workHoursChips: document.getElementById("workHoursChips"),
    breakChips: document.getElementById("breakChips"),
    countdown: document.getElementById("countdown"),
    countdownLabel: document.getElementById("countdownLabel"),
    progressFill: document.getElementById("progressFill"),
    feierabendTime: document.getElementById("feierabendTime"),
    quote: document.getElementById("quote"),
    liveClock: document.getElementById("liveClock"),
    themeToggle: document.getElementById("themeToggle"),
    soundToggle: document.getElementById("soundToggle"),
    scene: document.getElementById("scene"),
    sunMoon: document.getElementById("sunMoon"),
    overtimeBox: document.getElementById("overtimeBox"),
    overtimeValue: document.getElementById("overtimeValue"),
    starsCanvas: document.getElementById("stars-canvas"),
    confettiCanvas: document.getElementById("confetti-canvas"),
  };

  // ---------- State ----------
  function loadState() {
    const defaults = {
      startTime: toHHMM(new Date()),
      workHours: 8,
      breakMinutes: 30,
      theme: window.matchMedia?.("(prefers-color-scheme: dark)").matches ? "dark" : "light",
      soundOn: true,
    };
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return defaults;
      const parsed = JSON.parse(raw);
      return { ...defaults, ...parsed };
    } catch {
      return defaults;
    }
  }

  function saveState() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      /* ignore quota / privacy-mode errors */
    }
  }

  const state = loadState();
  let celebrated = false;

  // ---------- Helpers ----------
  function toHHMM(date) {
    return `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
  }

  function pad2(n) {
    return String(Math.floor(n)).padStart(2, "0");
  }

  function formatDuration(ms) {
    const totalSeconds = Math.max(0, Math.floor(ms / 1000));
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;
    return `${pad2(h)}:${pad2(m)}:${pad2(s)}`;
  }

  function getStartDate() {
    const [h, m] = state.startTime.split(":").map(Number);
    const d = new Date();
    d.setHours(h || 0, m || 0, 0, 0);
    return d;
  }

  function getFeierabendDate() {
    const start = getStartDate();
    const totalMinutes = state.workHours * 60 + Number(state.breakMinutes);
    return new Date(start.getTime() + totalMinutes * 60000);
  }

  function lerp(a, b, t) {
    return a + (b - a) * t;
  }

  function hexToRgb(hex) {
    const v = hex.replace("#", "");
    return [parseInt(v.slice(0, 2), 16), parseInt(v.slice(2, 4), 16), parseInt(v.slice(4, 6), 16)];
  }

  function lerpColor(hexA, hexB, t) {
    const a = hexToRgb(hexA);
    const b = hexToRgb(hexB);
    const r = Math.round(lerp(a[0], b[0], t));
    const g = Math.round(lerp(a[1], b[1], t));
    const bl = Math.round(lerp(a[2], b[2], t));
    return `rgb(${r}, ${g}, ${bl})`;
  }

  const SKY_STOPS = [
    { p: 0.0, c1: "#8ec5fc", c2: "#e0c3fc" },
    { p: 0.25, c1: "#56ccf2", c2: "#2f80ed" },
    { p: 0.6, c1: "#f6d365", c2: "#fda085" },
    { p: 0.85, c1: "#ff512f", c2: "#dd2476" },
    { p: 1.0, c1: "#3a1c71", c2: "#1a1030" },
  ];

  function skyColors(progress) {
    const p = Math.min(1, Math.max(0, progress));
    for (let i = 0; i < SKY_STOPS.length - 1; i++) {
      const cur = SKY_STOPS[i];
      const next = SKY_STOPS[i + 1];
      if (p >= cur.p && p <= next.p) {
        const t = (p - cur.p) / (next.p - cur.p || 1);
        return [lerpColor(cur.c1, next.c1, t), lerpColor(cur.c2, next.c2, t)];
      }
    }
    const last = SKY_STOPS[SKY_STOPS.length - 1];
    return [last.c1, last.c2];
  }

  // ---------- Quotes ----------
  const QUOTES = {
    early: [
      "Der Tag hat gerade erst begonnen. Kaffee bereit? ☕",
      "Ruhig bleiben, das wird schon. Noch ein langer Weg. 🌅",
      "Erstmal ankommen – der Rest kommt von allein. 🐢",
    ],
    mid: [
      "Halbzeit-Gefühl. Weiter geht's. 🚶",
      "Ein Fuß vor den anderen – Feierabend rückt näher. 🕰️",
      "Zeit für eine kurze Tagtraum-Pause vom Sofa. 🛋️",
      "Noch ein bisschen durchhalten, du schaffst das. 💪",
    ],
    late: [
      "Es riecht schon nach Feierabend! 👃",
      "Fast geschafft – nicht nachlassen. 🚀",
      "Der Endspurt hat begonnen. 🏁",
      "Laptop zu, Leben an – bald ist es so weit. 💻➡️🎉",
    ],
    almost: [
      "Gleich ist Schluss – halt durch! 🔥",
      "Countdown läuft, die letzten Minuten zählen. ⏳",
      "So nah dran – nicht mehr abschweifen! 👀",
    ],
    done: [
      "Feierabend! Zeit, den Laptop zuzuklappen. 🎉",
      "Geschafft! Auf geht's ins Wochenende oder aufs Sofa. 🛋️",
      "Well done. Jetzt heißt es: abschalten. 🌙",
      "Offiziell im Feierabend-Modus. Genieß es! 🍻",
    ],
  };

  let lastQuoteBucket = "";
  let lastQuoteText = "";

  function pickQuote(bucket) {
    const list = QUOTES[bucket];
    let choice = list[Math.floor(Math.random() * list.length)];
    if (choice === lastQuoteText && list.length > 1) {
      choice = list[(list.indexOf(choice) + 1) % list.length];
    }
    lastQuoteText = choice;
    return choice;
  }

  function updateQuote(progress, force = false) {
    let bucket;
    if (progress >= 1) bucket = "done";
    else if (progress >= 0.9) bucket = "almost";
    else if (progress >= 0.7) bucket = "late";
    else if (progress >= 0.25) bucket = "mid";
    else bucket = "early";

    if (bucket !== lastQuoteBucket || force) {
      lastQuoteBucket = bucket;
      setQuoteText(pickQuote(bucket));
    }
  }

  function setQuoteText(text) {
    el.quote.classList.add("fade");
    setTimeout(() => {
      el.quote.textContent = text;
      el.quote.classList.remove("fade");
    }, 200);
  }

  setInterval(() => {
    if (lastQuoteBucket) setQuoteText(pickQuote(lastQuoteBucket));
  }, 25000);

  // ---------- Sun / sky scene ----------
  function updateScene(progress) {
    const clamped = Math.min(1, Math.max(0, progress));
    const [c1, c2] = skyColors(progress);
    el.scene.style.background = `linear-gradient(180deg, ${c1}, ${c2})`;

    const isNight = progress >= 1;
    el.scene.classList.toggle("is-night", isNight);

    const cx = 160, cy = 128, r = 110;
    const angle = Math.PI * (1 - clamped);
    const x = cx + r * Math.cos(angle);
    const y = cy - r * Math.sin(angle);
    el.sunMoon.setAttribute("x", x.toFixed(1));
    el.sunMoon.setAttribute("y", y.toFixed(1));
    el.sunMoon.textContent = isNight ? "🌙" : "☀️";
  }

  // ---------- Stars ----------
  let starPositions = [];
  function initStars() {
    const canvas = el.starsCanvas;
    const rect = el.scene.getBoundingClientRect();
    canvas.width = rect.width * devicePixelRatio;
    canvas.height = rect.height * devicePixelRatio;
    starPositions = Array.from({ length: 40 }, () => ({
      x: Math.random(),
      y: Math.random() * 0.65,
      r: Math.random() * 1.4 + 0.4,
      phase: Math.random() * Math.PI * 2,
    }));
  }

  function drawStars(t) {
    const canvas = el.starsCanvas;
    if (!canvas.width) return;
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (!el.scene.classList.contains("is-night")) return;
    ctx.fillStyle = "#ffffff";
    for (const star of starPositions) {
      const twinkle = 0.5 + 0.5 * Math.sin(t / 900 + star.phase);
      ctx.globalAlpha = 0.25 + twinkle * 0.6;
      ctx.beginPath();
      ctx.arc(star.x * canvas.width, star.y * canvas.height, star.r * devicePixelRatio, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  // ---------- Confetti ----------
  const confettiCtx = el.confettiCanvas.getContext("2d");
  let confettiParticles = [];
  function resizeConfettiCanvas() {
    el.confettiCanvas.width = window.innerWidth * devicePixelRatio;
    el.confettiCanvas.height = window.innerHeight * devicePixelRatio;
  }

  function spawnConfetti(count = 140, originX = 0.5, originY = 0.35) {
    const colors = ["#6a5cff", "#ff7a59", "#ffd166", "#06d6a0", "#ef476f"];
    for (let i = 0; i < count; i++) {
      confettiParticles.push({
        x: originX * el.confettiCanvas.width,
        y: originY * el.confettiCanvas.height,
        vx: (Math.random() - 0.5) * 8 * devicePixelRatio,
        vy: (Math.random() * -6 - 2) * devicePixelRatio,
        size: (Math.random() * 6 + 4) * devicePixelRatio,
        color: colors[Math.floor(Math.random() * colors.length)],
        rotation: Math.random() * Math.PI,
        rotSpeed: (Math.random() - 0.5) * 0.2,
        life: 0,
        maxLife: 140 + Math.random() * 60,
      });
    }
  }

  function drawConfetti() {
    confettiCtx.clearRect(0, 0, el.confettiCanvas.width, el.confettiCanvas.height);
    const gravity = 0.15 * devicePixelRatio;
    confettiParticles = confettiParticles.filter((p) => p.life < p.maxLife);
    for (const p of confettiParticles) {
      p.vy += gravity;
      p.x += p.vx;
      p.y += p.vy;
      p.rotation += p.rotSpeed;
      p.life++;
      const alpha = 1 - p.life / p.maxLife;
      confettiCtx.save();
      confettiCtx.globalAlpha = Math.max(0, alpha);
      confettiCtx.translate(p.x, p.y);
      confettiCtx.rotate(p.rotation);
      confettiCtx.fillStyle = p.color;
      confettiCtx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6);
      confettiCtx.restore();
    }
  }

  function confettiLoop(t) {
    drawStars(t);
    if (confettiParticles.length) drawConfetti();
    requestAnimationFrame(confettiLoop);
  }
  requestAnimationFrame(confettiLoop);

  el.sunMoon.addEventListener("click", () => {
    const rect = el.sunMoon.getBoundingClientRect();
    spawnConfetti(40, rect.left / window.innerWidth + 0.02, rect.top / window.innerHeight);
  });

  // ---------- Sound ----------
  let audioCtx = null;
  function playChime() {
    if (!state.soundOn) return;
    try {
      audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)();
      const now = audioCtx.currentTime;
      [523.25, 659.25, 783.99].forEach((freq, i) => {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = "sine";
        osc.frequency.value = freq;
        gain.gain.setValueAtTime(0, now + i * 0.15);
        gain.gain.linearRampToValueAtTime(0.18, now + i * 0.15 + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.15 + 0.5);
        osc.connect(gain).connect(audioCtx.destination);
        osc.start(now + i * 0.15);
        osc.stop(now + i * 0.15 + 0.55);
      });
    } catch {
      /* audio not available */
    }
  }

  // ---------- Tick ----------
  function tick() {
    const now = new Date();
    el.liveClock.textContent = now.toLocaleTimeString("de-DE");

    const start = getStartDate();
    const feierabend = getFeierabendDate();
    const totalMs = feierabend.getTime() - start.getTime();
    const elapsedMs = now.getTime() - start.getTime();
    const remainingMs = feierabend.getTime() - now.getTime();
    const progress = totalMs > 0 ? elapsedMs / totalMs : (remainingMs <= 0 ? 1 : 0);

    el.feierabendTime.textContent = `Feierabend um ${toHHMM(feierabend)} Uhr`;
    el.progressFill.style.width = `${Math.min(100, Math.max(0, progress * 100))}%`;

    if (remainingMs > 0) {
      el.countdown.textContent = formatDuration(remainingMs);
      el.countdownLabel.textContent = "bis Feierabend";
      el.overtimeBox.hidden = true;
      document.title = `⏳ ${formatDuration(remainingMs)} bis Feierabend`;
    } else {
      const overtimeMs = Math.abs(remainingMs);
      el.countdown.textContent = formatDuration(overtimeMs);
      el.countdownLabel.textContent = "Überstunden";
      el.overtimeBox.hidden = false;
      el.overtimeValue.textContent = formatDuration(overtimeMs);
      document.title = `🌙 +${formatDuration(overtimeMs)} Überstunden`;

      if (!celebrated) {
        celebrated = true;
        spawnConfetti(180);
        playChime();
      }
    }

    updateScene(progress);
    updateQuote(progress);
  }

  // ---------- Wiring inputs ----------
  function syncChipStates() {
    [...el.workHoursChips.children].forEach((btn) => {
      btn.classList.toggle("active", Number(btn.dataset.hours) === Number(state.workHours));
    });
    [...el.breakChips.children].forEach((btn) => {
      btn.classList.toggle("active", Number(btn.dataset.break) === Number(state.breakMinutes));
    });
  }

  function applyStateToInputs() {
    el.startTime.value = state.startTime;
    el.workHours.value = state.workHours;
    el.breakMinutes.value = state.breakMinutes;
    syncChipStates();
  }

  function applyTheme() {
    document.documentElement.dataset.theme = state.theme;
    el.themeToggle.textContent = state.theme === "dark" ? "☀️" : "🌙";
  }

  function applySound() {
    el.soundToggle.textContent = state.soundOn ? "🔊" : "🔇";
  }

  el.startTime.addEventListener("change", () => {
    if (!el.startTime.value) return;
    state.startTime = el.startTime.value;
    celebrated = false;
    saveState();
    tick();
  });

  el.workHours.addEventListener("input", () => {
    const v = parseFloat(el.workHours.value);
    if (Number.isNaN(v)) return;
    state.workHours = v;
    celebrated = false;
    syncChipStates();
    saveState();
    tick();
  });

  el.breakMinutes.addEventListener("input", () => {
    const v = parseFloat(el.breakMinutes.value);
    if (Number.isNaN(v)) return;
    state.breakMinutes = v;
    celebrated = false;
    syncChipStates();
    saveState();
    tick();
  });

  el.setNow.addEventListener("click", () => {
    state.startTime = toHHMM(new Date());
    celebrated = false;
    applyStateToInputs();
    saveState();
    tick();
  });

  el.workHoursChips.addEventListener("click", (e) => {
    const btn = e.target.closest("button[data-hours]");
    if (!btn) return;
    state.workHours = Number(btn.dataset.hours);
    celebrated = false;
    applyStateToInputs();
    saveState();
    tick();
  });

  el.breakChips.addEventListener("click", (e) => {
    const btn = e.target.closest("button[data-break]");
    if (!btn) return;
    state.breakMinutes = Number(btn.dataset.break);
    celebrated = false;
    applyStateToInputs();
    saveState();
    tick();
  });

  el.themeToggle.addEventListener("click", () => {
    state.theme = state.theme === "dark" ? "light" : "dark";
    applyTheme();
    saveState();
  });

  el.soundToggle.addEventListener("click", () => {
    state.soundOn = !state.soundOn;
    applySound();
    saveState();
    if (state.soundOn) playChime();
  });

  window.addEventListener("resize", () => {
    resizeConfettiCanvas();
    initStars();
  });

  // ---------- Init ----------
  applyTheme();
  applySound();
  applyStateToInputs();
  resizeConfettiCanvas();
  initStars();
  tick();
  setInterval(tick, 1000);
})();
