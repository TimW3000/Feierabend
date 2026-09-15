(() => {
  "use strict";

  const el = {
    startTime: document.getElementById("startTime"),
    workHours: document.getElementById("workHours"),
    breakMinutes: document.getElementById("breakMinutes"),
    setNow: document.getElementById("setNow"),
    nudgeRow: document.getElementById("nudgeRow"),
    workHoursChips: document.getElementById("workHoursChips"),
    breakChips: document.getElementById("breakChips"),
    countdown: document.getElementById("countdown"),
    countdownLabel: document.getElementById("countdownLabel"),
    progressFill: document.getElementById("progressFill"),
    progressRunner: document.getElementById("progressRunner"),
    progressDoor: document.getElementById("progressDoor"),
    coffeeStat: document.getElementById("coffeeStat"),
    funFact: document.getElementById("funFact"),
    feierabendTime: document.getElementById("feierabendTime"),
    quote: document.getElementById("quote"),
    liveClock: document.getElementById("liveClock"),
    themeToggle: document.getElementById("themeToggle"),
    soundToggle: document.getElementById("soundToggle"),
    shareBtn: document.getElementById("shareBtn"),
    chaosBtn: document.getElementById("chaosBtn"),
    pipDock: document.getElementById("pipDock"),
    pipBody: document.getElementById("pipBody"),
    pipCanvas: document.getElementById("pipCanvas"),
    pipLabel: document.getElementById("pipLabel"),
    pipShuffle: document.getElementById("pipShuffle"),
    pipPause: document.getElementById("pipPause"),
    scene: document.getElementById("scene"),
    sunMoon: document.getElementById("sunMoon"),
    overtimeBox: document.getElementById("overtimeBox"),
    overtimeValue: document.getElementById("overtimeValue"),
    starsCanvas: document.getElementById("stars-canvas"),
    confettiCanvas: document.getElementById("confetti-canvas"),
    toast: document.getElementById("toast"),
  };

  // ---------- State ----------
  // Bewusst KEIN localStorage: die Seite wird von mehreren Kolleg*innen
  // auf verschiedenen Geräten genutzt und soll bei jedem Aufruf komplett
  // frisch starten. Einzige Ausnahme: wer explizit auf "Link teilen"
  // klickt, bekommt einen Link mit den eigenen Werten in der URL.
  function readParams() {
    const params = new URLSearchParams(window.location.search);
    const s = params.get("s");
    const h = parseFloat(params.get("h"));
    const b = parseFloat(params.get("b"));
    return {
      startTime: /^\d{2}:\d{2}$/.test(s || "") ? s : toHHMM(new Date()),
      workHours: Number.isFinite(h) ? h : 7.8,
      breakMinutes: Number.isFinite(b) ? b : 30,
    };
  }

  const state = {
    ...readParams(),
    theme: window.matchMedia?.("(prefers-color-scheme: dark)").matches ? "dark" : "light",
    soundOn: true,
  };
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
      "Montag-Energie, auch wenn heute vielleicht gar kein Montag ist. 🫠",
      "Dein Gehirn lädt noch. Bitte etwas Geduld. 🔄",
      "Rizz-Level: niedrig. Kaffee-Level: wird erhöht. ☕📈",
      "Die Arbeit ruft. Du ignorierst sie noch kurz. 🙈",
      "Ganz ruhig, wir sind noch im Vorspann. 🎬",
      "Motivation: geladen. Akku: 12%. 🔋",
      "Du schaffst das. Oder auch nicht. Aber du schaffst das. 💅",
      "Kein Stress, der Tag ist ein Marathon, kein Sprint. Außer zur Kaffeemaschine. 🏃☕",
      "Buchstäblich gerade erst angekommen und schon Feierabend-Gedanken? Same. 🫡",
      "Fun Fact: du hast heute noch alles vor dir. Auch die Fehler. 😅",
      "Innerer Monolog: 'Ich schaff das easy.' Auch innerer Monolog: 'Wann ist Mittag?' 🍽️",
      "Skibidi-Start ins Büro-Universum. 🚽👑",
      "Deine To-Do-Liste guckt dich schon komisch an. 👀",
      "Noch ist alles möglich. Auch ein produktiver Tag. Theoretisch. 📈",
      "Die Sonne ist wach. Du bist... so semi. ☀️😴",
      "Early Game: sammle XP, vermeide Meeting-Bosse. 🎮",
      "Dein Kaffee ist heißer als deine Motivation gerade. ☕🔥",
      "Der Grind hat begonnen. Möge er gnädig sein. 🙏",
      "Noch total main character, gleich schon NPC im Meeting. 🎭",
      "Deine Willenskraft ist noch ungeöffnet wie eine neue Chipstüte. 🥔",
      "Board Meeting mit dir selbst: Tagesordnungspunkt 1 – aufwachen. ☕",
      "Dein Kaffee kühlt schneller ab als deine Motivation steigt. ☕📉",
      "Noch ist der Tag ein leeres Google Doc. Frisch, unschuldig, voller Potenzial. 📄",
      "Dein Hirn: 'Lass uns produktiv sein.' Auch dein Hirn: 'Lass uns nicht.' 🧠⚖️",
      "Frühform: 20% wach, 80% Kaffee-Vorfreude. ☕🔋",
      "Dein erster Blick auf die To-Do-Liste war schon ein kleines Trauma. 😳",
      "Der Arbeitstag lädt... bitte etwas Geduld, Buffering. 🔄",
      "Noch riecht alles nach frisch gedrucktem Optimismus. 🖨️✨",
      "Deine Tastatur ist wärmer als dein Ehrgeiz gerade. ⌨️🔥",
      "POV: Du tust so, als hättest du einen Plan für heute. 🎭",
      "Inbox Zero ist ein Mythos. Wie Einhörner. Oder Motivation vor 9 Uhr. 🦄",
      "Dein Stuhl heißt dich willkommen zurück in die Realität. 🪑👋",
      "Der Tag hat 1000 Möglichkeiten. Du hast 1 Kaffee. Balance it. ☕⚖️",
      "Noch fühlst du dich wie ein NPC, der auf seinen Questgeber wartet. 🎮",
      "Dein Optimismus-Akku ist voll. Realität lädt in 3... 2... 1... 🔋💥",
      "Erste E-Mail geöffnet. Reue bereits spürbar. 📧😩",
      "Der Tag ist wie ein leeres Excel-Tab: unendlich Möglichkeiten, null Motivation. 📊",
      "Frisch reingekommen und schon am Fenster nach Feierabend Ausschau halten. 🪟👀",
      "Dein Gehirn braucht noch ein Software-Update. Bitte warten. ⏳💻",
      "Ein neuer Tag, dieselben Ausreden. Klassiker halt. 🔁",
      "Kaffee Nummer eins: Formsache. Kaffee Nummer zwei: Notwendigkeit. ☕☕",
    ],
    mid: [
      "Halbzeit-Gefühl. Weiter geht's. 🚶",
      "Ein Fuß vor den anderen – Feierabend rückt näher. 🕰️",
      "Zeit für eine kurze Tagtraum-Pause vom Sofa. 🛋️",
      "Noch ein bisschen durchhalten, du schaffst das. 💪",
      "Konzentration: 60%. Gedanken ans Mittagessen: 100%. 🍜",
      "Mid-Tag-Krise: kurz, aber intensiv. 🎢",
      "Du bist offiziell in der 'Wann-ist-das-hier-vorbei'-Zone. ⏳",
      "Dein Stuhl kennt dich mittlerweile beim Vornamen. 🪑",
      "Guck einfach hoch, du weißt schon warum. 👆",
      "Brain.exe hat aufgehört zu reagieren. Neustart empfohlen. 💻",
      "Halbzeitpfiff! Wechsel: mehr Kaffee rein. ☕🔄",
      "Deine Motivation macht gerade Kaffeepause. Ohne dich. ☕🚶",
      "Slay trotzdem weiter, auch wenn's grad zäh ist. 💅",
      "POV: Du checkst zum 5. Mal die Uhr in dieser Stunde. 🕐",
      "Der Tag ist wie eine Achterbahn. Gerade sind wir oben. Vielleicht. 🎢",
      "Fun Fact: Prokrastination ist auch eine Form von Zeitmanagement. Behaupte ich einfach mal. 📊",
      "Dein Energielevel: Emoji-Batterie bei 40%. 🔋",
      "Weiter im Text, der Nachmittag wartet nicht auf sich selbst. 📖",
      "Mid-Day-Ick: noch so viele E-Mails, so wenig Bock. 📧",
      "Du bist quasi ein Halbzeit-Held. Applaus für dich. 👏",
      "Zeit vergeht schneller, wenn man nicht auf die Uhr starrt. Starr trotzdem. 👁️",
      "Kleine Pause, große Wirkung. Vielleicht. 🧘",
      "Brainrot-Level steigt exponentiell mit jeder Stunde im Büro. 📈🧠",
      "Halb geschafft, halb am Verzweifeln, ganz normal. 🙃",
      "Fokus wie ein Goldfisch mit ADHS. 🐠",
      "Dein Gehirn hat gerade einen Tab zu viel offen. 🗂️",
      "Zwischen 'noch produktiv' und 'schon am Abdriften' liegt genau diese Minute. ⏱️",
      "Deine Snackpause hat eine eigene Pause verdient. 🍫",
      "Mid-Day-Brainfog: dichter als der Nebel draußen. 🌫️",
      "Motivation im Standby-Modus. Reaktivierung unklar. 🔌",
      "Dein drittes Wasserglas heute. Hydration: König. 💧👑",
      "Gedanklich schon im Feierabend, körperlich noch im Meeting. 🧠✈️🏢",
      "Zeit für den heimlichen Blick aufs Handy Nummer 47 heute. 📱",
      "Deine Tastatur klingt schon genervter als du. ⌨️😤",
      "Fokus: verloren. Suchtrupp: unterwegs. 🔦",
      "Der Nachmittag zieht sich wie Kaugummi. 🍬",
      "Innerlich schon am Ausstempeln, äußerlich noch am Tippen. ⌨️🚪",
      "Deine Tasse ist leer. Deine Geduld auch. Zufall? 🤔",
      "Mid-Tag-Motivation: geliehen, nicht gekauft. 💸",
      "Die Uhr bewegt sich in Zeitlupe. Absichtlich, vermutlich. 🐌🕐",
      "Dein Tatendrang hat sich in die Kaffeeküche verabschiedet. 🚪☕",
      "Noch 1000 Gedanken an Feierabend, 0 Gedanken an die Deadline. 💭",
      "Deine Produktivitätskurve macht gerade eine Mittagspause. 📉",
      "Zwischen Meeting Nummer 2 und 3 liegt nur noch Hoffnung. 🙏",
      "Dein Energy-Drink war eine Notlüge an dich selbst. 🥤",
      "Mid-Tag-Realness: Kaffee kalt, Motivation kälter. ☕🧊",
      "Der Nachmittag hat dich, nicht andersrum. 😮‍💨",
      "Deine Augen sagen 'Pause', dein Kalender sagt 'nein'. 👀📅",
    ],
    late: [
      "Es riecht schon nach Feierabend! 👃",
      "Fast geschafft – nicht nachlassen. 🚀",
      "Der Endspurt hat begonnen. 🏁",
      "Laptop zu, Leben an – bald ist es so weit. 💻➡️🎉",
      "Deine innere Stimme schreit schon 'FEIERABEND'. 📢",
      "Rizz steigt, Energie steigt, Bock auf Meetings sinkt. 📉",
      "Du kannst den Ausgang schon fast riechen. 🏃‍♂️💨",
      "Letzte Meile. Kein Zurück mehr. 🛣️",
      "Deine Tasse ist leer, aber dein Wille ist voll. Fast. ☕",
      "Noch kurz durchhalten, dann Main Character Energy für den Feierabend. ✨",
      "Der Countdown läuft heißer als deine Kaffeemaschine. 🔥☕",
      "Fast im Endgame. Boss: die letzte E-Mail. 🎮",
      "Deine Produktivität macht schon den Mantel an. 🧥",
      "Bald: Bildschirm aus, Serotonin an. 📺❌➡️😌",
      "Letzter Push, dann ist Schicht im Schacht. ⛏️",
      "Dein Stuhl fängt schon an, dich loszulassen. 🪑👋",
      "Der Feierabend blinkt schon am Horizont wie ein Notification-Badge. 🔴",
      "Kurz vorm Ziel – Beine (und Hirn) zusammenreißen. 🦵🧠",
      "So nah und doch so fern. Aber eher nah. 🌆",
      "Deine To-Do-Liste hat noch 2 Punkte. Deine Laune hat noch 0 Geduld. 😤",
      "Fast-Feierabend-Modus aktiviert. Ladebalken bei 90%. 🔋",
      "Fühlt sich an wie der letzte Kilometer eines Marathons, den keiner gefragt hat. 🏃",
      "Dein Gehirn checkt schon aus, dein Körper sitzt noch da. 🧠💨",
      "Bald heißt's: Tür zu, Kopf frei. 🚪🧘",
      "Feierabend-Vibes infiltrieren bereits dein Gehirn. 🧠📡",
      "Deine innere Uhr tickt lauter als die echte. ⏰",
      "Der letzte Espresso des Tages: rein taktisch. ☕🎯",
      "Fast geschafft, Energy-Reserven auf Notfall-Modus. 🔋🆘",
      "Deine Jacke flirtet schon mit der Garderobe. 🧥😏",
      "Kurz vorm Rausrennen, aber gepflegt bleiben. 🏃‍♀️✨",
      "Der Feierabend hat sich schon angekündigt wie ein Paket-Tracking. 📦",
      "Deine To-Do-Liste akzeptiert jetzt nur noch 'morgen'. 📝➡️📅",
      "Fast im Ziel, Beine schon auf Autopilot Richtung Tür. 🚶‍♂️🚪",
      "Letzte Runde: Konzentration auf Sparflamme. 🔥➡️💧",
      "Dein Hirn hat schon den Feierabend-Song ausgesucht. 🎧",
      "Fast durch, Motivation läuft auf Fumes. ⛽",
      "Der Endgegner heißt 'letzte ungelesene Nachricht'. 👾",
      "Deine Laune steigt proportional zur sinkenden Uhrzeit. 📈⏰",
      "Kurz vorm Feierabend-Sprint, bitte anschnallen. 🎢",
      "Fast geschafft, innerlich schon am Jubeln. 🎉🤫",
      "Der letzte Blick in den Kalender: bitte keine Überraschungen mehr. 🙏📅",
      "Deine Energie ist im Sparmodus, dein Optimismus nicht. 🔋✨",
      "Fast Feierabend, deine Gedanken sind schon auf der Couch. 🛋️💭",
      "Der Tag neigt sich, deine Geduld auch, aber knapp reicht's noch. ⚖️",
      "Letzte Meile, aber mit Stil. 💅🏁",
      "Feierabend-Antizipation auf Rekordniveau. 📊🎉",
      "Fast da, bitte keine 'kurze Frage' mehr reinlassen. 🙅‍♀️",
      "Dein Blick geht öfter zur Tür als zum Bildschirm. 🚪👀",
    ],
    almost: [
      "Gleich ist Schluss – halt durch! 🔥",
      "Countdown läuft, die letzten Minuten zählen. ⏳",
      "So nah dran – nicht mehr abschweifen! 👀",
      "Die letzten Minuten fühlen sich an wie Stunden. Klassiker. 🐌",
      "Feierabend ist in Sichtweite wie ein Ping auf Google Maps. 📍",
      "Dein Finger schwebt schon über dem Ausschalt-Knopf. 👆",
      "Letzte Sekunden – bloß jetzt keine neue E-Mail öffnen. 📧🙅",
      "Almost there. Halt die Spannung wie in nem Cliffhanger. 🎬",
      "Dein Mantel hängt schon bereit am Stuhl. 🧥",
      "Die Uhr tickt lauter als sonst. Oder bildest du dir das ein? 👂",
      "Gänsehaut-Moment: gleich ist es soweit. 🥶",
      "Noch kurz die Zähne zusammenbeißen, dann ist Ruhe. 🦷",
      "Dein Boss-Fight gegen die Zeit geht in die letzte Runde. ⚔️",
      "Fast durch – letzter Boss: die Verabschiedungsrunde im Büro. 👋",
      "So kurz vorm Ziel und trotzdem fühlt sich jede Minute nach 10 an. ⏱️",
      "Feierabend-Vorfreude: Stufe Maximum erreicht. 📈",
      "Gleich heißt's: raus hier, Kopf frei, Serie an. 📺",
      "Letzter Blick auf die Uhr, dann ist es geschafft. 👁️🕐",
      "Fast im Ziel-Bereich – bitte nicht stolpern. 🏃‍♀️",
      "Kurz vorm Abpfiff. Bleib fokussiert, Champion. 🏆",
      "Letzte Sekunden, Herzschlag synchronisiert sich mit der Uhr. 💓⏱️",
      "Fast geschafft, bloß jetzt nicht stolpern über eine Last-Minute-Anfrage. 🪤",
      "Der Cursor blinkt schon ungeduldiger als du. 🖱️",
      "Gleich ist es soweit, Gänsehaut Teil 2. 🥶✨",
      "Deine Finger zittern leicht vor Vorfreude. Oder Koffein. Beides gültig. ☕🤲",
      "Fast am Ziel, bitte nicht jetzt einschlafen vor Anspannung. 😴",
      "Letzte Minuten fühlen sich an wie ein Cliffhanger-Serienfinale. 📺",
      "Fast durch, dein innerer Countdown-Sprecher übernimmt. 🎙️",
      "So kurz davor, dass sogar die Uhr nervös wirkt. ⏰😬",
      "Gleich geht's los: Operation Feierabend, finale Phase. 🎯",
      "Fast geschafft, bitte Ruhe bewahren trotz Adrenalin. 🧘‍♂️⚡",
      "Letzter Cut, dann ist der Film vorbei. 🎬",
      "So nah dran, dass man schon die Couch riechen kann. 🛋️👃",
      "Fast im Ziel, Feuerwerk der Vorfreude wird gezündet. 🎆",
      "Gleich ist Zapfenstreich für den Arbeitstag. 🪖",
      "Letzte Sekunden ticken lauter als je zuvor. ⏱️🔊",
      "Fast da, bitte keine Überstunden-Falle mehr reintreten. 🪤",
      "So kurz vorm Abpfiff, Nerven bitte zusammenhalten. 🥅",
      "Gleich ist es geschafft, innerlich schon Konfetti am werfen. 🎊",
      "Letzte Meter, Zielband schon in Sicht. 🏁",
    ],
    done: [
      "Feierabend! Zeit, den Laptop zuzuklappen. 🎉",
      "Geschafft! Auf geht's ins Wochenende oder aufs Sofa. 🛋️",
      "Well done. Jetzt heißt es: abschalten. 🌙",
      "Offiziell im Feierabend-Modus. Genieß es! 🍻",
      "Main Character Energy: jetzt aktiviert. ✨",
      "Du hast es geschafft. Serotonin-Ausschüttung: läuft. 😌",
      "Feierabend erreicht. Hirn: im Flugmodus. ✈️",
      "Zeit für das wichtigste Meeting des Tages: mit dir selbst und der Couch. 🛋️",
      "Level Up! Du hast den Arbeitstag besiegt. 🏆",
      "Ab jetzt zählt nur noch: Chillen, Snacken, Nichtstun. 🍟😌",
      "Feierabend-Gong hat geläutet. Bitte lauter Applaus für dich selbst. 👏",
      "Deine Verantwortung für heute: offiziell beendet. ✅",
      "Zeit, das Gehirn in den Ruhemodus zu schicken. 🧠💤",
      "Geschafft, Legende. Bis morgen (leider). 🫡",
      "Von jetzt an gehört die Zeit wieder dir. 🕊️",
      "Ab in den Feierabend-Flow. Kein Zurück mehr. 🌊",
      "Du bist raus. Genieß den Rest vom Tag. 🚪✨",
      "Feierabend: erreicht, gefeiert, verdient. 🥳",
      "Feierabend erreicht. Zeit für den offiziellen Serotonin-Tanz. 💃",
      "Geschafft! Dein Stuhl vermisst dich schon jetzt nicht. 🪑👋",
      "Ab jetzt regiert die Couch. Uneingeschränkt. 🛋️👑",
      "Feierabend confirmed. Bildschirm aus, Leben an. 📺➡️🌳",
      "Du hast gewonnen. Der Preis: Ruhe. Genieß ihn. 🏆😌",
      "Offiziell raus aus dem Grind, rein ins Nichtstun. ⛏️➡️🛋️",
      "Feierabend: geladen, gespeichert, genossen. 💾",
      "Deine Verantwortung hat Feierabend. Deine Snacks nicht. 🍕",
      "Der Tag hat kapituliert. Du hast gewonnen. 🏳️",
      "Jetzt zählt nur noch: Serie, Snacks, Stille. 📺🍿🤫",
      "Feierabend-Modus: vollständig hochgefahren. 🚀",
      "Du bist raus aus der Matrix für heute. 💊",
      "Geschafft. Applaus, Konfetti, innerer Frieden. 🎊☮️",
      "Der Grind ruht. Du auch, hoffentlich. 😴",
      "Feierabend: der beste Teil vom Tag, offiziell bestätigt. ✅",
      "Ab jetzt gehört die Zeit dir. Nutze sie mit Stil. ✨",
      "Bildschirm zu, Kopf frei, Feierabend-Glück aktiviert. 🧠🕊️",
      "Du hast überlebt. Feiere das, wie es sich gehört. 🥳",
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
  }, 15000);

  // ---------- Fun Facts (drumherum-Fakten, unabhängig vom Fortschritt) ----------
  const FUN_FACTS = [
    "Fun Fact: Ein Arbeitstag fühlt sich mindestens 3x länger an, als er wirklich ist. Wissenschaftlich nicht belegt, gefühlt aber 100% korrekt.",
    "Wusstest du? Die Kaffeemaschine im Büro hat wahrscheinlich mehr soziale Kontakte als du heute.",
    "Fakt: 87% aller Gedanken im Büro drehen sich ums Mittagessen. Die restlichen 13% ums Wochenende.",
    "Studien zeigen (keine echten): Die letzte Arbeitsstunde vor Feierabend dauert gefühlt so lang wie die ersten sieben zusammen.",
    "Fun Fact: Dein Stuhl hat wahrscheinlich schon mehr Meetings überlebt als du.",
    "Wissenschaftlich fragwürdig, aber wahr: Uhren im Büro laufen gefühlt langsamer als Uhren zuhause.",
    "Fakt: Die Sekunde, in der man auf die Uhr schaut, vergeht garantiert am langsamsten.",
    "Fun Fact: Brainrot ist keine Krankheit, sondern ein Lifestyle.",
    "Wusstest du? 'Kurz noch was checken' hat schon so manche Konzentration ruiniert.",
    "Fakt: Jede zweite Kaffeepause endet in einer viel zu langen Konversation über nichts.",
    "Fun Fact: Die durchschnittliche Aufmerksamkeitsspanne nach dem Mittagessen liegt bei ca. 4 Sekunden.",
    "Studien (erfunden) zeigen: Montage fühlen sich an wie ein persönlicher Angriff.",
    "Fakt: Dein Gehirn hat um 15 Uhr offiziell Feierabend, dein Körper sitzt aber noch bis später.",
    "Fun Fact: Multitasking bedeutet meistens, mehrere Dinge gleichzeitig schlecht zu machen.",
    "Wusstest du? Der Legende nach hat noch niemand freiwillig ein komplettes Meeting-Protokoll gelesen.",
    "Fakt: Die besten Ideen kommen angeblich unter der Dusche. Nicht im Büro. Nie im Büro.",
    "Fun Fact: 'Ich schau nur kurz aufs Handy' ist die gefährlichste Lüge, die man sich selbst erzählt.",
    "Wissenschaftlich nicht bewiesen: Die letzte halbe Stunde vor Feierabend hat eigene Zeitgesetze.",
    "Fakt: Snacks im Büro verschwinden schneller, als jedes Meeting endet.",
    "Fun Fact: Man kann Motivation nicht kaufen. Kaffee schon. Fast dasselbe.",
    "Wusstest du? Der Impuls, die Uhrzeit zu checken, wird stärker, je näher der Feierabend rückt.",
    "Fakt: 'Nur noch schnell diese eine Mail' hat schon viele Feierabende um 20 Minuten verschoben.",
    "Fun Fact: Innerlich schreien zählt nicht als Pause, ist aber trotzdem wichtig.",
    "Wissenschaftlich fragwürdig: Freitage vergehen gefühlt in Lichtgeschwindigkeit.",
    "Fakt: Der Bürostuhl-Squeak ist offiziell die inoffizielle Hymne jedes Büros.",
    "Fun Fact: 'Kurz brainstormen' dauert nie kurz.",
    "Wusstest du? Die Zeit zwischen 'gleich ist Feierabend' und tatsächlichem Feierabend fühlt sich wie eine eigene Zeitzone an.",
    "Fakt: Niemand liest komplette Rundmails. Niemand. Auch du nicht.",
    "Fun Fact: Dein Energielevel korreliert exakt mit deinem Kaffeestand. Zufall? Wohl kaum.",
    "Wissenschaftlich nicht belegt: Meetings, die 'kurz' angekündigt werden, sind nie kurz.",
    "Fakt: Der Impuls, kurz vorm Feierabend nochmal aufzuräumen, ist Prokrastination in Tarnung.",
    "Fun Fact: Brainrot-Content schaut man sich nie 'nur kurz' an.",
    "Wusstest du? Statistisch gesehen denkst du gerade öfter an Feierabend als an diese Statistik.",
  ];

  let lastFactIndex = -1;
  function updateFunFact() {
    let idx = Math.floor(Math.random() * FUN_FACTS.length);
    if (idx === lastFactIndex && FUN_FACTS.length > 1) idx = (idx + 1) % FUN_FACTS.length;
    lastFactIndex = idx;
    el.funFact.classList.add("fade");
    setTimeout(() => {
      el.funFact.textContent = FUN_FACTS[idx];
      el.funFact.classList.remove("fade");
    }, 200);
  }
  updateFunFact();
  setInterval(updateFunFact, 45000);

  // ---------- Toast ----------
  let toastTimer = null;
  function showToast(text, ms = 2600) {
    clearTimeout(toastTimer);
    el.toast.textContent = text;
    el.toast.classList.add("show");
    toastTimer = setTimeout(() => el.toast.classList.remove("show"), ms);
  }

  // ---------- Coffee gimmick ----------
  function updateCoffeeStat(elapsedMs) {
    const minutes = Math.max(0, Math.floor(elapsedMs / 60000));
    const count = Math.floor(minutes / 45);
    if (minutes <= 0) {
      el.coffeeStat.textContent = "";
    } else if (count === 0) {
      el.coffeeStat.textContent = "☕ Kaffee Nummer 1 wartet noch auf dich.";
    } else {
      el.coffeeStat.textContent = `☕ In der bisherigen Zeit wären schon ${count} Kaffeepause${count === 1 ? "" : "n"} drin gewesen.`;
    }
  }

  // ---------- Runner / door gimmick ----------
  function updateRunner(progress) {
    const pct = Math.min(100, Math.max(0, progress * 100));
    el.progressRunner.style.left = `${pct}%`;
    const done = progress >= 1;
    if (done && el.progressRunner.textContent !== "🎉") {
      el.progressRunner.textContent = "🎉";
      el.progressRunner.classList.add("done");
    } else if (!done && el.progressRunner.textContent !== "🚶") {
      el.progressRunner.textContent = "🚶";
      el.progressRunner.classList.remove("done");
    }
    el.progressDoor.classList.toggle("open", done);
  }

  // ---------- Chaos-Modus ----------
  const CHAOS_MESSAGES = [
    "🌀 CHAOS-MODUS AKTIVIERT. Hirn wird neu gestartet...",
    "💀 Brainrot-Level: MAXIMUM erreicht.",
    "🤡 Alle Regeln pausiert. Für die nächsten Sekunden zählt nur Chaos.",
    "🫠 Realität wird kurz neu geladen...",
    "🎉 Zufälliger Konfetti-Angriff gestartet.",
    "👽 Außerirdische Energie freigesetzt.",
    "🔥 System überhitzt vor lauter Vibes.",
    "🧠💨 Gehirnzellen machen kurz Pause.",
    "🫡 Respekt für diesen Klick.",
    "🚨 Alarm: zu viel Spaß erkannt.",
  ];
  const RAIN_EMOJIS = ["💀", "🤡", "🫠", "👽", "🔥", "✨", "🎉", "🧠", "🌀", "🫡", "👾", "🎈"];

  function spawnEmojiRain(count = 40) {
    for (let i = 0; i < count; i++) {
      const span = document.createElement("span");
      span.className = "emoji-rain-item";
      span.textContent = RAIN_EMOJIS[Math.floor(Math.random() * RAIN_EMOJIS.length)];
      span.style.left = `${Math.random() * 100}vw`;
      span.style.fontSize = `${1.2 + Math.random() * 1.6}rem`;
      const duration = 2.4 + Math.random() * 2.2;
      span.style.animationDuration = `${duration}s`;
      span.style.animationDelay = `${Math.random() * 0.4}s`;
      document.body.appendChild(span);
      setTimeout(() => span.remove(), (duration + 0.5) * 1000);
    }
  }

  el.chaosBtn.addEventListener("click", () => {
    document.body.classList.remove("chaos");
    void document.body.offsetWidth;
    document.body.classList.add("chaos");
    const card = document.querySelector(".card");
    card.classList.remove("shake");
    void card.offsetWidth;
    card.classList.add("shake");
    spawnEmojiRain(45);
    spawnConfetti(120, Math.random() * 0.6 + 0.2, 0.1);
    showToast(CHAOS_MESSAGES[Math.floor(Math.random() * CHAOS_MESSAGES.length)]);
    playChime();
    setTimeout(() => document.body.classList.remove("chaos"), 2600);
  });

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
    updateRunner(progress);
    updateCoffeeStat(elapsedMs);
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

  function nudgeStartTime(minutesDelta) {
    const d = getStartDate();
    d.setMinutes(d.getMinutes() + minutesDelta);
    state.startTime = toHHMM(d);
    celebrated = false;
    applyStateToInputs();
    tick();
  }

  el.startTime.addEventListener("change", () => {
    if (!el.startTime.value) return;
    state.startTime = el.startTime.value;
    celebrated = false;
    tick();
  });

  el.workHours.addEventListener("input", () => {
    const v = parseFloat(el.workHours.value);
    if (Number.isNaN(v)) return;
    state.workHours = v;
    celebrated = false;
    syncChipStates();
    tick();
  });

  el.breakMinutes.addEventListener("input", () => {
    const v = parseFloat(el.breakMinutes.value);
    if (Number.isNaN(v)) return;
    state.breakMinutes = v;
    celebrated = false;
    syncChipStates();
    tick();
  });

  el.setNow.addEventListener("click", () => {
    state.startTime = toHHMM(new Date());
    celebrated = false;
    applyStateToInputs();
    tick();
  });

  el.nudgeRow.addEventListener("click", (e) => {
    const btn = e.target.closest("button[data-nudge]");
    if (!btn) return;
    nudgeStartTime(Number(btn.dataset.nudge));
  });

  el.workHoursChips.addEventListener("click", (e) => {
    const btn = e.target.closest("button[data-hours]");
    if (!btn) return;
    state.workHours = Number(btn.dataset.hours);
    celebrated = false;
    applyStateToInputs();
    tick();
  });

  el.breakChips.addEventListener("click", (e) => {
    const btn = e.target.closest("button[data-break]");
    if (!btn) return;
    state.breakMinutes = Number(btn.dataset.break);
    celebrated = false;
    applyStateToInputs();
    tick();
  });

  el.themeToggle.addEventListener("click", () => {
    state.theme = state.theme === "dark" ? "light" : "dark";
    applyTheme();
  });

  el.soundToggle.addEventListener("click", () => {
    state.soundOn = !state.soundOn;
    applySound();
    if (state.soundOn) playChime();
  });

  // ---------- Pixel-Art-Loop (statt Video-Embedding) ----------
  // Läuft komplett lokal ohne Netzwerk. Ein Pixel-Motiv setzt sich nach und
  // nach zusammen, hält kurz, löst sich wieder auf (zurück zum leeren
  // Startpunkt) und macht so Platz für das nächste Motiv – endlos, nahtlos.
  const pipCtx = el.pipCanvas.getContext("2d");
  let pipW = 0, pipH = 0, pipDpr = 1;
  let pipRunning = true;
  let pipRafId = null;
  let pipLastTs = 0;

  function resizePipCanvas() {
    const rect = el.pipBody.getBoundingClientRect();
    pipDpr = Math.min(devicePixelRatio || 1, 2);
    pipW = Math.max(1, Math.round(rect.width));
    pipH = Math.max(1, Math.round(rect.height));
    el.pipCanvas.width = pipW * pipDpr;
    el.pipCanvas.height = pipH * pipDpr;
    pipCtx.setTransform(pipDpr, 0, 0, pipDpr, 0, 0);
  }

  const PIXEL_GRID = 16;
  const PIXEL_SHAPES = [
    { id: "star", label: "⭐ Stern", hue: 46 },
    { id: "heart", label: "❤️ Herz", hue: 345 },
    { id: "circle", label: "⭕ Ring", hue: 190 },
    { id: "diamond", label: "🔶 Raute", hue: 265 },
    { id: "cross", label: "➕ Kreuz", hue: 130 },
    { id: "door", label: "🚪 Tür", hue: 25 },
  ];

  function buildShapeMask(id) {
    const N = PIXEL_GRID;
    const cx = (N - 1) / 2, cy = (N - 1) / 2;
    const mask = [];
    for (let y = 0; y < N; y++) {
      for (let x = 0; x < N; x++) {
        const dx = x - cx, dy = y - cy;
        const r = Math.sqrt(dx * dx + dy * dy);
        let filled = false;
        if (id === "star") {
          const ang = Math.atan2(dy, dx) + Math.PI * 2.5;
          const spikes = 5;
          const seg = (Math.PI * 2) / spikes;
          const a = (ang % seg) - seg / 2;
          const outer = N * 0.47, inner = N * 0.21;
          const edge = inner + (outer - inner) * (1 - Math.abs(a) / (seg / 2));
          filled = r <= edge;
        } else if (id === "heart") {
          const hx = dx / (N * 0.5);
          const hy = -dy / (N * 0.46) - 0.3;
          const val = Math.pow(hx * hx + hy * hy - 1, 3) - hx * hx * hy * hy * hy;
          filled = val <= 0;
        } else if (id === "circle") {
          filled = r <= N * 0.46 && r >= N * 0.3;
        } else if (id === "diamond") {
          filled = Math.abs(dx) + Math.abs(dy) <= N * 0.46;
        } else if (id === "cross") {
          const armX = Math.abs(dx) <= N * 0.13 && Math.abs(dy) <= N * 0.42;
          const armY = Math.abs(dy) <= N * 0.13 && Math.abs(dx) <= N * 0.42;
          filled = armX || armY;
        } else if (id === "door") {
          const inFrame = x >= N * 0.26 && x <= N * 0.74 && y >= N * 0.1 && y <= N * 0.92;
          const inHollow = x >= N * 0.33 && x <= N * 0.67 && y >= N * 0.18 && y <= N * 0.84;
          const knob = Math.hypot(x - N * 0.6, y - N * 0.52) <= 0.9;
          filled = (inFrame && !inHollow) || knob;
        }
        mask.push(filled);
      }
    }
    return mask;
  }

  // Reihenfolge + Einflugrichtung: die Pixel fliegen als Schwarm von einer
  // Kante rein (links/oben/rechts/unten, wechselt pro Motiv) und setzen
  // sich wellenartig von dieser Kante her zusammen; beim Auflösen fliegen
  // sie exakt dahin zurück -- der "Startpunkt" ist wörtlich der Rand,
  // von dem sie kamen.
  const ENTRY_DIRECTIONS = ["left", "top", "right", "bottom"];

  function buildRevealOrder(mask, dir) {
    const N = PIXEL_GRID;
    const cells = [];
    for (let y = 0; y < N; y++) {
      for (let x = 0; x < N; x++) {
        const i = y * N + x;
        if (!mask[i]) continue;
        let axisPos;
        if (dir === "left") axisPos = x;
        else if (dir === "right") axisPos = N - 1 - x;
        else if (dir === "top") axisPos = y;
        else axisPos = N - 1 - y;
        cells.push({ x, y, dist: axisPos + Math.random() * 2.2 });
      }
    }
    cells.sort((a, b) => a.dist - b.dist);
    const maxDist = cells.length ? cells[cells.length - 1].dist : 1;
    cells.forEach((c) => { c.order = maxDist > 0 ? c.dist / maxDist : 0; });
    return cells;
  }

  const ASSEMBLE_S = 2.0, HOLD_S = 1.3, DISASSEMBLE_S = 1.6, GAP_S = 0.3;
  const CYCLE_S = ASSEMBLE_S + HOLD_S + DISASSEMBLE_S + GAP_S;

  let pixelShapeIndex = -1;
  let pixelCells = null;
  let pixelHue = 0;
  let pixelDir = "left";
  let cycleT = 0;

  function setPixelShape(index) {
    pixelShapeIndex = ((index % PIXEL_SHAPES.length) + PIXEL_SHAPES.length) % PIXEL_SHAPES.length;
    const shape = PIXEL_SHAPES[pixelShapeIndex];
    pixelDir = ENTRY_DIRECTIONS[pixelShapeIndex % ENTRY_DIRECTIONS.length];
    pixelCells = buildRevealOrder(buildShapeMask(shape.id), pixelDir);
    pixelHue = shape.hue;
    el.pipLabel.textContent = shape.label;
    cycleT = 0;
  }

  function drawPixelFrame(t) {
    pipCtx.clearRect(0, 0, pipW, pipH);
    if (!pixelCells) return;

    let progress; // 0..1 sichtbarer Anteil, phase steuert Richtung
    let phase;
    if (t < ASSEMBLE_S) {
      phase = "in";
      progress = t / ASSEMBLE_S;
    } else if (t < ASSEMBLE_S + HOLD_S) {
      phase = "hold";
      progress = 1;
    } else if (t < ASSEMBLE_S + HOLD_S + DISASSEMBLE_S) {
      phase = "out";
      progress = 1 - (t - ASSEMBLE_S - HOLD_S) / DISASSEMBLE_S;
    } else {
      phase = "gap";
      progress = 0;
    }

    const N = PIXEL_GRID;
    const cell = (Math.min(pipW, pipH) * 0.82) / N;
    const gridSize = cell * N;
    const offX = (pipW - gridSize) / 2;
    const offY = (pipH - gridSize) / 2;
    const pad = cell * 0.12;
    const flyDist = cell * 9; // wie weit außerhalb der "Startpunkt" liegt

    for (const c of pixelCells) {
      // Beim Zusammensetzen kommt zuerst dran, wer nahe an der Einflugkante
      // liegt (order klein); beim Auflösen fliegt zuerst wieder raus, wer
      // zuletzt kam -> alles läuft zurück zum selben Rand.
      const localWindow = 0.3;
      let cellProgress;
      if (phase === "hold") cellProgress = 1;
      else if (phase === "gap") cellProgress = 0;
      else {
        const start = c.order * (1 - localWindow);
        cellProgress = clampNum((progress - start) / localWindow, 0, 1);
      }
      if (cellProgress <= 0) continue;
      const eased = cellProgress < 1
        ? 1 - Math.pow(1 - cellProgress, 3) // ease-out: schnell rein, sanft einrasten
        : 1;

      const targetX = offX + c.x * cell + cell / 2;
      const targetY = offY + c.y * cell + cell / 2;
      let startX = targetX, startY = targetY;
      if (pixelDir === "left") startX = targetX - flyDist;
      else if (pixelDir === "right") startX = targetX + flyDist;
      else if (pixelDir === "top") startY = targetY - flyDist;
      else startY = targetY + flyDist;

      const cxPos = startX + (targetX - startX) * eased;
      const cyPos = startY + (targetY - startY) * eased;
      const size = (cell - pad) * (0.5 + 0.5 * eased);
      const lightness = 55 + 10 * Math.sin(t * 2 + c.x * 0.4 + c.y * 0.3);
      pipCtx.fillStyle = `hsla(${pixelHue}, 85%, ${lightness}%, ${0.5 + 0.5 * eased})`;
      pipCtx.fillRect(cxPos - size / 2, cyPos - size / 2, size, size);
    }
  }

  function clampNum(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }

  function pipLoop(ts) {
    if (!pipRunning) return;
    if (!pipLastTs) pipLastTs = ts;
    const dt = Math.min((ts - pipLastTs) / 1000, 0.05);
    pipLastTs = ts;
    cycleT += dt;
    if (cycleT >= CYCLE_S) setPixelShape(pixelShapeIndex + 1);
    drawPixelFrame(cycleT);
    pipRafId = requestAnimationFrame(pipLoop);
  }

  function startPip() {
    if (pipRafId) return;
    pipRunning = true;
    pipLastTs = 0;
    el.pipPause.textContent = "⏸️";
    pipRafId = requestAnimationFrame(pipLoop);
  }

  function stopPip() {
    pipRunning = false;
    if (pipRafId) cancelAnimationFrame(pipRafId);
    pipRafId = null;
    el.pipPause.textContent = "▶️";
  }

  el.pipShuffle.addEventListener("click", () => {
    let next = Math.floor(Math.random() * PIXEL_SHAPES.length);
    if (PIXEL_SHAPES.length > 1 && next === pixelShapeIndex) next = (next + 1) % PIXEL_SHAPES.length;
    setPixelShape(next);
  });

  el.pipPause.addEventListener("click", () => {
    if (pipRunning) stopPip();
    else startPip();
  });

  document.addEventListener("visibilitychange", () => {
    if (document.hidden) stopPip();
    else if (el.pipPause.textContent === "⏸️") startPip();
  });

  resizePipCanvas();
  setPixelShape(0);
  startPip();

  el.shareBtn.addEventListener("click", async () => {
    const params = new URLSearchParams({
      s: state.startTime,
      h: String(state.workHours),
      b: String(state.breakMinutes),
    });
    const url = `${window.location.origin}${window.location.pathname}?${params.toString()}`;
    try {
      await navigator.clipboard.writeText(url);
      showToast("🔗 Link kopiert – mit deinen Zeiten für dich oder Kolleg*innen!");
    } catch {
      window.prompt("Link kopieren:", url);
    }
    window.history.replaceState(null, "", `?${params.toString()}`);
  });

  window.addEventListener("resize", () => {
    resizeConfettiCanvas();
    initStars();
    resizePipCanvas();
    setPixelShape(pixelShapeIndex);
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
