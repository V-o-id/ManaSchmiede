<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { appConfig } from "./config/appConfig";
import { parseArenaDecklist } from "./lib/decklistParser";
import { resolveDeckEntries, type ResolveDeckResult } from "./lib/cardResolver";
import { ScryfallClient } from "./lib/scryfallClient";
import { downloadPdf, generateProxyPdfBytes } from "./lib/pdfGenerator";
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

watch([decklistText, includeSideboard, fallbackMode], () => {
  resetResolveAndPdfState();
});

async function resolveFromScryfall(): Promise<void> {
  if (entriesForLookup.value.length === 0) {
    resolveResult.value = null;
    resolveError.value = "No valid entries available for lookup.";
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
    const message = error instanceof Error ? error.message : "Unknown Scryfall error.";
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
    pdfError.value = "Resolve cards first before generating a PDF.";
    return;
  }

  isGeneratingPdf.value = true;
  pdfError.value = null;
  pdfStatus.value = "Preparing printable card list...";

  try {
    const pdfBytes = await generateProxyPdfBytes(resolveResult.value.resolved, {
      layoutMode: layoutMode.value,
      onProgress: (current, total) => {
        pdfStatus.value = `Embedding card images: ${current}/${total}`;
      }
    });
    const timestamp = new Date().toISOString().slice(0, 10);
    const modeSuffix = layoutMode.value === "tight_margin" ? "tight" : "exact";
    downloadPdf(pdfBytes, `manaschmiede-proxies-${modeSuffix}-${timestamp}.pdf`);
    pdfStatus.value = "PDF generated and download started.";
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown PDF generation error.";
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
      <p>Arena decklist parser + Scryfall resolution + PDF generation (Phase 5, Vue).</p>
      <p class="meta-line">
        Version {{ appConfig.version }} | Parsed lines: {{ parsed.entries.length }} | Total cards:
        {{ parsed.totalCards }} | Diagnostics: {{ parsed.diagnostics.length }}
      </p>

      <label for="decklist-input" class="section-title">Arena Decklist</label>
      <textarea
        id="decklist-input"
        v-model="decklistText"
        class="decklist-input"
        spellcheck="false"
      />

      <h2 class="section-title">Options</h2>
      <div id="options-panel" class="options-panel">
        <label class="checkbox-row">
          <input id="include-sideboard" v-model="includeSideboard" type="checkbox">
          Include sideboard cards
        </label>

        <label for="fallback-mode" class="section-title compact-title">Language fallback mode</label>
        <select id="fallback-mode" v-model="fallbackMode" class="layout-select">
          <option value="fallback_en">Use English when no German print exists</option>
          <option value="strict_de">Only allow German prints (strict)</option>
        </select>

        <label for="layout-mode" class="section-title compact-title">PDF layout mode</label>
        <select id="layout-mode" v-model="layoutMode" class="layout-select">
          <option value="exact_63x88">Exact 63 x 88 mm (recommended)</option>
          <option value="tight_margin">Tight margins (slightly larger cards)</option>
        </select>

        <p class="meta-line option-summary">
          Selected lines for lookup: {{ entriesForLookup.length }} | Selected card quantity:
          {{ selectedCardTotal }}
        </p>
      </div>

      <h2 class="section-title">Parsed Entries</h2>
      <p v-if="parsed.entries.length === 0" class="empty-state">No valid card lines parsed yet.</p>
      <div v-else class="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>Line</th>
              <th>Use</th>
              <th>Section</th>
              <th>Qty</th>
              <th>Name</th>
              <th>Set</th>
              <th>No.</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="entry in parsed.entries" :key="`${entry.line}-${entry.name}`">
              <td>{{ entry.line }}</td>
              <td>{{ includeSideboard || entry.section !== "sideboard" ? "yes" : "no" }}</td>
              <td>{{ entry.section }}</td>
              <td>{{ entry.quantity }}</td>
              <td>{{ entry.name }}</td>
              <td>{{ entry.setCode ?? "-" }}</td>
              <td>{{ entry.collectorNumber ?? "-" }}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <h2 class="section-title">Diagnostics</h2>
      <p v-if="parsed.diagnostics.length === 0" class="empty-state">No parse errors.</p>
      <ul v-else class="diagnostic-list">
        <li v-for="diagnostic in parsed.diagnostics" :key="`${diagnostic.line}-${diagnostic.code}`">
          <strong>Line {{ diagnostic.line }}:</strong> {{ diagnostic.message }}
        </li>
      </ul>

      <h2 class="section-title">Scryfall Resolution (Phase 3)</h2>
      <button
        id="resolve-scryfall-button"
        class="primary-button"
        :disabled="isResolving || entriesForLookup.length === 0"
        @click="resolveFromScryfall"
      >
        {{ isResolving ? "Resolving..." : "Resolve Cards via Scryfall" }}
      </button>
      <p v-if="isResolving && resolveProgress" class="meta-line">
        Resolving cards: {{ resolveProgress.current }}/{{ resolveProgress.total }}
      </p>
      <p v-if="resolveError" class="error-text">{{ resolveError }}</p>
      <p v-else-if="resolveResult" class="meta-line">
        Resolved: {{ resolveResult.resolved.length }} | Unresolved:
        {{ resolveResult.unresolved.length }} | Fallback to English:
        {{ resolveResult.fallbackToEnglishCount }}
      </p>

      <div v-if="resolveResult && resolveResult.unresolved.length > 0">
        <h3 class="section-title">Unresolved Cards</h3>
        <p v-if="unresolvedSummary" class="meta-line">
          Unresolved lines: {{ unresolvedSummary.unresolvedLines }} | Unique card names:
          {{ unresolvedSummary.uniqueCardNames }} | Unresolved quantity:
          {{ unresolvedSummary.unresolvedCardQuantity }}
        </p>
        <div v-if="unresolvedSummary" class="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Reason</th>
                <th>Lines</th>
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
            <strong>Line {{ unresolved.entry.line }} ({{ unresolved.entry.name }}):</strong>
            {{ unresolved.reason }}
          </li>
        </ul>
      </div>

      <h2 class="section-title">PDF Generation (Phase 4)</h2>
      <button
        id="generate-pdf-button"
        class="primary-button"
        :disabled="isGeneratingPdf || !canGeneratePdf"
        @click="generatePdf"
      >
        {{ isGeneratingPdf ? "Generating PDF..." : "Generate Printable A4 PDF" }}
      </button>
      <p v-if="pdfStatus" class="meta-line">{{ pdfStatus }}</p>
      <p v-if="pdfError" class="error-text">{{ pdfError }}</p>

      <h2 id="print-instructions" class="section-title">Print Instructions</h2>
      <ol class="instruction-list">
        <li>Use A4 paper in portrait orientation.</li>
        <li>Set print scale to exactly 100%.</li>
        <li>Disable "fit to page" or "shrink to fit".</li>
        <li>Use high-quality or photo print mode when available.</li>
        <li>After cutting, sleeve proxies with a backing card for stiffness.</li>
      </ol>
    </section>
  </main>
</template>
