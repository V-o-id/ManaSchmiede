# ManaSchmiede

ManaSchmiede ist ein Webtool zum Erstellen von druckbaren Magic: The Gathering Proxy-PDFs aus Arena-Decklisten.

Die Seite ist noch in Arbeit. Funktionen, Texte und Layout können sich noch ändern.

ManaSchmiede ist als privates Hilfsmittel für Proxys, Tests und Deckplanung gedacht. Die Anwendung soll weder Urheberrechtsverletzungen noch den Verzicht auf den Kauf offizieller Karten fördern.

Die Anwendung:
- liest eine Arena-Deckliste ein,
- sucht passende Kartendrucke über Scryfall,
- kann komplette Scryfall-Sets über Set-Code oder Set-Link laden,
- bevorzugt deutsche Karten und kann optional auf Englisch ausweichen,
- erstellt ein druckbares A4-PDF mit 3x3 Karten pro Seite.

## Nutzung

1. Füge eine Arena-Deckliste in das Eingabefeld ein.
2. Wähle, ob das Sideboard einbezogen werden soll.
3. Wähle, ob bei fehlenden deutschen Drucken auf Englisch ausgewichen werden darf.
4. Wähle den PDF-Modus.
5. Klicke auf `Karten über Scryfall auflösen`.
6. Klicke danach auf `Druckbares A4-PDF erzeugen`.

Alternativ kannst du ein komplettes Set über einen Scryfall-Link wie `https://scryfall.com/sets/ltr` oder den Set-Code `ltr` laden und daraus ein PDF erzeugen.

## Lokal starten

Voraussetzung: Node.js 20+.

1. `npm install`
2. `npm run dev`

## GitHub Pages

Das Projekt ist für GitHub Pages unter `https://v-o-id.github.io/ManaSchmiede/` vorbereitet.
