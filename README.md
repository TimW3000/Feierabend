# 🌇 Feierabend-Rechner

Eine kleine, eigenständige Webseite, die live anzeigt, wie lange es noch bis
zum Feierabend dauert – auf Basis von Arbeitsbeginn, geplanter Arbeitszeit
und Pause.

## Features

- Live-Countdown bis zum Feierabend (aktualisiert sekündlich)
- Fortschrittsbalken + animierte Sonnenuntergangs-Szene, die den
  Tagesfortschritt visualisiert (Sonne wandert über den Himmel, der Himmel
  färbt sich von Morgenblau über Sonnenuntergang bis zur Nacht)
- Kleine Figur wandert auf dem Fortschrittsbalken zur Tür; die Tür öffnet
  sich (mit Glow-Effekt), sobald Feierabend erreicht ist
- Sternenhimmel & Mond, sobald Feierabend erreicht ist
- Konfetti-Regen und Sound-Signal beim Erreichen des Feierabends
- "Kaffeepausen-Zähler" als kleine Spielerei unter dem Countdown
- Überstunden-Anzeige, sobald die geplante Zeit überschritten ist
- Über 200 rotierende, launige/absurde Sprüche (wechseln alle 15 Sekunden),
  plus ein separater "Fun Fact"-Ticker mit ca. 30 unnützen Büro-Wahrheiten
- 🌀 Chaos-Button: Emoji-Regen, Farb-Verzerrung, Konfetti und ein zufälliger
  Chaos-Spruch auf einen Klick
- 🎬 **Ambient-Player direkt neben dem Countdown**: eine kleine, komplett
  lokal berechnete Endlos-Animation (Lava-Blobs, Warp-Starfield, Matrix-Rain,
  Aurora-Wellen) läuft als Bild-in-Bild-Fenster neben dem Timer – zum
  Zuschauen während der Wartezeit. 🔀 wechselt die Animation, ⏸️ pausiert.
  Bewusst kein echtes TikTok/YouTube-Embedding mehr: externe Video-Widgets
  laufen unzuverlässig (Mindestbreiten, "Video nicht verfügbar" auf manchen
  Geräten) und brauchen Netzwerkzugriff, den restriktive Firewalls oft
  blockieren – die Animation braucht dagegen keinerlei externe Ressourcen.
- Arbeitsbeginn frei editierbar: Zeit-Eingabe oben, darunter eine Zeile mit
  Fein-Buttons (−1h/−5m/−1m … "Jetzt" … +1m/+5m/+1h) zum exakten Treffen
- Schnellauswahl-Chips für Arbeitszeiten (6h–8,5h, inkl. 7,8h = 7h48min) und Pausen
- Dark/Light-Mode (startet mit Systemeinstellung)
- 🕹️ **Mini-Arcade** an der Seite: 10 kleine Browser-Spiele (Runner, Drift,
  Shooter, Breakout, Snake, Pong, 1v1-Duell, Climber, Blocks/Tetris-Style,
  Rhythmus-Spiel) für eine kurze Runde nebenbei. Adaptiert aus
  [TimW3000/Fakten-Website](https://github.com/TimW3000/Fakten-Website),
  aber ohne Firebase-Leaderboard und ohne `localStorage` – Bestwerte gelten
  nur für die aktuelle Sitzung, passend zum "alles startet frisch"-Prinzip
  dieser Seite. Auf Desktop steht die Arcade neben dem Rechner, auf Mobile
  darunter.
- **Kein `localStorage`, kein Tracking:** Die Seite merkt sich nichts und ist
  für mehrere Personen gleichzeitig auf unterschiedlichen Geräten gedacht –
  jeder Aufruf startet komplett frisch mit der aktuellen Uhrzeit als Start.
  Wer seine eigenen Werte behalten will, klickt auf 🔗 "Link teilen" – das
  kopiert einen Link mit den aktuellen Einstellungen als URL-Parametern
  (`?s=Startzeit&h=Stunden&b=Pause`), den man sich selbst bookmarken oder
  an Kolleg*innen schicken kann.
- Keine externen Ressourcen (keine Google Fonts o.ä.) – läuft auch hinter
  restriktiven Firewalls/Proxys komplett offline

## Nutzung

Einfach `index.html` im Browser öffnen, oder lokal einen Server starten:

```bash
python3 -m http.server 8000
```

und dann `http://localhost:8000` aufrufen.

Kein Build-Schritt, keine Abhängigkeiten – reines HTML/CSS/JS.
