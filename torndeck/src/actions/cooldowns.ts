import streamDeck, { action, KeyAction } from "@elgato/streamdeck";
import { flashEnabledOf, PollingAction } from "../lib/polling-action";
import { BlinkController } from "../lib/blink";
import { fetchTornCooldowns, fetchTornStatus, TornApiError, TornCooldownType } from "../torn/api";
import { getApiKey } from "../torn/settings";
import { nowSeconds } from "../torn/clock";
import { CombinedRowKey, renderAllCooldownsSvg, renderCooldownSvg } from "../torn/render-cooldowns";

type CooldownsSettings = {
  cooldownType?: TornCooldownType | "all";
  showDrug?: boolean;
  showBooster?: boolean;
  showMedical?: boolean;
  showHospital?: boolean;
  flashEnabled?: boolean;
  longPressUrl?: string;
};

type Deadlines = Record<CombinedRowKey, number>;

const TYPES: CombinedRowKey[] = ["drug", "booster", "medical", "hospital"];

/** Rows shown on the combined key: drug/booster/medical default on, hospital default off. */
function rowsOf(settings: CooldownsSettings): CombinedRowKey[] {
  const on = { drug: settings.showDrug ?? true, booster: settings.showBooster ?? true, medical: settings.showMedical ?? true, hospital: settings.showHospital ?? false };
  const rows = TYPES.filter((t) => on[t]);
  return rows.length ? rows : ["drug"];
}

/** Live countdown for one of Torn's drug/booster/medical cooldowns (or all three on one key), flashing once ready. */
@action({ UUID: "com.callz.torndeck.cooldowns" })
export class Cooldowns extends PollingAction<CooldownsSettings> {
  protected readonly defaultRefreshSeconds = 30;
  protected readonly minRefreshSeconds = 20;

  /** Epoch seconds each cooldown ends, per instance; 0 means not running (ready, no local tick needed). */
  private readonly states = new Map<string, Deadlines>();
  private readonly ticks = new Map<string, ReturnType<typeof setInterval>>();
  private readonly blink = new BlinkController();

  protected override onStop(actionId: string): void {
    this.stopTicking(actionId);
    this.blink.stop(actionId);
    this.states.delete(actionId);
  }

  protected override async onKeyPress(action: KeyAction<CooldownsSettings>, settings: CooldownsSettings): Promise<void> {
    if (this.blink.isActive(action.id)) {
      this.blink.acknowledge(action);
      return;
    }
    await this.refresh(action, settings, true);
  }

  protected override async refresh(action: KeyAction<CooldownsSettings>, settings: CooldownsSettings, manual: boolean): Promise<void> {
    const apiKey = await getApiKey();
    if (!apiKey) {
      await action.setTitle("No API key");
      return;
    }

    try {
      const [cooldowns, status] = await Promise.all([fetchTornCooldowns(apiKey), fetchTornStatus(apiKey)]);
      await action.setTitle("");

      const prev = this.states.get(action.id);
      const secs: Record<CombinedRowKey, number> = { ...cooldowns, hospital: status.state === "Hospital" ? Math.max(0, status.until - nowSeconds()) : 0 };
      const next = Object.fromEntries(TYPES.map((t) => [t, secs[t] > 0 ? nowSeconds() + secs[t] : 0])) as Deadlines;
      this.states.set(action.id, next);

      if (settings.cooldownType === "all") {
        // A cooldown starting again re-arms the alert that a previous ack suppressed.
        const rows = rowsOf(settings);
        if (rows.some((t) => next[t] > 0 && !prev?.[t])) this.blink.reset(action.id);
        if (rows.some((t) => next[t] > 0)) this.ensureTicking(action, settings);
        else this.stopTicking(action.id);
        this.showAll(action, settings, false);
      } else {
        const type = settings.cooldownType ?? "drug";
        if (next[type] > 0) {
          this.blink.reset(action.id);
          this.ensureTicking(action, settings);
        } else {
          this.stopTicking(action.id);
          this.blink.set(action, renderCooldownSvg(type, 0, false), renderCooldownSvg(type, 0, true), flashEnabledOf(settings));
        }
      }

      if (manual) await action.showOk();
    } catch (err) {
      streamDeck.logger.error("Failed to refresh Torn cooldowns:", err);
      await action.setTitle(err instanceof TornApiError ? err.message : "Fetch failed");
      if (manual) await action.showAlert();
    }
  }

  private ensureTicking(action: KeyAction<CooldownsSettings>, settings: CooldownsSettings): void {
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

  /** Renders the all-cooldowns key; `alert` (a cooldown just hit zero) starts/updates the blink. */
  private showAll(action: KeyAction<CooldownsSettings>, settings: CooldownsSettings, alert: boolean): void {
    const deadlines = this.states.get(action.id);
    if (!deadlines) return;
    const rows = rowsOf(settings).map((key) => ({ key, remaining: Math.max(0, deadlines[key] - nowSeconds()) }));

    if (alert || this.blink.isActive(action.id)) {
      this.blink.set(action, renderAllCooldownsSvg(rows, false), renderAllCooldownsSvg(rows, true), flashEnabledOf(settings));
    } else {
      void action.setImage(renderAllCooldownsSvg(rows, false));
    }
  }

  private tick(action: KeyAction<CooldownsSettings>, settings: CooldownsSettings): void {
    const deadlines = this.states.get(action.id);
    if (!deadlines) return;

    if (settings.cooldownType === "all") {
      let crossed = false;
      const rows = rowsOf(settings);
      for (const t of rows) {
        if (deadlines[t] > 0 && deadlines[t] <= nowSeconds()) {
          deadlines[t] = 0;
          crossed = true;
        }
      }
      if (!rows.some((t) => deadlines[t] > 0)) this.stopTicking(action.id);
      this.showAll(action, settings, crossed);
      return;
    }

    const type = settings.cooldownType ?? "drug";
    const remaining = deadlines[type] - nowSeconds();
    if (deadlines[type] === 0 || remaining <= 0) {
      this.stopTicking(action.id);
      deadlines[type] = 0;
      this.blink.set(action, renderCooldownSvg(type, 0, false), renderCooldownSvg(type, 0, true), flashEnabledOf(settings));
      return;
    }

    void action.setImage(renderCooldownSvg(type, remaining, false));
  }
}
