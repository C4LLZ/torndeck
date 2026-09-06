import streamDeck, {
  DidReceiveSettingsEvent,
  JsonObject,
  KeyAction,
  KeyDownEvent,
  KeyUpEvent,
  SingletonAction,
  WillAppearEvent,
  WillDisappearEvent
} from "@elgato/streamdeck";
import { LongPressTracker } from "./long-press";
import { openTorn } from "./torn-link";

interface Instance<TSettings extends JsonObject> {
  action: KeyAction<TSettings>;
  settings: TSettings;
  timer?: ReturnType<typeof setInterval>;
}

/**
 * Base class for actions that periodically fetch data (using the shared global Torn API key) and
 * render it onto the key. Handles per-instance poll timers, keyed by action id so multiple keys
 * using the same action refresh independently, and re-polls every live instance whenever the
 * global settings (i.e. the API key) change in the property inspector.
 */
export abstract class PollingAction<TSettings extends JsonObject> extends SingletonAction<TSettings> {
  private readonly instances = new Map<string, Instance<TSettings>>();
  private readonly longPress = new LongPressTracker();

  protected abstract readonly defaultRefreshSeconds: number;
  protected abstract readonly minRefreshSeconds: number;

  /** Fetches fresh data and renders it onto {@link action}. `manual` is true when triggered by a key press. */
  protected abstract refresh(action: KeyAction<TSettings>, settings: TSettings, manual: boolean): Promise<void>;

  /** Reads the configured refresh interval (in seconds) from an instance's settings. */
  protected getRefreshSeconds(settings: TSettings): number {
    const raw = (settings as { refreshSeconds?: number }).refreshSeconds;
    return Math.max(this.minRefreshSeconds, raw ?? this.defaultRefreshSeconds);
  }

  /** Called when an instance stops appearing, for subclasses to release any additional per-instance state. */
  protected onStop(_actionId: string): void {}

  /** Called on key press; defaults to a manual refresh. Subclasses may override, e.g. to acknowledge an alert instead. */
  protected async onKeyPress(action: KeyAction<TSettings>, settings: TSettings): Promise<void> {
    await this.refresh(action, settings, true);
  }

  constructor() {
    super();
    streamDeck.settings.onDidReceiveGlobalSettings(() => {
      for (const { action, settings } of this.instances.values()) {
        void this.refresh(action, settings, false);
      }
    });
  }

  override onWillAppear(ev: WillAppearEvent<TSettings>): void {
    if (!ev.action.isKey()) return;
    this.start(ev.action, ev.payload.settings);
  }

  override onWillDisappear(ev: WillDisappearEvent<TSettings>): void {
    this.stop(ev.action.id);
  }

  override onDidReceiveSettings(ev: DidReceiveSettingsEvent<TSettings>): void {
    if (!ev.action.isKey()) return;
    this.start(ev.action, ev.payload.settings);
  }

  override onKeyDown(ev: KeyDownEvent<TSettings>): void {
    this.longPress.down(ev.action.id);
  }

  override async onKeyUp(ev: KeyUpEvent<TSettings>): Promise<void> {
    const instance = this.instances.get(ev.action.id);
    if (instance) instance.settings = ev.payload.settings;

    if (this.longPress.up(ev.action.id)) {
      openTorn();
      return;
    }
    await this.onKeyPress(ev.action, ev.payload.settings);
  }

  private start(action: KeyAction<TSettings>, settings: TSettings): void {
    this.stop(action.id);

    void this.refresh(action, settings, false);
    const timer = setInterval(() => void this.refresh(action, settings, false), this.getRefreshSeconds(settings) * 1000);
    this.instances.set(action.id, { action, settings, timer });
  }

  private stop(id: string): void {
    const instance = this.instances.get(id);
    if (instance?.timer) clearInterval(instance.timer);
    this.instances.delete(id);
    this.onStop(id);
  }
}
