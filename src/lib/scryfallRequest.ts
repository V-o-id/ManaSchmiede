import { scryfallClientIdentity } from "../config/appConfig";

/**
 * Browser fetch cannot set User-Agent directly (forbidden header).
 * For server-side runtimes we include User-Agent explicitly.
 */
export function buildScryfallRequestInit(): RequestInit {
  const headers: Record<string, string> = {
    Accept: "application/json"
  };

  if (typeof window === "undefined") {
    headers["User-Agent"] = scryfallClientIdentity;
  }

  return { headers };
}

