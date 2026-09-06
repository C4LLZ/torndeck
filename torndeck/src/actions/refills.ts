import streamDeck, { action, KeyAction } from "@elgato/streamdeck";
import { PollingAction } from "../lib/polling-action";
import { BlinkController } from "../lib/blink";
import { fetchTornRefills, TornApiError, TornRefillType } from "../torn/api";
import { getApiKey } from "../torn/settings";
import { renderRefillSvg } from "../torn/render-refills";

type RefillsSettings = {
  refillType?: TornRefillType;
  refreshSeconds?: number;
};

function typeOf(settings: RefillsSettings): TornRefillType {
  return settings.refillType ?? "energy";
}

/** Shows whether today's free energy/nerve refill has been used, flashing while it's still available. */
@action({ UUID: "com.callz.torndeck.refills" })
export class Refills extends PollingAction<RefillsSettings> {
  protected readonly defaultRefreshSeconds = 120;
  protected readonly minRefreshSeconds = 60;

  private readonly blink = new BlinkController();

  protected override onStop(actionId: string): void {
    this.blink.stop(actionId);
  }

  protected override async onKeyPress(action: KeyAction<RefillsSettings>, settings: RefillsSettings): Promise<void> {
    if (this.blink.isActive(action.id)) {
      this.blink.acknowledge(action);
      return;
    }
    await this.refresh(action, settings, true);
  }

  protected override async refresh(action: KeyAction<RefillsSettings>, settings: RefillsSettings, manual: boolean): Promise<void> {
    const apiKey = await getApiKey();
    if (!apiKey) {
      await action.setTitle("No API key");
      return;
    }

    const type = typeOf(settings);

    try {
      const refills = await fetchTornRefills(apiKey);
      await action.setTitle("");
      const used = refills[type];

      if (!used) {
        this.blink.set(action, renderRefillSvg(type, false, false), renderRefillSvg(type, false, true));
      } else {
        this.blink.reset(action.id);
        await action.setImage(renderRefillSvg(type, true, false));
      }

      if (manual) await action.showOk();
    } catch (err) {
      streamDeck.logger.error("Failed to refresh Torn refills:", err);
      await action.setTitle(err instanceof TornApiError ? err.message : "Fetch failed");
      if (manual) await action.showAlert();
    }
  }
}
