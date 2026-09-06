import streamDeck, { action, KeyAction } from "@elgato/streamdeck";
import { flashEnabledOf, PollingAction } from "../lib/polling-action";
import { BlinkController } from "../lib/blink";
import { fetchTornChain, TornApiError } from "../torn/api";
import { getApiKey } from "../torn/settings";
import { renderChainActiveSvg, renderChainIdleSvg } from "../torn/render-chain";

type ChainSettings = {
  refreshSeconds?: number;
  /** Start flashing once this many seconds are left before the chain drops. */
  flashThresholdSeconds?: number;
  flashEnabled?: boolean;
  longPressUrl?: string;
};

interface ChainState {
  current: number;
  /** Epoch seconds the chain drops without a hit. */
  deadline: number;
}

const DEFAULT_FLASH_THRESHOLD = 60;
const MIN_FLASH_THRESHOLD = 5;

/** Live chain hit-count + countdown, flashing once it's close to dropping. */
@action({ UUID: "com.callz.torndeck.chain" })
export class Chain extends PollingAction<ChainSettings> {
  protected readonly defaultRefreshSeconds = 20;
  protected readonly minRefreshSeconds = 15;

  private readonly states = new Map<string, ChainState | undefined>();
  private readonly ticks = new Map<string, ReturnType<typeof setInterval>>();
  private readonly blink = new BlinkController();

  protected override onStop(actionId: string): void {
    const tick = this.ticks.get(actionId);
    if (tick) clearInterval(tick);
    this.ticks.delete(actionId);
    this.blink.stop(actionId);
    this.states.delete(actionId);
  }

  protected override async onKeyPress(action: KeyAction<ChainSettings>, settings: ChainSettings): Promise<void> {
    if (this.blink.isActive(action.id)) {
      this.blink.acknowledge(action);
      return;
    }
    await this.refresh(action, settings, true);
  }

  protected override async refresh(action: KeyAction<ChainSettings>, settings: ChainSettings, manual: boolean): Promise<void> {
    const apiKey = await getApiKey();
    if (!apiKey) {
      await action.setTitle("No API key");
      return;
    }

    try {
      const chain = await fetchTornChain(apiKey);
      await action.setTitle("");

      if (chain.current > 0 && chain.timeout > 0) {
        this.states.set(action.id, { current: chain.current, deadline: Date.now() / 1000 + chain.timeout });
        this.ensureTicking(action, settings);
      } else {
        this.stopTicking(action.id);
        this.states.set(action.id, undefined);
        this.blink.reset(action.id);
        await action.setImage(renderChainIdleSvg());
      }

      if (manual) await action.showOk();
    } catch (err) {
      streamDeck.logger.error("Failed to refresh Torn chain:", err);
      await action.setTitle(err instanceof TornApiError ? err.message : "Fetch failed");
      if (manual) await action.showAlert();
    }
  }

  private ensureTicking(action: KeyAction<ChainSettings>, settings: ChainSettings): void {
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

  private tick(action: KeyAction<ChainSettings>, settings: ChainSettings): void {
    const state = this.states.get(action.id);
    if (!state) return;

    const remaining = state.deadline - Date.now() / 1000;
    if (remaining <= 0) {
      // The chain has dropped; stop guessing locally and wait for the next sync to confirm.
      this.stopTicking(action.id);
      this.states.set(action.id, undefined);
      this.blink.reset(action.id);
      void action.setImage(renderChainIdleSvg());
      return;
    }

    const threshold = Math.max(MIN_FLASH_THRESHOLD, settings.flashThresholdSeconds ?? DEFAULT_FLASH_THRESHOLD);
    if (remaining <= threshold) {
      this.blink.set(action, renderChainActiveSvg(state.current, remaining, false), renderChainActiveSvg(state.current, remaining, true), flashEnabledOf(settings));
    } else {
      this.blink.reset(action.id);
      void action.setImage(renderChainActiveSvg(state.current, remaining, false));
    }
  }
}
