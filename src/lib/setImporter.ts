import type { ResolvedCard } from "./cardResolver";
import type { DeckEntry } from "./decklistParser";
import { ScryfallClient } from "./scryfallClient";
import type { ScryfallCard } from "./scryfallTypes";

export interface SetImportClient {
  searchCardsBySetCode(setCode: string, language: string): Promise<ScryfallCard[]>;
}

export interface SetImportOptions {
  client?: SetImportClient;
  preferredLanguage?: string;
  fallbackLanguage?: string;
  fallbackMode?: "fallback_en" | "strict_de";
}

export interface SetImportResult {
  setCode: string;
  resolved: ResolvedCard[];
  preferredCount: number;
  fallbackCount: number;
}

export function parseScryfallSetInput(input: string): string | null {
  const trimmed = input.trim();
  if (trimmed.length === 0) {
    return null;
  }

  const urlMatch = /^https?:\/\/scryfall\.com\/sets\/(?<setCode>[a-z0-9_-]+)\/?$/i.exec(trimmed);
  const rawSetCode = urlMatch?.groups?.setCode ?? trimmed;

  if (!/^[a-z0-9_-]{2,12}$/i.test(rawSetCode)) {
    return null;
  }

  return rawSetCode.toLowerCase();
}

function keyForCard(card: ScryfallCard): string {
  return card.collector_number;
}

function toResolvedCard(card: ScryfallCard, languageUsed: string, line: number): ResolvedCard {
  const entry: DeckEntry = {
    line,
    rawLine: `1 ${card.name} (${card.set.toUpperCase()}) ${card.collector_number}`,
    section: "deck",
    quantity: 1,
    name: card.name,
    setCode: card.set.toUpperCase(),
    collectorNumber: card.collector_number
  };

  return {
    entry,
    card,
    languageUsed,
    source: "set_collector"
  };
}

export async function importScryfallSet(input: string, options: SetImportOptions = {}): Promise<SetImportResult> {
  const setCode = parseScryfallSetInput(input);
  if (!setCode) {
    throw new Error("Bitte gib einen gültigen Scryfall-Set-Link oder Set-Code ein.");
  }

  const client = options.client ?? new ScryfallClient();
  const preferredLanguage = options.preferredLanguage ?? "de";
  const fallbackLanguage = options.fallbackLanguage ?? "en";
  const fallbackMode = options.fallbackMode ?? "fallback_en";

  const preferredCards = await client.searchCardsBySetCode(setCode, preferredLanguage);
  const cardsByCollector = new Map<string, { card: ScryfallCard; language: string }>();

  preferredCards.forEach((card) => {
    cardsByCollector.set(keyForCard(card), { card, language: preferredLanguage });
  });

  if (fallbackMode === "fallback_en") {
    const fallbackCards = await client.searchCardsBySetCode(setCode, fallbackLanguage);
    fallbackCards.forEach((card) => {
      const key = keyForCard(card);
      if (!cardsByCollector.has(key)) {
        cardsByCollector.set(key, { card, language: fallbackLanguage });
      }
    });
  }

  const resolved = Array.from(cardsByCollector.values()).map(({ card, language }, index) =>
    toResolvedCard(card, language, index + 1)
  );

  return {
    setCode,
    resolved,
    preferredCount: resolved.filter((item) => item.languageUsed === preferredLanguage).length,
    fallbackCount: resolved.filter((item) => item.languageUsed === fallbackLanguage).length
  };
}
