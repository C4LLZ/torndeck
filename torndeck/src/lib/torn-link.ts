import streamDeck from "@elgato/streamdeck";

const TORN_URL = "https://www.torn.com";

/** Opens Torn in the user's default browser - used for the long-press gesture shared by every TornDeck key. */
export function openTorn(): void {
  void streamDeck.system.openUrl(TORN_URL);
}
