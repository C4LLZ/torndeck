import streamDeck, { action, KeyAction } from "@elgato/streamdeck";
import { PollingAction } from "../lib/polling-action";
import { BlinkController } from "../lib/blink";
import { fetchTornNotifications, TornApiError } from "../torn/api";
import { getApiKey } from "../torn/settings";
import { renderNotificationsSvg } from "../torn/render-notifications";

type NotificationsSettings = {
  refreshSeconds?: number;
};

/** Dedicated notification-only key: bell + unread count, blinking until pressed whenever anything's unread. */
@action({ UUID: "com.callz.torndeck.notifications" })
export class Notifications extends PollingAction<NotificationsSettings> {
  protected readonly defaultRefreshSeconds = 45;
  protected readonly minRefreshSeconds = 30;

  private readonly blink = new BlinkController();

  protected override onStop(actionId: string): void {
    this.blink.stop(actionId);
  }

  protected override async onKeyPress(action: KeyAction<NotificationsSettings>, settings: NotificationsSettings): Promise<void> {
    if (this.blink.isActive(action.id)) {
      this.blink.acknowledge(action);
      return;
    }
    await this.refresh(action, settings, true);
  }

  protected override async refresh(action: KeyAction<NotificationsSettings>, _settings: NotificationsSettings, manual: boolean): Promise<void> {
    const apiKey = await getApiKey();
    if (!apiKey) {
      await action.setTitle("No API key");
      return;
    }

    try {
      const notifications = await fetchTornNotifications(apiKey);
      await action.setTitle("");

      const total = notifications.events + notifications.messages + notifications.awards + notifications.competition;
      if (total > 0) {
        this.blink.set(action, renderNotificationsSvg(notifications, false), renderNotificationsSvg(notifications, true));
      } else {
        this.blink.reset(action.id);
        await action.setImage(renderNotificationsSvg(notifications, false));
      }

      if (manual) await action.showOk();
    } catch (err) {
      streamDeck.logger.error("Failed to refresh Torn notifications:", err);
      await action.setTitle(err instanceof TornApiError ? err.message : "Fetch failed");
      if (manual) await action.showAlert();
    }
  }
}
