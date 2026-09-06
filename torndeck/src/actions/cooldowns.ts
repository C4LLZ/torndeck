import streamDeck, { action, KeyAction } from "@elgato/streamdeck";
import { PollingAction } from "../lib/polling-action";
import { BlinkController } from "../lib/blink";
import { fetchTornCooldowns, TornApiError, TornCooldownType } from "../torn/api";
import { getApiKey } from "../torn/settings";
import { renderCooldownSvg } from "../torn/render-cooldowns";

type CooldownsSettings = {
  cooldownType?: TornCooldownType;
  refreshSeconds?: number;
};

function typeOf(settings: CooldownsSettings): TornCooldownType {
  return settings.cooldownType ?? "drug";
}

/** Live countdown for one of Torn's drug/booster/medical cooldowns, flashing once it hits zero. */
@action({ UUID: "com.callz.torndeck.cooldowns" })
export class Cooldowns extends PollingAction<CooldownsSettings> {
  protected readonly defaultRefreshSeconds = 30;
  protected readonly minRefreshSeconds = 20;

  /** Epoch seconds the cooldown ends, per instance; absent means already ready (no local tick needed). */
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

    const type = typeOf(settings);

    try {
      const cooldowns = await fetchTornCooldowns(apiKey);
      await action.setTitle("");
      const seconds = cooldowns[type];

      if (seconds > 0) {
        this.states.set(action.id, Date.now() / 1000 + seconds);
        this.blink.reset(action.id);
        this.ensureTicking(action, type);
      } else {
        this.stopTicking(action.id);
        this.states.set(action.id, undefined);
        this.blink.set(action, renderCooldownSvg(type, 0, false), renderCooldownSvg(type, 0, true));
      }

      if (manual) await action.showOk();
    } catch (err) {
      streamDeck.logger.error("Failed to refresh Torn cooldowns:", err);
      await action.setTitle(err instanceof TornApiError ? err.message : "Fetch failed");
      if (manual) await action.showAlert();
    }
  }

  private ensureTicking(action: KeyAction<CooldownsSettings>, type: TornCooldownType): void {
    if (this.ticks.has(action.id)) return;
    const timer = setInterval(() => this.tick(action, type), 1000);
    this.ticks.set(action.id, timer);
    this.tick(action, type);
  }

  private stopTicking(actionId: string): void {
    const timer = this.ticks.get(actionId);
    if (timer) {
      clearInterval(timer);
      this.ticks.delete(actionId);
    }
  }

  private tick(action: KeyAction<CooldownsSettings>, type: TornCooldownType): void {
    const deadline = this.states.get(action.id);
    if (deadline === undefined) return;

    const remaining = deadline - Date.now() / 1000;
    if (remaining <= 0) {
      this.stopTicking(action.id);
      this.states.set(action.id, undefined);
      this.blink.set(action, renderCooldownSvg(type, 0, false), renderCooldownSvg(type, 0, true));
      return;
    }

    void action.setImage(renderCooldownSvg(type, remaining, false));
  }
}
