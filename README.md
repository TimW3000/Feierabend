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
- 🎬 **PiP-Player direkt neben dem Countdown**: TikTok- oder YouTube-Link
  einfügen (Feld unter dem Timer) → läuft sofort als kleines Bild-in-Bild-
  Fenster neben dem Countdown. YouTube (inkl. Shorts) funktioniert
  zuverlässig in jeder Größe; TikTok nutzt deren offizielles Embed-Widget,
  das aber eine gewisse Mindestbreite verlangt und sich bei Bedarf
  automatisch verbreitert. Ein direktes "endlos durchswipbares" Feed lässt
  sich technisch nicht einbetten (TikTok/Reels blocken das ohne Login/API) –
  darum gibt es zusätzlich Schnelllinks, um ein Video zu suchen und den
  Link hier einzufügen.
- Arbeitsbeginn frei editierbar: Zeit-Eingabe, "Jetzt"-Button und eine
  eigene Zeile mit Fein-Buttons (±1h / ±5m / ±1m) zum exakten Treffen
- Schnellauswahl-Chips für Arbeitszeiten (6h–8,5h, inkl. 7,8h = 7h48min) und Pausen
- Dark/Light-Mode (startet mit Systemeinstellung)
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
