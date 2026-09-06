import streamDeck, { action, KeyAction } from "@elgato/streamdeck";
import { flashEnabledOf, PollingAction } from "../lib/polling-action";
import { BlinkController } from "../lib/blink";
import { fetchTornStats, TornApiError, TornBar } from "../torn/api";
import { getApiKey } from "../torn/settings";
import { renderStatsSvg } from "../torn/render";

type StatsSettings = {
  showEnergy?:      boolean;
  showNerve?:       boolean;
  showHappy?:       boolean;
  showLife?:        boolean;
  showNumbers?:     boolean;
  refreshSeconds?:  number;
  alertEnergyFull?: boolean;
  alertNerveFull?:  boolean;
  alertHappyFull?:  boolean;
  alertLifeFull?:   boolean;
  flashEnabled?:    boolean;
  longPressUrl?:    string;
};

/**
 * True only exactly at the bar's normal cap - not above it. Torn lets you stack a bar (e.g.
 * energy) past its usual maximum for things like a ranked war, and that's deliberate, so the
 * "you're full, go spend it" alert should stop once you've pushed past 100%, not keep flashing.
 */
function isFull(bar: TornBar): boolean {
  return bar.maximum > 0 && bar.current === bar.maximum;
}

@action({ UUID: "com.callz.torndeck.statsindicator" })
export class StatsIndicator extends PollingAction<StatsSettings> {
  protected readonly defaultRefreshSeconds = 60;
  protected readonly minRefreshSeconds = 30;

  private readonly blink = new BlinkController();

  protected override onStop(actionId: string): void {
    this.blink.stop(actionId);
  }

  protected override async onKeyPress(action: KeyAction<StatsSettings>, settings: StatsSettings): Promise<void> {
    if (this.blink.isActive(action.id)) {
      this.blink.acknowledge(action);
      return;
    }
    await this.refresh(action, settings, true);
  }

  protected override async refresh(action: KeyAction<StatsSettings>, settings: StatsSettings, manual: boolean): Promise<void> {
    const apiKey = await getApiKey();
    if (!apiKey) {
      await action.setTitle("No API key");
      return;
    }

    try {
      const stats = await fetchTornStats(apiKey);
      await action.setTitle("");

      const alertActive =
        ((settings.alertEnergyFull ?? true) && isFull(stats.energy)) ||
        ((settings.alertNerveFull ?? true) && isFull(stats.nerve)) ||
        ((settings.alertHappyFull ?? false) && isFull(stats.happy)) ||
        ((settings.alertLifeFull ?? false) && isFull(stats.life));

      if (alertActive) {
        this.blink.set(action, renderStatsSvg(stats, settings, false), renderStatsSvg(stats, settings, true), flashEnabledOf(settings));
      } else {
        this.blink.reset(action.id);
        await action.setImage(renderStatsSvg(stats, settings, false));
      }

      if (manual) await action.showOk();
    } catch (err) {
      streamDeck.logger.error("Failed to refresh Torn stats:", err);
      await action.setTitle(err instanceof TornApiError ? err.message : "Fetch failed");
      if (manual) await action.showAlert();
    }
  }
}
