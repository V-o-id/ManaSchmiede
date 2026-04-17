# ManaSchmiede

ManaSchmiede ist ein Webtool zum Erstellen von druckbaren Magic: The Gathering Proxy-PDFs aus Arena-Decklisten.

Die Anwendung:
- liest eine Arena-Deckliste ein,
- sucht passende Kartendrucke ueber Scryfall,
- bevorzugt deutsche Karten und kann optional auf Englisch ausweichen,
- erstellt ein druckbares A4-PDF mit 3x3 Karten pro Seite.

## Nutzung

1. Fuege eine Arena-Deckliste in das Eingabefeld ein.
2. Waehle, ob das Sideboard einbezogen werden soll.
3. Waehle, ob bei fehlenden deutschen Drucken auf Englisch ausgewichen werden darf.
4. Waehle den PDF-Modus.
5. Klicke auf `Karten ueber Scryfall aufloesen`.
6. Klicke danach auf `Druckbares A4-PDF erzeugen`.

## Lokal starten

Voraussetzung: Node.js 20+.

1. `npm install`
2. `npm run dev`

## GitHub Pages

Das Projekt ist fuer GitHub Pages unter `https://v-o-id.github.io/ManaSchmiede/` vorbereitet.
