import streamDeck, { LogLevel } from "@elgato/streamdeck";
import { IncrementCounter } from "./actions/increment-counter";
import { StatsIndicator } from "./actions/stats-indicator";


streamDeck.logger.setLevel(LogLevel.TRACE);

streamDeck.actions.registerAction(new IncrementCounter());
streamDeck.actions.registerAction(new StatsIndicator());

streamDeck.connect();
