import streamDeck, { action, KeyAction } from "@elgato/streamdeck";
import { PollingAction } from "../lib/polling-action";
import { BlinkController } from "../lib/blink";
import { fetchTornTravel, TornApiError } from "../torn/api";
import { getApiKey } from "../torn/settings";
import { isAbroad, renderFlightAbroadSvg, renderFlightIdleSvg, renderFlightLandedSvg, renderFlightProgressSvg } from "../torn/render-flight";

type FlightSettings = {
  refreshSeconds?: number;
};

interface FlightState {
  destination: string;
  departed: number;
  arrival: number;
  landed: boolean;
}

@action({ UUID: "com.callz.torndeck.flightstatus" })
export class FlightStatus extends PollingAction<FlightSettings> {
  protected readonly defaultRefreshSeconds = 30;
  protected readonly minRefreshSeconds = 20;

  /** In-flight state per action instance; absent/undefined means "on the ground". */
  private readonly states = new Map<string, FlightState | undefined>();
  private readonly ticks = new Map<string, ReturnType<typeof setInterval>>();
  private readonly blink = new BlinkController();

  protected override onStop(actionId: string): void {
    const tick = this.ticks.get(actionId);
    if (tick) clearInterval(tick);
    this.ticks.delete(actionId);
    this.blink.stop(actionId);
    this.states.delete(actionId);
  }

  protected override async onKeyPress(action: KeyAction<FlightSettings>, settings: FlightSettings): Promise<void> {
    const state = this.states.get(action.id);
    if (state?.landed) {
      this.blink.acknowledge(action);
      this.states.set(action.id, undefined);
      await action.setImage(isAbroad(state.destination) ? renderFlightAbroadSvg(state.destination) : renderFlightIdleSvg());
      return;
    }
    await this.refresh(action, settings, true);
  }

  protected override async refresh(action: KeyAction<FlightSettings>, _settings: FlightSettings, manual: boolean): Promise<void> {
    const apiKey = await getApiKey();
    if (!apiKey) {
      await action.setTitle("No API key");
      return;
    }

    try {
      const travel = await fetchTornTravel(apiKey);
      await action.setTitle("");

      if (travel.timeLeft > 0) {
        this.states.set(action.id, {
          destination: travel.destination,
          departed: travel.departed,
          arrival: travel.timestamp,
          landed: false,
        });
        this.blink.reset(action.id);
        this.ensureTicking(action);
      } else if (!this.states.get(action.id)?.landed) {
        // Not travelling per the API, and we're not already sitting in an unacknowledged "landed" blink.
        this.states.set(action.id, undefined);
        await action.setImage(isAbroad(travel.destination) ? renderFlightAbroadSvg(travel.destination) : renderFlightIdleSvg());
      }

      if (manual) await action.showOk();
    } catch (err) {
      streamDeck.logger.error("Failed to refresh Torn travel status:", err);
      await action.setTitle(err instanceof TornApiError ? err.message : "Fetch failed");
      if (manual) await action.showAlert();
    }
  }

  private ensureTicking(action: KeyAction<FlightSettings>): void {
    if (this.ticks.has(action.id)) return;
    const timer = setInterval(() => this.tick(action), 1000);
    this.ticks.set(action.id, timer);
    this.tick(action);
  }

  private tick(action: KeyAction<FlightSettings>): void {
    const state = this.states.get(action.id);
    if (!state || state.landed) return;

    const remaining = state.arrival - Date.now() / 1000;
    if (remaining <= 0) {
      state.landed = true;
      const timer = this.ticks.get(action.id);
      if (timer) clearInterval(timer);
      this.ticks.delete(action.id);
      this.blink.set(action, renderFlightLandedSvg(state.destination, false), renderFlightLandedSvg(state.destination, true));
      return;
    }

    void action.setImage(renderFlightProgressSvg({ destination: state.destination, departed: state.departed, arrival: state.arrival }));
  }
}
