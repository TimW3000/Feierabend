/* ============================================================
   MINI-ARCADE — schlanke Runtime für die Feierabend-Wartezeit.
   Angepasst aus TimW3000/Fakten-Website (Neon Arcade): gleiche
   Firebase-Leaderboard-Datenbank wie das Original (Scores landen
   in derselben globalen Rangliste), aber ohne externe Fonts und
   ohne localStorage. Firebase wird asynchron nachgeladen, damit
   ein blockiertes/langsames Netzwerk (z.B. Firmen-Firewall) die
   Spiele selbst nie verzögert oder blockiert — ohne Verbindung
   läuft alles einfach im Offline-Modus (nur lokaler Highscore).
   Jedes Spiel registriert sich über Arcade.registerGame({...}).
   ============================================================ */
(function () {
  "use strict";

  /* ---------- Firebase-Leaderboard (asynchron, mit Fallback) ---------- */
  const firebaseConfig = {
    apiKey: "AIzaSyDV_JiF7JuHUtrwXRuiNCLodJh_NamRwFQ",
    authDomain: "fakten-website.firebaseapp.com",
    databaseURL: "https://fakten-website-default-rtdb.europe-west1.firebasedatabase.app",
    projectId: "fakten-website",
    storageBucket: "fakten-website.firebasestorage.app",
    messagingSenderId: "489067963407"
  };

  let db = null;
  let firebaseEnabled = false;
  let leaderboardRef = null;
  let pendingLeaderboardGameId = null;

  function setDbStatus(text) {
    const elDb = document.getElementById("arcadeDbStatus");
    if (elDb) elDb.textContent = text;
  }

  function escapeHtml(str) {
    const d = document.createElement("div");
    d.textContent = str;
    return d.innerHTML;
  }

  function renderLeaderboard(entries) {
    const list = document.getElementById("arcadeLeaderboardList");
    if (!list) return;
    list.innerHTML = "";
    if (!entries.length) {
      list.innerHTML = '<li class="arcade-leaderboard-empty">Noch keine Einträge — sei der Erste.</li>';
      return;
    }
    entries.forEach(function (entry, i) {
      const li = document.createElement("li");
      li.innerHTML =
        '<span class="arcade-rank">' + (i + 1) + '.</span>' +
        '<span class="arcade-name">' + escapeHtml(entry.name || "???") + '</span>' +
        '<span class="arcade-points">' + entry.score + '</span>';
      list.appendChild(li);
    });
  }

  function watchLeaderboard(gameId) {
    pendingLeaderboardGameId = gameId;
    if (leaderboardRef) leaderboardRef.off();
    if (!firebaseEnabled) {
      setDbStatus("Offline-Modus — nur lokaler Highscore.");
      renderLeaderboard([]);
      return;
    }
    leaderboardRef = db.ref("leaderboard/" + gameId).orderByChild("score").limitToLast(10);
    leaderboardRef.on("value", function (snap) {
      const entries = [];
      snap.forEach(function (child) { entries.push(child.val()); });
      entries.sort(function (a, b) { return b.score - a.score; });
      renderLeaderboard(entries);
      setDbStatus("Verbunden — globale Bestenliste live.");
    }, function () {
      setDbStatus("Server nicht erreichbar — nur lokaler Highscore.");
      renderLeaderboard([]);
    });
  }

  function submitScore(gameId, name, score) {
    if (!firebaseEnabled) return;
    db.ref("leaderboard/" + gameId).push({ name: name, score: score, ts: Date.now() });
  }

  function initFirebase() {
    try {
      if (typeof firebase === "undefined") throw new Error("firebase global fehlt");
      firebase.initializeApp(firebaseConfig);
      db = firebase.database();
      firebaseEnabled = true;
      if (pendingLeaderboardGameId) watchLeaderboard(pendingLeaderboardGameId);
      else setDbStatus("Verbunden.");
    } catch (e) {
      firebaseEnabled = false;
      setDbStatus("Server nicht erreichbar — nur lokaler Highscore.");
    }
  }

  function loadFirebaseAsync() {
    setDbStatus("Verbinde mit Server…");
    const s1 = document.createElement("script");
    s1.src = "https://www.gstatic.com/firebasejs/10.13.0/firebase-app-compat.js";
    s1.async = true;
    s1.onload = function () {
      const s2 = document.createElement("script");
      s2.src = "https://www.gstatic.com/firebasejs/10.13.0/firebase-database-compat.js";
      s2.async = true;
      s2.onload = initFirebase;
      s2.onerror = function () { setDbStatus("Server nicht erreichbar — nur lokaler Highscore."); };
      document.head.appendChild(s2);
    };
    s1.onerror = function () { setDbStatus("Server nicht erreichbar — nur lokaler Highscore."); };
    document.head.appendChild(s1);
  }

  /* ---------- Theme (nur für diese Sitzung, kein Speichern) ---------- */
  const THEMES = {
    neon: {
      bgTop: "#0c0620", bgBottom: "#05030f",
      ground: "#00f6ff", groundDim: "#7c3aed",
      player: "#00f6ff", playerAccent: "#e8e6ff",
      hazardA: "#ff7a1a", hazardB: "#ff2bd6",
      collectible: "#fff500", powerupA: "#39ff88", powerupB: "#ff2bd6",
      particleLight: "#e8e6ff", ai: "#ff2bd6"
    },
    retro: {
      bgTop: "#5c94fc", bgBottom: "#a8d8ff",
      ground: "#8b5a2b", groundDim: "#5c3a1a",
      player: "#e53935", playerAccent: "#ffe0b2",
      hazardA: "#6d4c1c", hazardB: "#43a047",
      collectible: "#ffd700", powerupA: "#4caf50", powerupB: "#ff9800",
      particleLight: "#ffffff", ai: "#3a3a3a"
    }
  };
  let currentTheme = "neon";
  function theme() { return THEMES[currentTheme]; }
  function applyThemeAttr() {
    const root = document.getElementById("miniArcade");
    if (root) root.setAttribute("data-arcade-theme", currentTheme);
    const btn = document.getElementById("arcadeThemeToggle");
    if (btn) btn.textContent = currentTheme === "retro" ? "🕹️ Neon" : "🍄 Retro";
    const hubTitle = document.getElementById("arcadeHubTitle");
    if (hubTitle) hubTitle.textContent = currentTheme === "retro" ? "PIXEL QUEST" : "MINI ARCADE";
  }
  function toggleTheme() {
    currentTheme = currentTheme === "retro" ? "neon" : "retro";
    applyThemeAttr();
  }

  /* ---------- Audio ---------- */
  let audioCtx = null;

  function ensureAudio() {
    if (!audioCtx) {
      try { audioCtx = new (window.AudioContext || window.webkitAudioContext)(); }
      catch (e) { audioCtx = null; }
    } else if (audioCtx.state === "suspended") {
      audioCtx.resume();
    }
  }

  function beep(freqStart, freqEnd, duration, type, volume) {
    if (!audioCtx) return;
    const t0 = audioCtx.currentTime;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = type || "square";
    osc.frequency.setValueAtTime(freqStart, t0);
    osc.frequency.linearRampToValueAtTime(freqEnd, t0 + duration);
    gain.gain.setValueAtTime(volume || 0.14, t0);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + duration);
    osc.connect(gain).connect(audioCtx.destination);
    osc.start(t0);
    osc.stop(t0 + duration);
  }

  function noiseBurst(duration, volume) {
    if (!audioCtx) return;
    const bufferSize = Math.floor(audioCtx.sampleRate * duration);
    const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
    const src = audioCtx.createBufferSource();
    src.buffer = buffer;
    const gain = audioCtx.createGain();
    gain.gain.setValueAtTime(volume || 0.15, audioCtx.currentTime);
    src.connect(gain).connect(audioCtx.destination);
    src.start();
  }

  /* ---------- Helpers ---------- */
  function rectsOverlap(ax, ay, aw, ah, bx, by, bw, bh) {
    return ax < bx + bw && ax + aw > bx && ay < by + bh && ay + ah > by;
  }
  function circlesOverlap(ax, ay, ar, bx, by, br) {
    const dx = ax - bx, dy = ay - by, r = ar + br;
    return dx * dx + dy * dy < r * r;
  }
  function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }

  /* ---------- Core orchestrator ---------- */
  const canvas = document.getElementById("arcadeCanvas");
  const ctx = canvas.getContext("2d");

  const hubOverlay = document.getElementById("arcadeHub");
  const hubGrid = document.getElementById("arcadeHubGrid");
  const startOverlay = document.getElementById("arcadeStart");
  const gameOverOverlay = document.getElementById("arcadeGameOver");
  const pauseOverlay = document.getElementById("arcadePause");
  const gameWrap = document.getElementById("arcadeWrap");
  const hudRow = document.getElementById("arcadeHud");
  const activeGameLabel = document.getElementById("arcadeActiveLabel");
  const finalScoreEl = document.getElementById("arcadeFinalScore");
  const personalBestLine = document.getElementById("arcadePersonalBest");
  const startTitle = document.getElementById("arcadeStartTitle");
  const startDesc = document.getElementById("arcadeStartDesc");
  const startControls = document.getElementById("arcadeStartControls");
  const startBtn = document.getElementById("arcadeStartBtn");
  const restartBtn = document.getElementById("arcadeRestartBtn");
  const backToHubBtn = document.getElementById("arcadeBackToHubBtn");
  const gameOverBackBtn = document.getElementById("arcadeGameOverBackBtn");
  const resumeBtn = document.getElementById("arcadeResumeBtn");
  const themeToggleBtn = document.getElementById("arcadeThemeToggle");
  const highscoreForm = document.getElementById("arcadeHighscoreForm");
  const initialsInput = document.getElementById("arcadeInitials");
  const submitScoreBtn = document.getElementById("arcadeSubmitScoreBtn");

  const games = {};
  const gameOrder = [];
  const sessionBest = {}; // nur für diese Sitzung, kein Speichern über Reload hinaus
  let activeGame = null;
  let screen = "hub"; // hub | start | playing | paused | over
  let lastTs = 0;
  let currentScore = 0;

  function setHudFields(fields) {
    hudRow.innerHTML = "";
    fields.forEach(function (f) {
      const div = document.createElement("div");
      div.className = "arcade-hud-item";
      div.innerHTML = '<span class="arcade-hud-label">' + f.label + '</span><b id="arcadeHud_' + f.id + '">' + (f.value != null ? f.value : 0) + '</b>';
      hudRow.appendChild(div);
    });
  }

  function setHud(id, value) {
    const el = document.getElementById("arcadeHud_" + id);
    if (el) el.textContent = value;
  }

  function registerGame(def) {
    games[def.id] = def;
    gameOrder.push(def.id);
  }

  function buildHub() {
    hubGrid.innerHTML = "";
    gameOrder.forEach(function (id) {
      const g = games[id];
      const card = document.createElement("button");
      card.type = "button";
      card.className = "arcade-hub-card";
      card.style.setProperty("--arcade-accent", g.accent);
      card.innerHTML =
        '<span class="arcade-hub-card-name">' + g.name + '</span>' +
        '<span class="arcade-hub-card-tagline">' + g.tagline + '</span>';
      card.addEventListener("click", function () { openGame(id); });
      hubGrid.appendChild(card);
    });
  }

  function showOnly(el) {
    [hubOverlay, startOverlay, gameOverOverlay, pauseOverlay].forEach(function (o) {
      if (o === el) o.classList.remove("hidden"); else o.classList.add("hidden");
    });
  }

  function openGame(id) {
    activeGame = games[id];
    screen = "start";
    canvas.width = activeGame.canvasW;
    canvas.height = activeGame.canvasH;
    gameWrap.style.maxWidth = activeGame.canvasW + "px";
    activeGameLabel.textContent = activeGame.name;
    hudRow.classList.remove("hidden");
    setHudFields(activeGame.hud);
    setHud("best", sessionBest[id] || 0);
    startTitle.textContent = activeGame.name;
    startDesc.innerHTML = activeGame.description;
    startControls.textContent = activeGame.controlsHint;
    startBtn.textContent = activeGame.startLabel || "Starten";
    watchLeaderboard(id);
    if (activeGame.onLoad) activeGame.onLoad();
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    showOnly(startOverlay);
  }

  function backToHub() {
    activeGame = null;
    screen = "hub";
    hudRow.classList.add("hidden");
    activeGameLabel.textContent = "";
    showOnly(hubOverlay);
  }

  function loop(ts) {
    if (screen !== "playing" || !activeGame) return;
    if (!lastTs) lastTs = ts;
    let dt = (ts - lastTs) / 1000;
    dt = Math.min(dt, 0.05);
    lastTs = ts;
    activeGame.onUpdate(dt);
    if (screen === "playing") {
      activeGame.onDraw(ctx, canvas.width, canvas.height);
      requestAnimationFrame(loop);
    }
  }

  // Citrix/RDP-Fix: Über manche Remote-Desktop-Protokolle wird der erste
  // Canvas-Frame nach dem Ausblenden der Overlays nicht als "geänderter
  // Bereich" erkannt und bleibt schwarz, bis irgendeine echte DOM-Änderung
  // einen Repaint erzwingt -- genau das passiert zufällig beim "Neustarten"
  // (Overlay-Wechsel), aber nicht beim allerersten "Starten". Ein reiner
  // visibility-Toggle auf dem Canvas reicht dafür offenbar nicht; hier ein
  // deutlich härterer Ansatz:
  //  1) canvas.width/height nochmal exakt im Moment des Sichtbarwerdens
  //     neu setzen -> das leert & erzeugt die Bitmap komplett neu.
  //  2) der komplette Wrapper wird kurz per display:none aus dem Render-
  //     Baum entfernt und neu eingefügt (stärkeres Signal als visibility).
  //  3) ein kurzer, deutlich sichtbarer Vollflächen-Flash auf dem Canvas
  //     selbst erzeugt einen echten, unübersehbaren Pixel-Unterschied.
  function nudgeCanvasRepaint() {
    canvas.width = canvas.width;

    gameWrap.style.display = "none";
    void gameWrap.offsetHeight;
    gameWrap.style.display = "";

    ctx.save();
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.restore();

    requestAnimationFrame(function () {
      gameWrap.style.display = "none";
      void gameWrap.offsetHeight;
      gameWrap.style.display = "";
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      requestAnimationFrame(function () {
        gameWrap.style.display = "none";
        void gameWrap.offsetHeight;
        gameWrap.style.display = "";
      });
    });
  }

  function startRun() {
    ensureAudio();
    activeGame.onStart();
    screen = "playing";
    lastTs = 0;
    showOnly(null);
    nudgeCanvasRepaint();
    requestAnimationFrame(loop);
  }

  function endRun(score) {
    screen = "over";
    currentScore = Math.floor(score);
    activeGame.onDraw(ctx, canvas.width, canvas.height);
    finalScoreEl.textContent = currentScore;
    const id = activeGame.id;
    let best = sessionBest[id] || 0;
    if (currentScore > best) {
      best = currentScore;
      sessionBest[id] = best;
      personalBestLine.textContent = "Neuer Rekord für diese Runde! 🎉";
    } else {
      personalBestLine.textContent = "Bisheriger Rekord (diese Sitzung): " + best;
    }
    setHud("best", best);
    showOnly(gameOverOverlay);
    if (highscoreForm) highscoreForm.style.display = "flex";
    if (initialsInput) { initialsInput.value = ""; initialsInput.focus(); }
  }

  function pauseRun() {
    if (screen !== "playing") return;
    screen = "paused";
    showOnly(pauseOverlay);
  }

  function resumeRun() {
    if (screen !== "paused") return;
    screen = "playing";
    showOnly(null);
    lastTs = 0;
    nudgeCanvasRepaint();
    requestAnimationFrame(loop);
  }

  startBtn.addEventListener("click", startRun);
  restartBtn.addEventListener("click", startRun);
  backToHubBtn.addEventListener("click", backToHub);
  gameOverBackBtn.addEventListener("click", backToHub);
  resumeBtn.addEventListener("click", resumeRun);

  window.addEventListener("keydown", function (e) {
    if (screen === "hub" || screen === "start") return; // Tastatur nicht global blockieren, wenn kein Spiel aktiv ist
    if (e.key === "Escape") {
      if (screen === "playing") pauseRun();
      else if (screen === "paused") resumeRun();
      return;
    }
    if (screen === "playing" && activeGame && activeGame.onKeyDown) activeGame.onKeyDown(e);
  });
  window.addEventListener("keyup", function (e) {
    if (screen === "playing" && activeGame && activeGame.onKeyUp) activeGame.onKeyUp(e);
  });
  canvas.addEventListener("pointerdown", function (e) {
    if (screen === "playing" && activeGame && activeGame.onPointerDown) activeGame.onPointerDown(e);
  });
  window.addEventListener("pointerup", function (e) {
    if (activeGame && activeGame.onPointerUp) activeGame.onPointerUp(e);
  });
  canvas.addEventListener("pointermove", function (e) {
    if (screen === "playing" && activeGame && activeGame.onPointerMove) activeGame.onPointerMove(e);
  });
  document.addEventListener("visibilitychange", function () {
    if (document.hidden) pauseRun();
  });

  if (themeToggleBtn) themeToggleBtn.addEventListener("click", toggleTheme);

  function submitWithName(rawName) {
    const name = (rawName || "???").trim().toUpperCase().slice(0, 3) || "???";
    submitScore(activeGame.id, name, currentScore);
    if (highscoreForm) highscoreForm.style.display = "none";
  }

  if (submitScoreBtn) {
    submitScoreBtn.addEventListener("click", function () {
      submitWithName(initialsInput ? initialsInput.value : "");
    });
  }
  document.querySelectorAll(".arcade-quick-name-btn").forEach(function (btn) {
    btn.addEventListener("click", function () { submitWithName(btn.dataset.name); });
  });

  window.Arcade = {
    registerGame: registerGame,
    setHud: setHud,
    ensureAudio: ensureAudio,
    beep: beep,
    noiseBurst: noiseBurst,
    rectsOverlap: rectsOverlap,
    circlesOverlap: circlesOverlap,
    clamp: clamp,
    endRun: endRun,
    canvas: canvas,
    ctx: ctx,
    theme: theme,
    isRetro: function () { return currentTheme === "retro"; },
    ready: function () {
      applyThemeAttr();
      buildHub();
      showOnly(hubOverlay);
      loadFirebaseAsync();
    }
  };
})();
