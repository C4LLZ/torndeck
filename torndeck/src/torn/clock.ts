let offsetSeconds = 0;

/**
 * Call this after every successful Torn API response (they all now request the `timestamp`
 * selection alongside their real data) to keep every action's countdown math aligned with Torn's
 * actual server clock, rather than each one independently trusting the local machine's clock -
 * which can drift, run on the wrong timezone, or just be a few seconds off. This is what lets
 * Chain, Hospital, Cooldowns, and Flight all agree on "now."
 */
export function syncServerTime(serverTimestampSeconds: number, requestSentMs: number, responseReceivedMs: number): void {
  const roundTripMs = responseReceivedMs - requestSentMs;
  // A slow round trip means an unreliable sample; keep the previous (better) offset instead.
  if (roundTripMs > 3000) return;
  // The server stamped the response somewhere mid-flight, so compare against the midpoint, not
  // the arrival time. Torn's timestamp is whole seconds (truncated), so the true time is on
  // average half a second later.
  const localMidpointSeconds = (requestSentMs + responseReceivedMs) / 2000;
  offsetSeconds = serverTimestampSeconds + 0.5 - localMidpointSeconds;
}

/** Current time in epoch seconds, corrected for any measured drift against Torn's server clock. */
export function nowSeconds(): number {
  return Date.now() / 1000 + offsetSeconds;
}
