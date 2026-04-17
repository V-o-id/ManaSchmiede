# ManaSchmiede

ManaSchmiede ist ein Webtool zum Erstellen von druckbaren Magic: The Gathering Proxy-PDFs aus Arena-Decklisten.

Die Seite ist noch in Arbeit. Funktionen, Texte und Layout können sich noch ändern.

Die Anwendung:
- liest eine Arena-Deckliste ein,
- sucht passende Kartendrucke über Scryfall,
- bevorzugt deutsche Karten und kann optional auf Englisch ausweichen,
- erstellt ein druckbares A4-PDF mit 3x3 Karten pro Seite.

## Nutzung

1. Füge eine Arena-Deckliste in das Eingabefeld ein.
2. Wähle, ob das Sideboard einbezogen werden soll.
3. Wähle, ob bei fehlenden deutschen Drucken auf Englisch ausgewichen werden darf.
4. Wähle den PDF-Modus.
5. Klicke auf `Karten über Scryfall auflösen`.
6. Klicke danach auf `Druckbares A4-PDF erzeugen`.

## Lokal starten

Voraussetzung: Node.js 20+.

1. `npm install`
2. `npm run dev`

## GitHub Pages

Das Projekt ist für GitHub Pages unter `https://v-o-id.github.io/ManaSchmiede/` vorbereitet.
