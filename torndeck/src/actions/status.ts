import streamDeck, { action, KeyAction } from "@elgato/streamdeck";
import { flashEnabledOf, PollingAction } from "../lib/polling-action";
import { BlinkController } from "../lib/blink";
import { fetchTornStatus, fetchTornTravel, TornApiError } from "../torn/api";
import { getApiKey } from "../torn/settings";
import { nowSeconds } from "../torn/clock";
import { isAbroad, renderFlightAbroadSvg, renderFlightLandedSvg, renderFlightProgressSvg } from "../torn/render-flight";
import { renderStatusStaticSvg, renderTimerSvg, TimerKind } from "../torn/render-status";
import { withTct } from "../torn/render-tct";

type StatusSettings = {
  /** Start flashing once this many minutes are left in hospital/jail. */
  flashThresholdMinutes?: number;
  /** Show a small TCT time along the top of every status card. */
  showTct?: boolean;
  flashEnabled?: boolean;
  longPressUrl?: string;
};

type Mode =
  | { kind: "flight"; destination: string; departed: number; arrival: number; landed: boolean }
  | { kind: "static"; render: () => string }
  | { kind: TimerKind; until: number; country?: string };

const DEFAULT_FLASH_THRESHOLD_MINUTES = 5;

/** One key for your current Torn status: flying, hospital, jail, abroad, okay, etc. */
@action({ UUID: "com.callz.torndeck.status" })
export class Status extends PollingAction<StatusSettings> {
  protected readonly defaultRefreshSeconds = 30;
  protected readonly minRefreshSeconds = 20;

  private readonly modes = new Map<string, Mode>();
  private readonly ticks = new Map<string, ReturnType<typeof setInterval>>();
  private readonly blink = new BlinkController();

  /** Adds the small TCT time to a rendered card when the user has that option on. */
  private img(settings: StatusSettings, uri: string, flash = false): string {
    return settings.showTct ? withTct(uri, nowSeconds(), flash) : uri;
  }

  protected override onStop(actionId: string): void {
    this.stopTicking(actionId);
    this.blink.stop(actionId);
    this.modes.delete(actionId);
  }

  protected override async onKeyPress(action: KeyAction<StatusSettings>, settings: StatusSettings): Promise<void> {
    const mode = this.modes.get(action.id);
    if (mode?.kind === "flight" && mode.landed) {
      this.blink.acknowledge(action);
      this.modes.delete(action.id);
    } else if (this.blink.isActive(action.id)) {
      this.blink.acknowledge(action);
      return;
    }
    await this.refresh(action, settings, true);
  }

  protected override async refresh(action: KeyAction<StatusSettings>, settings: StatusSettings, manual: boolean): Promise<void> {
    const apiKey = await getApiKey();
    if (!apiKey) {
      await action.setTitle("No API key");
      return;
    }

    try {
      const [status, travel] = await Promise.all([fetchTornStatus(apiKey), fetchTornTravel(apiKey)]);
      await action.setTitle("");
      const current = this.modes.get(action.id);
      const abroad = isAbroad(travel.destination);

      if (travel.timeLeft > 0) {
        this.modes.set(action.id, { kind: "flight", destination: travel.destination, departed: travel.departed, arrival: travel.timestamp, landed: false });
        this.blink.reset(action.id);
        this.ensureTicking(action, settings);
      } else if (current?.kind === "flight" && current.landed) {
        // Sitting in an unacknowledged "landed" blink - leave it until the key is pressed.
      } else if ((status.state === "Hospital" || status.state === "Jail") && status.until > nowSeconds()) {
        const kind: TimerKind = status.state === "Hospital" ? "hospital" : "jail";
        this.modes.set(action.id, { kind, until: status.until, country: abroad ? travel.destination : undefined });
        this.ensureTicking(action, settings);
      } else {
        this.stopTicking(action.id);
        this.modes.delete(action.id);
        this.blink.reset(action.id);
        const state = status.state === "Hospital" || status.state === "Jail" ? "Okay" : status.state;
        const render = () => (state === "Abroad" ? renderFlightAbroadSvg(travel.destination) : renderStatusStaticSvg(state));
        if (settings.showTct) {
          // Static cards only need a per-second tick so the TCT minute stays current.
          this.modes.set(action.id, { kind: "static", render });
          this.ensureTicking(action, settings);
        } else {
          await action.setImage(render());
        }
      }

      if (manual) await action.showOk();
    } catch (err) {
      streamDeck.logger.error("Failed to refresh Torn status:", err);
      await action.setTitle(err instanceof TornApiError ? err.message : "Fetch failed");
      if (manual) await action.showAlert();
    }
  }

  private ensureTicking(action: KeyAction<StatusSettings>, settings: StatusSettings): void {
    if (this.ticks.has(action.id)) return;
    this.ticks.set(action.id, setInterval(() => this.tick(action, settings), 1000));
    this.tick(action, settings);
  }

  private stopTicking(actionId: string): void {
    const timer = this.ticks.get(actionId);
    if (timer) clearInterval(timer);
    this.ticks.delete(actionId);
  }

  private tick(action: KeyAction<StatusSettings>, settings: StatusSettings): void {
    const mode = this.modes.get(action.id);
    if (!mode) return;

    if (mode.kind === "static") {
      void action.setImage(this.img(settings, mode.render()));
      return;
    }

    if (mode.kind === "flight") {
      if (mode.landed) return;
      if (mode.arrival - nowSeconds() <= 0) {
        mode.landed = true;
        this.stopTicking(action.id);
        this.blink.set(action, this.img(settings, renderFlightLandedSvg(mode.destination, false)), this.img(settings, renderFlightLandedSvg(mode.destination, true), true), flashEnabledOf(settings));
        return;
      }
      void action.setImage(this.img(settings, renderFlightProgressSvg({ destination: mode.destination, departed: mode.departed, arrival: mode.arrival })));
      return;
    }

    const remaining = mode.until - nowSeconds();
    if (remaining <= 0) {
      this.stopTicking(action.id);
      this.modes.delete(action.id);
      this.blink.reset(action.id);
      void this.refresh(action, settings, false);
      return;
    }

    const threshold = Math.max(1, settings.flashThresholdMinutes ?? DEFAULT_FLASH_THRESHOLD_MINUTES) * 60;
    if (remaining <= threshold) {
      this.blink.set(action, this.img(settings, renderTimerSvg(mode.kind, remaining, false, mode.country)), this.img(settings, renderTimerSvg(mode.kind, remaining, true, mode.country), true), flashEnabledOf(settings));
    } else {
      this.blink.reset(action.id);
      void action.setImage(this.img(settings, renderTimerSvg(mode.kind, remaining, false, mode.country)));
    }
  }
}
