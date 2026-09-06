import streamDeck from "@elgato/streamdeck";

/** Settings shared by every TornDeck action, set once from any action's property inspector. */
export type GlobalSettings = {
  apiKey?: string;
};

let cachedApiKey: string | undefined;
let initPromise: Promise<void> | undefined;

function normalize(apiKey: string | undefined): string | undefined {
  return apiKey?.trim() || undefined;
}

/**
 * Lazily fetches global settings exactly once and caches the API key from then on, updating it
 * only via the push event. Calling `streamDeck.settings.getGlobalSettings()` itself re-triggers
 * that same push event on the plugin side (not just in the property inspector) - so re-fetching on
 * every poll, as this used to do, formed an infinite refresh loop the moment a key was set.
 */
function ensureInitialized(): Promise<void> {
  if (!initPromise) {
    initPromise = streamDeck.settings.getGlobalSettings<GlobalSettings>().then((settings) => {
      cachedApiKey = normalize(settings.apiKey);
    });
    streamDeck.settings.onDidReceiveGlobalSettings<GlobalSettings>((ev) => {
      cachedApiKey = normalize(ev.settings.apiKey);
    });
  }
  return initPromise;
}

export async function getApiKey(): Promise<string | undefined> {
  await ensureInitialized();
  return cachedApiKey;
}
