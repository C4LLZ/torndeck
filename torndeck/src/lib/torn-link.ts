import streamDeck from "@elgato/streamdeck";

export const DEFAULT_TORN_URL = "https://www.torn.com";

/**
 * Opens `url` in the user's default browser - used for the long-press gesture shared by every
 * TornDeck key. Falls back to torn.com when `url` is unset/blank, and forgives a missing protocol
 * (e.g. "torn.com/factions.php" typed without "https://").
 */
export function openUrl(url: string | undefined): void {
  const trimmed = url?.trim();
  if (!trimmed) {
    void streamDeck.system.openUrl(DEFAULT_TORN_URL);
    return;
  }
  void streamDeck.system.openUrl(/^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`);
}
