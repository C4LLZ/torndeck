const LONG_PRESS_MS = 600;

/** Tracks key-down times per action instance to distinguish a long press from a normal tap on key-up. */
export class LongPressTracker {
  private readonly downAt = new Map<string, number>();

  down(actionId: string): void {
    this.downAt.set(actionId, Date.now());
  }

  /** Call on key-up; returns true if the press that just ended was a long press. */
  up(actionId: string): boolean {
    const start = this.downAt.get(actionId);
    this.downAt.delete(actionId);
    return start !== undefined && Date.now() - start >= LONG_PRESS_MS;
  }
}
