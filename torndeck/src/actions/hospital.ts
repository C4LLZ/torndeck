import streamDeck, { action, KeyAction } from "@elgato/streamdeck";
import { flashEnabledOf, PollingAction } from "../lib/polling-action";
import { BlinkController } from "../lib/blink";
import { fetchTornStatus, TornApiError } from "../torn/api";
import { getApiKey } from "../torn/settings";
import { nowSeconds } from "../torn/clock";
import { renderHospitalActiveSvg, renderHospitalIdleSvg } from "../torn/render-hospital";

type HospitalSettings = {
  /** Start flashing once this many minutes are left before release. */
  flashThresholdMinutes?: number;
  flashEnabled?: boolean;
  longPressUrl?: string;
};

const DEFAULT_FLASH_THRESHOLD_MINUTES = 5;
const MIN_FLASH_THRESHOLD_MINUTES = 1;

/** Live hospital release countdown, flashing once it's close to release. */
@action({ UUID: "com.callz.torndeck.hospital" })
export class Hospital extends PollingAction<HospitalSettings> {
  protected readonly defaultRefreshSeconds = 60;
  protected readonly minRefreshSeconds = 30;

  /** Epoch seconds of release, per instance; absent means not currently hospitalized. */
  private readonly states = new Map<string, number | undefined>();
  private readonly ticks = new Map<string, ReturnType<typeof setInterval>>();
  private readonly blink = new BlinkController();

  protected override onStop(actionId: string): void {
    const tick = this.ticks.get(actionId);
    if (tick) clearInterval(tick);
    this.ticks.delete(actionId);
    this.blink.stop(actionId);
    this.states.delete(actionId);
  }

  protected override async onKeyPress(action: KeyAction<HospitalSettings>, settings: HospitalSettings): Promise<void> {
    if (this.blink.isActive(action.id)) {
      this.blink.acknowledge(action);
      return;
    }
    await this.refresh(action, settings, true);
  }

  protected override async refresh(action: KeyAction<HospitalSettings>, settings: HospitalSettings, manual: boolean): Promise<void> {
    const apiKey = await getApiKey();
    if (!apiKey) {
      await action.setTitle("No API key");
      return;
    }

    try {
      const status = await fetchTornStatus(apiKey);
      await action.setTitle("");

      if (status.state === "Hospital" && status.until > nowSeconds()) {
        this.states.set(action.id, status.until);
        this.ensureTicking(action, settings);
      } else {
        this.stopTicking(action.id);
        this.states.set(action.id, undefined);
        this.blink.reset(action.id);
        await action.setImage(renderHospitalIdleSvg());
      }

      if (manual) await action.showOk();
    } catch (err) {
      streamDeck.logger.error("Failed to refresh Torn hospital status:", err);
      await action.setTitle(err instanceof TornApiError ? err.message : "Fetch failed");
      if (manual) await action.showAlert();
    }
  }

  private ensureTicking(action: KeyAction<HospitalSettings>, settings: HospitalSettings): void {
    if (this.ticks.has(action.id)) return;
    const timer = setInterval(() => this.tick(action, settings), 1000);
    this.ticks.set(action.id, timer);
    this.tick(action, settings);
  }

  private stopTicking(actionId: string): void {
    const timer = this.ticks.get(actionId);
    if (timer) {
      clearInterval(timer);
      this.ticks.delete(actionId);
    }
  }

  private tick(action: KeyAction<HospitalSettings>, settings: HospitalSettings): void {
    const until = this.states.get(action.id);
    if (until === undefined) return;

    const remaining = until - nowSeconds();
    if (remaining <= 0) {
      this.stopTicking(action.id);
      this.states.set(action.id, undefined);
      this.blink.reset(action.id);
      void action.setImage(renderHospitalIdleSvg());
      return;
    }

    const thresholdSeconds = Math.max(MIN_FLASH_THRESHOLD_MINUTES, settings.flashThresholdMinutes ?? DEFAULT_FLASH_THRESHOLD_MINUTES) * 60;
    if (remaining <= thresholdSeconds) {
      this.blink.set(action, renderHospitalActiveSvg(remaining, false), renderHospitalActiveSvg(remaining, true), flashEnabledOf(settings));
    } else {
      this.blink.reset(action.id);
      void action.setImage(renderHospitalActiveSvg(remaining, false));
    }
  }
}
