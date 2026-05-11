import { vi } from "vitest";
import { ScryfallApiError, ScryfallClient } from "./scryfallClient";
import type { ScryfallCard } from "./scryfallTypes";

function createResponse(body: unknown, init: ResponseInit = {}): Response {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { "Content-Type": "application/json" },
    ...init
  });
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

describe("ScryfallClient", () => {
  it("caches GET responses", async () => {
    const fetchFn = vi.fn().mockResolvedValue(createResponse(createCard()));
    const client = new ScryfallClient({ fetchFn, minDelayMs: 0 });

    const first = await client.getCardBySetCollector("XLN", "65", "de");
    const second = await client.getCardBySetCollector("XLN", "65", "de");

    expect(first.id).toBe(second.id);
    expect(fetchFn).toHaveBeenCalledTimes(1);
  });

  it("retries on 429 and eventually succeeds", async () => {
    const fetchFn = vi
      .fn()
      .mockResolvedValueOnce(createResponse({ object: "error", details: "Rate limit" }, { status: 429 }))
      .mockResolvedValueOnce(createResponse(createCard()));
    const client = new ScryfallClient({
      fetchFn,
      minDelayMs: 0,
      maxRetries: 1,
      retryBaseDelayMs: 1
    });

    const card = await client.getCardBySetCollector("XLN", "65", "de");

    expect(card.name).toBe("Opt");
    expect(fetchFn).toHaveBeenCalledTimes(2);
  });

  it("throws typed error when request fails", async () => {
    const fetchFn = vi
      .fn()
      .mockResolvedValue(createResponse({ object: "error", details: "Not found" }, { status: 404 }));
    const client = new ScryfallClient({ fetchFn, minDelayMs: 0 });

    await expect(client.getCardBySetCollector("XLN", "999", "de")).rejects.toBeInstanceOf(
      ScryfallApiError
    );
  });

  it("loads all pages for set searches", async () => {
    const fetchFn = vi
      .fn()
      .mockResolvedValueOnce(
        createResponse({
          object: "list",
          has_more: true,
          next_page: "https://api.scryfall.com/cards/search?page=2",
          data: [createCard({ id: "first" })]
        })
      )
      .mockResolvedValueOnce(
        createResponse({
          object: "list",
          has_more: false,
          data: [createCard({ id: "second" })]
        })
      );
    const client = new ScryfallClient({ fetchFn, minDelayMs: 0 });

    const cards = await client.searchCardsBySetCode("LTR", "de");

    expect(cards.map((card) => card.id)).toEqual(["first", "second"]);
    expect(fetchFn).toHaveBeenCalledTimes(2);
    expect(fetchFn).toHaveBeenNthCalledWith(
      1,
      expect.stringContaining("q=e%3Altr+lang%3Ade+game%3Apaper"),
      expect.any(Object)
    );
  });

  it("binds global fetch to the runtime object when no custom fetchFn is provided", async () => {
    const originalFetch = globalThis.fetch;
    const mockFetch = vi.fn(function (this: unknown) {
      expect(this).toBe(globalThis);
      return Promise.resolve(createResponse(createCard()));
    });

    Object.defineProperty(globalThis, "fetch", {
      configurable: true,
      writable: true,
      value: mockFetch
    });

    try {
      const client = new ScryfallClient({ minDelayMs: 0 });
      await client.getCardBySetCollector("XLN", "65", "de");
      expect(mockFetch).toHaveBeenCalledTimes(1);
    } finally {
      Object.defineProperty(globalThis, "fetch", {
        configurable: true,
        writable: true,
        value: originalFetch
      });
    }
  });
});
