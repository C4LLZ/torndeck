import type { KeyAction } from "@elgato/streamdeck";

const BLINK_INTERVAL_MS = 600;

interface BlinkEntry {
  normal: string;
  flash: string;
  toggle: boolean;
  timer: ReturnType<typeof setInterval>;
}

/**
 * Drives a "blink until acknowledged" indicator on one or more action instances: once armed via
 * {@link set}, the key alternates between two rendered frames every {@link BLINK_INTERVAL_MS} until
 * {@link acknowledge} is called (e.g. the user presses the key). While blinking, {@link set} can be
 * called again on every poll to feed in freshly rendered frames without interrupting the blink or
 * losing the acknowledgement state.
 */
export class BlinkController {
  private readonly entries = new Map<string, BlinkEntry>();
  private readonly acknowledged = new Set<string>();

  isActive(id: string): boolean {
    return this.entries.has(id);
  }

  /**
   * Arms (or updates) the blink for this action instance, showing `normalFrame` steadily instead
   * when `flashEnabled` is false (the user's "don't flash" setting) or once acknowledged.
   */
  set(action: KeyAction<any>, normalFrame: string, flashFrame: string, flashEnabled = true): void {
    const id = action.id;

    if (!flashEnabled) {
      this.stop(id);
      void action.setImage(normalFrame);
      return;
    }

    const existing = this.entries.get(id);
    if (existing) {
      existing.normal = normalFrame;
      existing.flash = flashFrame;
      return;
    }

    if (this.acknowledged.has(id)) {
      void action.setImage(normalFrame);
      return;
    }

    const entry: BlinkEntry = {
      normal: normalFrame,
      flash: flashFrame,
      toggle: false,
      timer: setInterval(() => {
        entry.toggle = !entry.toggle;
        void action.setImage(entry.toggle ? entry.flash : entry.normal);
      }, BLINK_INTERVAL_MS),
    };
    this.entries.set(id, entry);
    void action.setImage(normalFrame);
  }

  /** Stops blinking and suppresses it until {@link reset} is called (typically once the condition clears). */
  acknowledge(action: KeyAction<any>): void {
    const id = action.id;
    const entry = this.entries.get(id);
    if (entry) void action.setImage(entry.normal);
    this.stop(id);
    this.acknowledged.add(id);
  }

  /** Clears the acknowledged flag so the next {@link set} call can blink again. */
  reset(id: string): void {
    this.acknowledged.delete(id);
    this.stop(id);
  }

  stop(id: string): void {
    const entry = this.entries.get(id);
    if (entry) {
      clearInterval(entry.timer);
      this.entries.delete(id);
    }
  }
}
