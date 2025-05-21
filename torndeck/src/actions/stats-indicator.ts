import {
  action,
  WillAppearEvent,
  KeyUpEvent,
  DidReceiveSettingsEvent,
  SingletonAction
} from "@elgato/streamdeck";
import { fetchTornStats, TornStats } from "../torn/api";

type StatsSettings = {
  apiKey?:     string;
  showEnergy?: boolean;
  showNerve?:  boolean;
};

@action({ UUID: "com.callz.torndeck.statsindicator" })
export class StatsIndicator extends SingletonAction<StatsSettings> {
  override async onWillAppear(ev: WillAppearEvent<StatsSettings>) {
    await ev.action.setTitle("Loading…");
    await this.update(ev.payload.settings, ev.action);
  }

  override async onKeyUp(ev: KeyUpEvent<StatsSettings>) {
    await ev.action.setTitle("Loading…");
    await this.update(ev.payload.settings, ev.action);
  }

  override async onDidReceiveSettings(
    ev: DidReceiveSettingsEvent<StatsSettings>
  ) {
    await ev.action.setTitle("Loading…");
    await this.update(ev.payload.settings, ev.action);
  }

  private async update(
    settings: StatsSettings,
    actionInstance: typeof this["action"]
  ) {
    const { apiKey, showEnergy = true, showNerve = true } = settings;

    if (!apiKey) {
      await actionInstance.setTitle("No API key");
      return;
    }

    try {
      const stats: TornStats = await fetchTornStats(apiKey);
      const parts: string[] = [];
      if (showEnergy) parts.push(`⚡${stats.energy}`);
      if (showNerve)  parts.push(`🧠${stats.nerve}`);
      await actionInstance.setTitle(parts.join(" | "));
    } catch (err) {
      console.error("Fetch error:", err);
      await actionInstance.setTitle("Error");
    }
  }
}
