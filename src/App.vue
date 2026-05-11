<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { appConfig } from "./config/appConfig";
import { parseArenaDecklist, type DeckSection } from "./lib/decklistParser";
import { resolveDeckEntries, type ResolveDeckResult } from "./lib/cardResolver";
import { ScryfallClient } from "./lib/scryfallClient";
import { downloadPdf, generateProxyPdfBytes } from "./lib/pdfGenerator";
import { importScryfallSet, type SetImportResult } from "./lib/setImporter";
import type { LayoutMode } from "./lib/pdfLayout";

const exampleDecklist = `Deck
4 Lightning Strike (M19) 152
4 Opt (XLN) 65
2 Stern Dismissal (THB) 68

Sideboard
2 Negate (M20) 69`;

const decklistText = ref(exampleDecklist);
const parsed = computed(() => parseArenaDecklist(decklistText.value));
const scryfallClient = new ScryfallClient();
const resolveResult = ref<ResolveDeckResult | null>(null);
const resolveError = ref<string | null>(null);
const isResolving = ref(false);
const resolveProgress = ref<{ current: number; total: number } | null>(null);
const includeSideboard = ref(true);
const fallbackMode = ref<"fallback_en" | "strict_de">("fallback_en");
const layoutMode = ref<LayoutMode>("exact_63x88");
const isGeneratingPdf = ref(false);
const pdfStatus = ref<string | null>(null);
const pdfError = ref<string | null>(null);
const setInput = ref("https://scryfall.com/sets/ltr");
const setImportResult = ref<SetImportResult | null>(null);
const isImportingSet = ref(false);
const setImportStatus = ref<string | null>(null);
const setImportError = ref<string | null>(null);

function sectionLabel(section: DeckSection): string {
  switch (section) {
    case "deck":
      return "Hauptdeck";
    case "sideboard":
      return "Sideboard";
    case "commander":
      return "Commander";
    case "companion":
      return "Companion";
  }
}

const entriesForLookup = computed(() =>
  parsed.value.entries.filter((entry) => includeSideboard.value || entry.section !== "sideboard")
);

const selectedCardTotal = computed(() =>
  entriesForLookup.value.reduce((sum, entry) => sum + entry.quantity, 0)
);

const unresolvedSummary = computed(() => {
  if (!resolveResult.value) {
    return null;
  }

  const unresolved = resolveResult.value.unresolved;
  const unresolvedCardQuantity = unresolved.reduce((sum, item) => sum + item.entry.quantity, 0);
  const uniqueCardNames = new Set(unresolved.map((item) => item.entry.name)).size;
  const reasons = new Map<string, number>();
  unresolved.forEach((item) => {
    reasons.set(item.reason, (reasons.get(item.reason) ?? 0) + 1);
  });

  return {
    unresolvedLines: unresolved.length,
    unresolvedCardQuantity,
    uniqueCardNames,
    reasonRows: Array.from(reasons.entries()).map(([reason, count]) => ({ reason, count }))
  };
});

function resetResolveAndPdfState(): void {
  resolveResult.value = null;
  resolveError.value = null;
  resolveProgress.value = null;
  pdfStatus.value = null;
  pdfError.value = null;
}

function resetSetImportState(): void {
  setImportResult.value = null;
  setImportStatus.value = null;
  setImportError.value = null;
  pdfStatus.value = null;
  pdfError.value = null;
}

watch([decklistText, includeSideboard, fallbackMode], () => {
  resetResolveAndPdfState();
});

watch([setInput, fallbackMode], () => {
  resetSetImportState();
});

async function resolveFromScryfall(): Promise<void> {
  if (entriesForLookup.value.length === 0) {
    resolveResult.value = null;
    resolveError.value = "Keine gültigen Einträge für die Suche vorhanden.";
    return;
  }

  isResolving.value = true;
  resolveError.value = null;
  resolveProgress.value = { current: 0, total: entriesForLookup.value.length };

  try {
    resolveResult.value = await resolveDeckEntries(entriesForLookup.value, {
      client: scryfallClient,
      preferredLanguage: "de",
      fallbackLanguage: "en",
      fallbackMode: fallbackMode.value,
      onProgress: (current, total) => {
        resolveProgress.value = { current, total };
      }
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unbekannter Scryfall-Fehler.";
    resolveError.value = message;
  } finally {
    isResolving.value = false;
  }
}

const canGeneratePdf = computed(
  () => Boolean(resolveResult.value && resolveResult.value.resolved.length > 0)
);

async function generatePdf(): Promise<void> {
  if (!resolveResult.value || resolveResult.value.resolved.length === 0) {
    pdfError.value = "Löse zuerst Karten auf, bevor du ein PDF erzeugst.";
    return;
  }

  isGeneratingPdf.value = true;
  pdfError.value = null;
  pdfStatus.value = "Druckbare Kartenliste wird vorbereitet...";

  try {
    const pdfBytes = await generateProxyPdfBytes(resolveResult.value.resolved, {
      layoutMode: layoutMode.value,
      onProgress: (current, total) => {
        pdfStatus.value = `Kartenbilder werden eingebettet: ${current}/${total}`;
      }
    });
    const timestamp = new Date().toISOString().slice(0, 10);
    const modeSuffix = layoutMode.value === "tight_margin" ? "tight" : "exact";
    downloadPdf(pdfBytes, `manaschmiede-proxies-${modeSuffix}-${timestamp}.pdf`);
    pdfStatus.value = "PDF erzeugt, Download gestartet.";
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unbekannter PDF-Fehler.";
    pdfError.value = message;
  } finally {
    isGeneratingPdf.value = false;
  }
}

async function importSetFromScryfall(): Promise<void> {
  isImportingSet.value = true;
  setImportError.value = null;
  setImportStatus.value = "Set wird von Scryfall geladen...";

  try {
    setImportResult.value = await importScryfallSet(setInput.value, {
      client: scryfallClient,
      preferredLanguage: "de",
      fallbackLanguage: "en",
      fallbackMode: fallbackMode.value
    });
    setImportStatus.value = `${setImportResult.value.resolved.length} Karten aus ${setImportResult.value.setCode.toUpperCase()} geladen.`;
  } catch (error) {
    setImportResult.value = null;
    setImportError.value = error instanceof Error ? error.message : "Unbekannter Set-Import-Fehler.";
    setImportStatus.value = null;
  } finally {
    isImportingSet.value = false;
  }
}

async function generateSetPdf(): Promise<void> {
  if (!setImportResult.value || setImportResult.value.resolved.length === 0) {
    pdfError.value = "Lade zuerst ein Set, bevor du ein PDF erzeugst.";
    return;
  }

  isGeneratingPdf.value = true;
  pdfError.value = null;
  pdfStatus.value = "Druckbare Set-Liste wird vorbereitet...";

  try {
    const pdfBytes = await generateProxyPdfBytes(setImportResult.value.resolved, {
      layoutMode: layoutMode.value,
      onProgress: (current, total) => {
        pdfStatus.value = `Kartenbilder werden eingebettet: ${current}/${total}`;
      }
    });
    const timestamp = new Date().toISOString().slice(0, 10);
    downloadPdf(pdfBytes, `manaschmiede-set-${setImportResult.value.setCode}-${timestamp}.pdf`);
    pdfStatus.value = "Set-PDF erzeugt, Download gestartet.";
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unbekannter PDF-Fehler.";
    pdfError.value = message;
  } finally {
    isGeneratingPdf.value = false;
  }
}
</script>

<template>
  <main class="app-shell">
    <section class="card">
      <h1>{{ appConfig.name }}</h1>
      <p>Erstellt druckbare MTG-Proxy-PDFs aus Arena-Decklisten.</p>
      <p class="meta-line">
        Die Seite ist noch in Arbeit. Funktionen und Darstellung können sich noch ändern.
      </p>
      <p class="meta-line">
        Hinweis: ManaSchmiede ist als privates Hilfsmittel für Proxys, Tests und Deckplanung gedacht.
        Die Anwendung soll weder Urheberrechtsverletzungen noch den Verzicht auf den Kauf offizieller
        Karten fördern.
      </p>
      <p class="meta-line">
        Version {{ appConfig.version }} | Erkannte Zeilen: {{ parsed.entries.length }} |
        Karten gesamt: {{ parsed.totalCards }} | Hinweise: {{ parsed.diagnostics.length }}
      </p>

      <label for="decklist-input" class="section-title">Arena-Deckliste</label>
      <textarea
        id="decklist-input"
        v-model="decklistText"
        class="decklist-input"
        spellcheck="false"
      />

      <h2 class="section-title">Optionen</h2>
      <div id="options-panel" class="options-panel">
        <label class="checkbox-row">
          <input id="include-sideboard" v-model="includeSideboard" type="checkbox">
          Sideboard-Karten einbeziehen
        </label>

        <label for="fallback-mode" class="section-title compact-title">Sprach-Fallback</label>
        <select id="fallback-mode" v-model="fallbackMode" class="layout-select">
          <option value="fallback_en">Englisch verwenden, wenn es keinen deutschen Druck gibt</option>
          <option value="strict_de">Nur deutsche Drucke erlauben</option>
        </select>

        <label for="layout-mode" class="section-title compact-title">PDF-Layout</label>
        <select id="layout-mode" v-model="layoutMode" class="layout-select">
          <option value="exact_63x88">Exakt 63 x 88 mm (empfohlen)</option>
          <option value="tight_margin">Knappe Ränder (etwas größere Karten)</option>
        </select>

        <p class="meta-line option-summary">
          Für die Suche ausgewählte Zeilen: {{ entriesForLookup.length }} | Ausgewählte
          Kartenanzahl: {{ selectedCardTotal }}
        </p>
      </div>

      <h2 class="section-title">Erkannte Eintraege</h2>
      <p v-if="parsed.entries.length === 0" class="empty-state">
        Noch keine gültigen Kartenzeilen erkannt.
      </p>
      <div v-else class="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>Zeile</th>
              <th>Nutzen</th>
              <th>Bereich</th>
              <th>Anzahl</th>
              <th>Name</th>
              <th>Set</th>
              <th>Nr.</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="entry in parsed.entries" :key="`${entry.line}-${entry.name}`">
              <td>{{ entry.line }}</td>
              <td>{{ includeSideboard || entry.section !== "sideboard" ? "ja" : "nein" }}</td>
              <td>{{ sectionLabel(entry.section) }}</td>
              <td>{{ entry.quantity }}</td>
              <td>{{ entry.name }}</td>
              <td>{{ entry.setCode ?? "-" }}</td>
              <td>{{ entry.collectorNumber ?? "-" }}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <h2 class="section-title">Hinweise</h2>
      <p v-if="parsed.diagnostics.length === 0" class="empty-state">Keine Parser-Fehler.</p>
      <ul v-else class="diagnostic-list">
        <li v-for="diagnostic in parsed.diagnostics" :key="`${diagnostic.line}-${diagnostic.code}`">
          <strong>Zeile {{ diagnostic.line }}:</strong> {{ diagnostic.message }}
        </li>
      </ul>

      <h2 class="section-title">Scryfall-Auflösung</h2>
      <button
        id="resolve-scryfall-button"
        class="primary-button"
        :disabled="isResolving || entriesForLookup.length === 0"
        @click="resolveFromScryfall"
      >
        {{ isResolving ? "Karten werden aufgelöst..." : "Karten über Scryfall auflösen" }}
      </button>
      <p v-if="isResolving && resolveProgress" class="meta-line">
        Karten werden aufgelöst: {{ resolveProgress.current }}/{{ resolveProgress.total }}
      </p>
      <p v-if="resolveError" class="error-text">{{ resolveError }}</p>
      <p v-else-if="resolveResult" class="meta-line">
        Aufgelöst: {{ resolveResult.resolved.length }} | Nicht aufgelöst:
        {{ resolveResult.unresolved.length }} | Auf Englisch ausgewichen:
        {{ resolveResult.fallbackToEnglishCount }}
      </p>

      <div v-if="resolveResult && resolveResult.unresolved.length > 0">
        <h3 class="section-title">Nicht aufgelöste Karten</h3>
        <p v-if="unresolvedSummary" class="meta-line">
          Nicht aufgelöste Zeilen: {{ unresolvedSummary.unresolvedLines }} | Eindeutige
          Kartennamen: {{ unresolvedSummary.uniqueCardNames }} | Nicht aufgelöste Anzahl:
          {{ unresolvedSummary.unresolvedCardQuantity }}
        </p>
        <div v-if="unresolvedSummary" class="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Grund</th>
                <th>Zeilen</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="reasonRow in unresolvedSummary.reasonRows" :key="reasonRow.reason">
                <td>{{ reasonRow.reason }}</td>
                <td>{{ reasonRow.count }}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <ul class="diagnostic-list">
          <li
            v-for="unresolved in resolveResult.unresolved"
            :key="`${unresolved.entry.line}-${unresolved.entry.name}`"
          >
            <strong>Zeile {{ unresolved.entry.line }} ({{ unresolved.entry.name }}):</strong>
            {{ unresolved.reason }}
          </li>
        </ul>
      </div>

      <h2 class="section-title">PDF-Erzeugung</h2>
      <button
        id="generate-pdf-button"
        class="primary-button"
        :disabled="isGeneratingPdf || !canGeneratePdf"
        @click="generatePdf"
      >
        {{ isGeneratingPdf ? "PDF wird erzeugt..." : "Druckbares A4-PDF erzeugen" }}
      </button>
      <p v-if="pdfStatus" class="meta-line">{{ pdfStatus }}</p>
      <p v-if="pdfError" class="error-text">{{ pdfError }}</p>

      <h2 class="section-title">Komplettes Set importieren</h2>
      <p class="meta-line">
        Gib einen Scryfall-Set-Link oder Set-Code ein, zum Beispiel
        <code>https://scryfall.com/sets/ltr</code> oder <code>ltr</code>.
      </p>
      <label for="set-input" class="section-title compact-title">Scryfall-Set</label>
      <input
        id="set-input"
        v-model="setInput"
        class="text-input"
        spellcheck="false"
        type="text"
      >
      <button
        id="import-set-button"
        class="primary-button spaced-button"
        :disabled="isImportingSet"
        @click="importSetFromScryfall"
      >
        {{ isImportingSet ? "Set wird geladen..." : "Set über Scryfall laden" }}
      </button>
      <p v-if="setImportStatus" class="meta-line">{{ setImportStatus }}</p>
      <p v-if="setImportError" class="error-text">{{ setImportError }}</p>
      <p v-if="setImportResult" class="meta-line">
        Deutsch: {{ setImportResult.preferredCount }} | Englisch-Fallback:
        {{ setImportResult.fallbackCount }}
      </p>
      <button
        id="generate-set-pdf-button"
        class="primary-button"
        :disabled="isGeneratingPdf || !setImportResult || setImportResult.resolved.length === 0"
        @click="generateSetPdf"
      >
        {{ isGeneratingPdf ? "PDF wird erzeugt..." : "Set als A4-PDF erzeugen" }}
      </button>

      <h2 id="print-instructions" class="section-title">Druckhinweise</h2>
      <ol class="instruction-list">
        <li>Verwende A4-Papier im Hochformat.</li>
        <li>Stelle den Druckmaßstab exakt auf 100 %.</li>
        <li>Deaktiviere "An Seite anpassen" oder "Auf Seitengröße verkleinern".</li>
        <li>Verwende nach Möglichkeit hohe Druckqualität oder Fotomodus.</li>
        <li>Stecke die Proxys nach dem Ausschneiden mit einer echten Karte in Hüllen.</li>
      </ol>
    </section>
  </main>
</template>
