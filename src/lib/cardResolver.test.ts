import { vi } from "vitest";
import type { DeckEntry } from "./decklistParser";
import { resolveDeckEntries, type CardLookupClient } from "./cardResolver";
import { ScryfallApiError } from "./scryfallClient";
import type { ScryfallCard } from "./scryfallTypes";

function createDeckEntry(overrides: Partial<DeckEntry> = {}): DeckEntry {
  return {
    line: 1,
    rawLine: "1 Opt (XLN) 65",
    section: "deck",
    quantity: 1,
    name: "Opt",
    setCode: "XLN",
    collectorNumber: "65",
    ...overrides
  };
}

function createCard(overrides: Partial<ScryfallCard> = {}): ScryfallCard {
  return {
    id: "card-id",
    name: "Opt",
    lang: "de",
    released_at: "2018-09-01",
    set: "xln",
    collector_number: "65",
    ...overrides
  };
}

describe("resolveDeckEntries", () => {
  it("resolves via set/collector in preferred language first", async () => {
    const getCardBySetCollector = vi.fn().mockResolvedValue(createCard({ lang: "de" }));
    const searchNewestPrintByName = vi.fn().mockResolvedValue(null);
    const client: CardLookupClient = { getCardBySetCollector, searchNewestPrintByName };

    const result = await resolveDeckEntries([createDeckEntry()], { client });

    expect(result.unresolved).toHaveLength(0);
    expect(result.resolved).toHaveLength(1);
    expect(result.resolved[0].source).toBe("set_collector");
    expect(result.resolved[0].languageUsed).toBe("de");
    expect(searchNewestPrintByName).not.toHaveBeenCalled();
  });

  it("falls back to English when German print cannot be found", async () => {
    const getCardBySetCollector = vi
      .fn()
      .mockRejectedValueOnce(new ScryfallApiError("Not found", 404))
      .mockResolvedValueOnce(createCard({ lang: "en" }));
    const searchNewestPrintByName = vi.fn().mockResolvedValue(null);
    const client: CardLookupClient = { getCardBySetCollector, searchNewestPrintByName };

    const result = await resolveDeckEntries([createDeckEntry()], { client, fallbackMode: "fallback_en" });

    expect(result.resolved).toHaveLength(1);
    expect(result.fallbackToEnglishCount).toBe(1);
    expect(result.resolved[0].languageUsed).toBe("en");
  });

  it("uses name search when set/collector info is missing", async () => {
    const getCardBySetCollector = vi.fn().mockResolvedValue(createCard({ lang: "de" }));
    const searchNewestPrintByName = vi.fn().mockResolvedValue(createCard({ lang: "de" }));
    const client: CardLookupClient = { getCardBySetCollector, searchNewestPrintByName };

    const result = await resolveDeckEntries(
      [
        createDeckEntry({
          setCode: undefined,
          collectorNumber: undefined,
          rawLine: "1 Opt"
        })
      ],
      { client }
    );

    expect(result.resolved).toHaveLength(1);
    expect(result.resolved[0].source).toBe("name_search");
    expect(getCardBySetCollector).not.toHaveBeenCalled();
    expect(searchNewestPrintByName).toHaveBeenCalledWith("Opt", "de");
  });

  it("returns unresolved when strict_de is enabled and no German print exists", async () => {
    const getCardBySetCollector = vi.fn().mockRejectedValue(new ScryfallApiError("Not found", 404));
    const searchNewestPrintByName = vi.fn().mockResolvedValue(null);
    const client: CardLookupClient = { getCardBySetCollector, searchNewestPrintByName };

    const result = await resolveDeckEntries([createDeckEntry()], { client, fallbackMode: "strict_de" });

    expect(result.resolved).toHaveLength(0);
    expect(result.unresolved).toHaveLength(1);
    expect(result.fallbackToEnglishCount).toBe(0);
  });

  it("reuses lookups for duplicate entries", async () => {
    const getCardBySetCollector = vi.fn().mockResolvedValue(createCard({ lang: "de" }));
    const searchNewestPrintByName = vi.fn().mockResolvedValue(null);
    const client: CardLookupClient = { getCardBySetCollector, searchNewestPrintByName };

    const entry = createDeckEntry();
    const duplicateEntry = createDeckEntry({ line: 99, rawLine: "1 Opt (XLN) 65" });
    const result = await resolveDeckEntries([entry, duplicateEntry], { client });

    expect(result.resolved).toHaveLength(2);
    expect(getCardBySetCollector).toHaveBeenCalledTimes(1);
  });

  it("emits progress callbacks for every processed entry", async () => {
    const getCardBySetCollector = vi.fn().mockResolvedValue(createCard({ lang: "de" }));
    const searchNewestPrintByName = vi.fn().mockResolvedValue(null);
    const client: CardLookupClient = { getCardBySetCollector, searchNewestPrintByName };
    const onProgress = vi.fn();

    const first = createDeckEntry({ line: 1 });
    const second = createDeckEntry({ line: 2, rawLine: "1 Opt (XLN) 65" });
    await resolveDeckEntries([first, second], { client, onProgress });

    expect(onProgress).toHaveBeenCalledTimes(2);
    expect(onProgress).toHaveBeenLastCalledWith(2, 2, second);
  });
});
