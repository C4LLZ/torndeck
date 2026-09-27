import { fetchTornTravel, TornTravel } from "../torn/api";

const FINAL_APPROACH_SECONDS = 12;

/**
 * Every flight-tracking key ticks its countdown locally between polls, trusting the arrival time
 * from its last real fetch. If Torn's own estimate shifts a little (or a shared cache made that
 * fetch a few seconds stale), the key can keep showing "still flying" briefly after the user has
 * actually landed in-game. Once the local countdown gets close to zero, this does one forced
 * (cache-bypassing) check against the live API to confirm - and correct the countdown if needed -
 * instead of trusting pure local extrapolation for the final stretch. At most one extra request
 * per flight, right at the end, so it doesn't undo the shared-cache request savings.
 */
export class LandingConfirmer {
  private readonly pending = new Set<string>();

  check(actionId: string, apiKey: string, remainingSeconds: number, onResult: (travel: TornTravel) => void): void {
    if (remainingSeconds > FINAL_APPROACH_SECONDS || remainingSeconds <= 0 || this.pending.has(actionId)) return;
    this.pending.add(actionId);
    void fetchTornTravel(apiKey, true)
      .then(onResult)
      .catch(() => {})
      .finally(() => this.pending.delete(actionId));
  }

  stop(actionId: string): void {
    this.pending.delete(actionId);
  }
}
