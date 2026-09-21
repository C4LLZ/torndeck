import streamDeck, { action, KeyAction } from "@elgato/streamdeck";
import { PollingAction } from "../lib/polling-action";
import { fetchTornWar, TornApiError } from "../torn/api";
import { getApiKey } from "../torn/settings";
import { renderNoWarSvg, renderWarSvg } from "../torn/render-war";

type WarSettings = {
  longPressUrl?: string;
};

/** Ranked war lead for your faction: green background when you're ahead, red when behind. */
@action({ UUID: "com.callz.torndeck.war" })
export class War extends PollingAction<WarSettings> {
  protected readonly defaultRefreshSeconds = 30;
  protected readonly minRefreshSeconds = 30;

  protected override async refresh(action: KeyAction<WarSettings>, _settings: WarSettings, manual: boolean): Promise<void> {
    const apiKey = await getApiKey();
    if (!apiKey) {
      await action.setTitle("No API key");
      return;
    }

    try {
      const war = await fetchTornWar(apiKey);
      await action.setTitle("");
      await action.setImage(war ? renderWarSvg(war) : renderNoWarSvg());
      if (manual) await action.showOk();
    } catch (err) {
      streamDeck.logger.error("Failed to refresh Torn ranked war:", err);
      await action.setTitle(err instanceof TornApiError ? err.message : "Fetch failed");
      if (manual) await action.showAlert();
    }
  }
}
