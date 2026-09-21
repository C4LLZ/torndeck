import { action, KeyAction } from "@elgato/streamdeck";
import { PollingAction } from "../lib/polling-action";
import { nowSeconds } from "../torn/clock";
import { renderTctSvg } from "../torn/render-tct";

type TctSettings = {
  longPressUrl?: string;
};

/** Torn City Time clock. No API calls - just the (server-synced) clock, redrawn every second. */
@action({ UUID: "com.callz.torndeck.tct" })
export class Tct extends PollingAction<TctSettings> {
  protected readonly defaultRefreshSeconds = 1;
  protected readonly minRefreshSeconds = 1;

  protected override async refresh(action: KeyAction<TctSettings>): Promise<void> {
    await action.setImage(renderTctSvg(nowSeconds()));
  }
}
