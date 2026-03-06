import type { DeckEntry } from "./decklistParser";
import { ScryfallApiError, ScryfallClient } from "./scryfallClient";
import type { ScryfallCard } from "./scryfallTypes";

export interface CardLookupClient {
  getCardBySetCollector(setCode: string, collectorNumber: string, language?: string): Promise<ScryfallCard>;
  searchNewestPrintByName(name: string, language: string): Promise<ScryfallCard | null>;
}

export interface ResolveDeckOptions {
  client?: CardLookupClient;
  preferredLanguage?: string;
  fallbackLanguage?: string;
  fallbackMode?: "fallback_en" | "strict_de";
}

export interface ResolvedCard {
  entry: DeckEntry;
  card: ScryfallCard;
  languageUsed: string;
  source: "set_collector" | "name_search";
}

export interface UnresolvedCard {
  entry: DeckEntry;
  reason: string;
  attempts: string[];
}

export interface ResolveDeckResult {
  resolved: ResolvedCard[];
  unresolved: UnresolvedCard[];
  fallbackToEnglishCount: number;
}

function notFound(error: unknown): boolean {
  return error instanceof ScryfallApiError && error.status === 404;
}

function messageFromError(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  return "Unknown error.";
}

async function tryResolveBySetCollector(
  client: CardLookupClient,
  entry: DeckEntry,
  language: string,
  attempts: string[]
): Promise<ScryfallCard | null> {
  if (!entry.setCode || !entry.collectorNumber) {
    return null;
  }

  attempts.push(`set_collector:${entry.setCode}/${entry.collectorNumber}:${language}`);
  return client.getCardBySetCollector(entry.setCode, entry.collectorNumber, language);
}

async function tryResolveByName(
  client: CardLookupClient,
  entry: DeckEntry,
  language: string,
  attempts: string[]
): Promise<ScryfallCard | null> {
  attempts.push(`name_search:${entry.name}:${language}`);
  return client.searchNewestPrintByName(entry.name, language);
}

async function resolveSingleEntry(
  client: CardLookupClient,
  entry: DeckEntry,
  preferredLanguage: string,
  fallbackLanguage: string,
  fallbackMode: "fallback_en" | "strict_de"
): Promise<{ resolved?: ResolvedCard; unresolved?: UnresolvedCard; usedFallback: boolean }> {
  const attempts: string[] = [];
  let usedFallback = false;

  const tryTargets: Array<{
    language: string;
    source: "set_collector" | "name_search";
    run: () => Promise<ScryfallCard | null>;
  }> = [];

  if (entry.setCode && entry.collectorNumber) {
    tryTargets.push({
      language: preferredLanguage,
      source: "set_collector",
      run: () => tryResolveBySetCollector(client, entry, preferredLanguage, attempts)
    });
    if (fallbackMode === "fallback_en") {
      tryTargets.push({
        language: fallbackLanguage,
        source: "set_collector",
        run: () => tryResolveBySetCollector(client, entry, fallbackLanguage, attempts)
      });
    }
  }

  tryTargets.push({
    language: preferredLanguage,
    source: "name_search",
    run: () => tryResolveByName(client, entry, preferredLanguage, attempts)
  });
  if (fallbackMode === "fallback_en") {
    tryTargets.push({
      language: fallbackLanguage,
      source: "name_search",
      run: () => tryResolveByName(client, entry, fallbackLanguage, attempts)
    });
  }

  for (const target of tryTargets) {
    try {
      const card = await target.run();
      if (!card) {
        continue;
      }
      usedFallback = usedFallback || target.language === fallbackLanguage;
      return {
        resolved: {
          entry,
          card,
          languageUsed: target.language,
          source: target.source
        },
        usedFallback
      };
    } catch (error) {
      if (notFound(error)) {
        continue;
      }
      return {
        unresolved: {
          entry,
          reason: `Request failed: ${messageFromError(error)}`,
          attempts
        },
        usedFallback
      };
    }
  }

  return {
    unresolved: {
      entry,
      reason: "No matching Scryfall print found for configured language strategy.",
      attempts
    },
    usedFallback
  };
}

export async function resolveDeckEntries(
  entries: DeckEntry[],
  options: ResolveDeckOptions = {}
): Promise<ResolveDeckResult> {
  const client = options.client ?? new ScryfallClient();
  const preferredLanguage = options.preferredLanguage ?? "de";
  const fallbackLanguage = options.fallbackLanguage ?? "en";
  const fallbackMode = options.fallbackMode ?? "fallback_en";

  const uniqueResolutionPromises = new Map<
    string,
    Promise<{ resolved?: ResolvedCard; unresolved?: UnresolvedCard; usedFallback: boolean }>
  >();

  const keyForEntry = (entry: DeckEntry): string =>
    [entry.name, entry.setCode ?? "", entry.collectorNumber ?? ""].join("|");

  const results = await Promise.all(
    entries.map(async (entry) => {
      const key = keyForEntry(entry);
      const existing = uniqueResolutionPromises.get(key);
      if (existing) {
        const resolvedResult = await existing;
        if (resolvedResult.resolved) {
          return {
            resolved: {
              ...resolvedResult.resolved,
              entry
            },
            usedFallback: resolvedResult.usedFallback
          };
        }
        return {
          unresolved: {
            ...resolvedResult.unresolved!,
            entry
          },
          usedFallback: resolvedResult.usedFallback
        };
      }

      const promise = resolveSingleEntry(
        client,
        entry,
        preferredLanguage,
        fallbackLanguage,
        fallbackMode
      );
      uniqueResolutionPromises.set(key, promise);
      return promise;
    })
  );

  const resolved: ResolvedCard[] = [];
  const unresolved: UnresolvedCard[] = [];
  let fallbackToEnglishCount = 0;

  results.forEach((result) => {
    if (result.usedFallback) {
      fallbackToEnglishCount += 1;
    }
    if (result.resolved) {
      resolved.push(result.resolved);
      return;
    }
    if (result.unresolved) {
      unresolved.push(result.unresolved);
    }
  });

  return {
    resolved,
    unresolved,
    fallbackToEnglishCount
  };
}

