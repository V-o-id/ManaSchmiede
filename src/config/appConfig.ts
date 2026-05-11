const DEFAULT_APP_NAME = "ManaSchmiede";
const DEFAULT_APP_VERSION = "0.2.0-dev";
const DEFAULT_REPOSITORY_URL = "https://github.com/V-o-id/ManaSchmiede";

function resolveScryfallUserAgent(appName: string, appVersion: string, repositoryUrl: string): string {
  return `${appName}/${appVersion} (+${repositoryUrl})`;
}

export const appConfig = {
  name: import.meta.env.VITE_APP_NAME ?? DEFAULT_APP_NAME,
  version: import.meta.env.VITE_APP_VERSION ?? DEFAULT_APP_VERSION,
  repositoryUrl: import.meta.env.VITE_APP_REPOSITORY_URL ?? DEFAULT_REPOSITORY_URL
};

export const scryfallClientIdentity =
  import.meta.env.VITE_SCRYFALL_USER_AGENT ??
  resolveScryfallUserAgent(appConfig.name, appConfig.version, appConfig.repositoryUrl);
