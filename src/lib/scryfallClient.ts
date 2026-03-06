import { buildScryfallRequestInit } from "./scryfallRequest";
import type { ScryfallCard, ScryfallErrorResponse, ScryfallList } from "./scryfallTypes";

type FetchFunction = (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>;

export interface ScryfallClientOptions {
  fetchFn?: FetchFunction;
  baseUrl?: string;
  minDelayMs?: number;
  maxRetries?: number;
  retryBaseDelayMs?: number;
}

export class ScryfallApiError extends Error {
  readonly status: number;
  readonly details?: string;

  constructor(message: string, status: number, details?: string) {
    super(message);
    this.name = "ScryfallApiError";
    this.status = status;
    this.details = details;
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function escapeCardName(name: string): string {
  return name.replace(/"/g, '\\"');
}

function isRetryableStatus(status: number): boolean {
  return status === 429 || status >= 500;
}

export class ScryfallClient {
  private readonly fetchFn: FetchFunction;
  private readonly baseUrl: string;
  private readonly minDelayMs: number;
  private readonly maxRetries: number;
  private readonly retryBaseDelayMs: number;
  private readonly cache = new Map<string, unknown>();
  private requestChain: Promise<void> = Promise.resolve();
  private lastRequestTime = 0;

  constructor(options: ScryfallClientOptions = {}) {
    this.fetchFn = options.fetchFn ?? fetch;
    this.baseUrl = (options.baseUrl ?? "https://api.scryfall.com").replace(/\/$/, "");
    this.minDelayMs = options.minDelayMs ?? 110;
    this.maxRetries = options.maxRetries ?? 2;
    this.retryBaseDelayMs = options.retryBaseDelayMs ?? 300;
  }

  async getCardBySetCollector(
    setCode: string,
    collectorNumber: string,
    language?: string
  ): Promise<ScryfallCard> {
    const encodedSet = encodeURIComponent(setCode.toLowerCase());
    const encodedCollector = encodeURIComponent(collectorNumber);
    const encodedLanguage = language ? `/${encodeURIComponent(language.toLowerCase())}` : "";
    const path = `/cards/${encodedSet}/${encodedCollector}${encodedLanguage}`;
    return this.getJson<ScryfallCard>(path);
  }

  async searchNewestPrintByName(name: string, language: string): Promise<ScryfallCard | null> {
    const query = `!"${escapeCardName(name)}" lang:${language.toLowerCase()}`;
    const params = new URLSearchParams({
      q: query,
      unique: "prints",
      order: "released",
      dir: "desc"
    });
    const result = await this.getJson<ScryfallList<ScryfallCard>>(`/cards/search?${params.toString()}`);
    return result.data[0] ?? null;
  }

  private async getJson<T>(pathWithQuery: string): Promise<T> {
    const url = `${this.baseUrl}${pathWithQuery}`;
    const cacheKey = `GET:${url}`;
    const cached = this.cache.get(cacheKey);
    if (cached) {
      return cached as T;
    }

    const response = await this.enqueue(() => this.fetchWithRetries(url));
    const data = await this.readJson<T | ScryfallErrorResponse>(response);

    if (!response.ok) {
      const errorObject = data as Partial<ScryfallErrorResponse>;
      const details = typeof errorObject.details === "string" ? errorObject.details : undefined;
      const message = details ?? `Scryfall request failed with status ${response.status}`;
      throw new ScryfallApiError(message, response.status, details);
    }

    this.cache.set(cacheKey, data);
    return data as T;
  }

  private async fetchWithRetries(url: string): Promise<Response> {
    const requestInit = buildScryfallRequestInit();

    for (let attempt = 0; attempt <= this.maxRetries; attempt += 1) {
      await this.applyRateLimit();
      const response = await this.fetchFn(url, requestInit);

      if (response.ok || !isRetryableStatus(response.status) || attempt === this.maxRetries) {
        return response;
      }

      const backoffMs = this.retryBaseDelayMs * 2 ** attempt;
      await sleep(backoffMs);
    }

    throw new Error("Unreachable retry loop state.");
  }

  private async readJson<T>(response: Response): Promise<T> {
    try {
      return (await response.json()) as T;
    } catch {
      return {} as T;
    }
  }

  private async applyRateLimit(): Promise<void> {
    const now = Date.now();
    const waitMs = this.lastRequestTime + this.minDelayMs - now;
    if (waitMs > 0) {
      await sleep(waitMs);
    }
    this.lastRequestTime = Date.now();
  }

  private enqueue<T>(task: () => Promise<T>): Promise<T> {
    const run = this.requestChain.then(task, task);
    this.requestChain = run.then(
      () => undefined,
      () => undefined
    );
    return run;
  }
}

