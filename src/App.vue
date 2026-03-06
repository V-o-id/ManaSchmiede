<script setup lang="ts">
import { computed, ref } from "vue";
import { appConfig } from "./config/appConfig";
import { parseArenaDecklist } from "./lib/decklistParser";
import { resolveDeckEntries, type ResolveDeckResult } from "./lib/cardResolver";
import { ScryfallClient } from "./lib/scryfallClient";

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

async function resolveFromScryfall(): Promise<void> {
  if (parsed.value.entries.length === 0) {
    resolveResult.value = null;
    resolveError.value = "No valid entries available for lookup.";
    return;
  }

  isResolving.value = true;
  resolveError.value = null;

  try {
    resolveResult.value = await resolveDeckEntries(parsed.value.entries, {
      client: scryfallClient,
      preferredLanguage: "de",
      fallbackLanguage: "en",
      fallbackMode: "fallback_en"
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown Scryfall error.";
    resolveError.value = message;
  } finally {
    isResolving.value = false;
  }
}
</script>

<template>
  <main class="app-shell">
    <section class="card">
      <h1>{{ appConfig.name }}</h1>
      <p>Arena decklist parser + Scryfall resolution preview (Phase 3, Vue).</p>
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

      <h2 class="section-title">Parsed Entries</h2>
      <p v-if="parsed.entries.length === 0" class="empty-state">No valid card lines parsed yet.</p>
      <div v-else class="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>Line</th>
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
        :disabled="isResolving || parsed.entries.length === 0"
        @click="resolveFromScryfall"
      >
        {{ isResolving ? "Resolving..." : "Resolve Cards via Scryfall" }}
      </button>
      <p v-if="resolveError" class="error-text">{{ resolveError }}</p>
      <p v-else-if="resolveResult" class="meta-line">
        Resolved: {{ resolveResult.resolved.length }} | Unresolved:
        {{ resolveResult.unresolved.length }} | Fallback to English:
        {{ resolveResult.fallbackToEnglishCount }}
      </p>

      <div v-if="resolveResult && resolveResult.unresolved.length > 0">
        <h3 class="section-title">Unresolved Cards</h3>
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
    </section>
  </main>
</template>
