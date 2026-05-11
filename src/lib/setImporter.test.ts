import { importScryfallSet, parseScryfallSetInput, type SetImportClient } from "./setImporter";
import type { ScryfallCard } from "./scryfallTypes";

function createCard(overrides: Partial<ScryfallCard> = {}): ScryfallCard {
  return {
    id: "card-id",
    name: "Opt",
    lang: "de",
    released_at: "2018-09-01",
    set: "ltr",
    collector_number: "65",
    image_uris: { png: "https://img.example/card.png" },
    ...overrides
  };
}

describe("parseScryfallSetInput", () => {
  it("accepts set URLs and raw set codes", () => {
    expect(parseScryfallSetInput("https://scryfall.com/sets/ltr")).toBe("ltr");
    expect(parseScryfallSetInput("LTR")).toBe("ltr");
  });

  it("rejects invalid input", () => {
    expect(parseScryfallSetInput("https://example.com/sets/ltr")).toBeNull();
    expect(parseScryfallSetInput("not a set code")).toBeNull();
  });
});

describe("importScryfallSet", () => {
  it("prefers German cards and fills missing collector numbers with English fallback", async () => {
    const client: SetImportClient = {
      searchCardsBySetCode: vi.fn(async (_setCode, language) =>
        language === "de"
          ? [createCard({ id: "de-1", collector_number: "1", lang: "de" })]
          : [
              createCard({ id: "en-1", collector_number: "1", lang: "en" }),
              createCard({ id: "en-2", collector_number: "2", lang: "en", name: "Fallback" })
            ]
      )
    };

    const result = await importScryfallSet("ltr", { client });

    expect(result.resolved).toHaveLength(2);
    expect(result.preferredCount).toBe(1);
    expect(result.fallbackCount).toBe(1);
    expect(result.resolved.map((item) => item.card.id)).toEqual(["de-1", "en-2"]);
  });

  it("does not fetch fallback cards in strict German mode", async () => {
    const client: SetImportClient = {
      searchCardsBySetCode: vi.fn(async () => [createCard({ collector_number: "1" })])
    };

    const result = await importScryfallSet("ltr", { client, fallbackMode: "strict_de" });

    expect(result.resolved).toHaveLength(1);
    expect(client.searchCardsBySetCode).toHaveBeenCalledTimes(1);
  });
});
