<script setup lang="ts">
import { computed, ref } from "vue";
import { appConfig } from "./config/appConfig";
import { parseArenaDecklist } from "./lib/decklistParser";

const exampleDecklist = `Deck
4 Lightning Strike (M19) 152
4 Opt (XLN) 65
2 Stern Dismissal (THB) 68

Sideboard
2 Negate (M20) 69`;

const decklistText = ref(exampleDecklist);
const parsed = computed(() => parseArenaDecklist(decklistText.value));
</script>

<template>
  <main class="app-shell">
    <section class="card">
      <h1>{{ appConfig.name }}</h1>
      <p>Arena decklist parser preview (Phase 2, Vue).</p>
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
    </section>
  </main>
</template>

