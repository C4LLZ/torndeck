import streamDeck, { LogLevel } from "@elgato/streamdeck";
import { StatsIndicator } from "./actions/stats-indicator";
import { FlightStatus } from "./actions/flight-status";
import { Notifications } from "./actions/notifications";
import { Chain } from "./actions/chain";
import { Hospital } from "./actions/hospital";
import { Cooldowns } from "./actions/cooldowns";
import { Refills } from "./actions/refills";

streamDeck.logger.setLevel(LogLevel.TRACE);

streamDeck.actions.registerAction(new StatsIndicator());
streamDeck.actions.registerAction(new FlightStatus());
streamDeck.actions.registerAction(new Notifications());
streamDeck.actions.registerAction(new Chain());
streamDeck.actions.registerAction(new Hospital());
streamDeck.actions.registerAction(new Cooldowns());
streamDeck.actions.registerAction(new Refills());

streamDeck.connect();
