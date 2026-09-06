let offsetSeconds = 0;

/**
 * Call this after every successful Torn API response (they all now request the `timestamp`
 * selection alongside their real data) to keep every action's countdown math aligned with Torn's
 * actual server clock, rather than each one independently trusting the local machine's clock -
 * which can drift, run on the wrong timezone, or just be a few seconds off. This is what lets
 * Chain, Hospital, Cooldowns, and Flight all agree on "now."
 */
export function syncServerTime(serverTimestampSeconds: number): void {
  offsetSeconds = serverTimestampSeconds - Date.now() / 1000;
}

/** Current time in epoch seconds, corrected for any measured drift against Torn's server clock. */
export function nowSeconds(): number {
  return Date.now() / 1000 + offsetSeconds;
}
