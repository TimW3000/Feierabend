# 🌇 Feierabend-Rechner

Eine kleine, eigenständige Webseite, die live anzeigt, wie lange es noch bis
zum Feierabend dauert – auf Basis von Arbeitsbeginn, geplanter Arbeitszeit
und Pause.

## Features

- Live-Countdown bis zum Feierabend (aktualisiert sekündlich)
- Fortschrittsbalken + animierte Sonnenuntergangs-Szene, die den
  Tagesfortschritt visualisiert (Sonne wandert über den Himmel, der Himmel
  färbt sich von Morgenblau über Sonnenuntergang bis zur Nacht)
- Sternenhimmel & Mond, sobald Feierabend erreicht ist
- Konfetti-Regen und Sound-Signal beim Erreichen des Feierabends
- Überstunden-Anzeige, sobald die geplante Zeit überschritten ist
- Rotierende, launige Sprüche je nach Tagesfortschritt
- Schnellauswahl-Chips für gängige Arbeitszeiten (6h–8,5h) und Pausen
- Dark/Light-Mode (merkt sich die Wahl, startet mit Systemeinstellung)
- Alle Eingaben werden in `localStorage` gespeichert

## Nutzung

Einfach `index.html` im Browser öffnen, oder lokal einen Server starten:

```bash
python3 -m http.server 8000
```

und dann `http://localhost:8000` aufrufen.

Kein Build-Schritt, keine Abhängigkeiten – reines HTML/CSS/JS.
