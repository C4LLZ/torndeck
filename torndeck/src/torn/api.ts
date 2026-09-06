import { cached } from "./cache";

export interface TornBar {
  current: number;
  maximum: number;
  /** Seconds until this bar is next full; 0 when already full. */
  fulltime: number;
}

export interface TornNotifications {
  events: number;
  messages: number;
  awards: number;
  competition: number;
}

export interface TornStats {
  energy: TornBar;
  nerve: TornBar;
  happy: TornBar;
  life: TornBar;
  notifications: TornNotifications;
}

export interface TornChain {
  current: number;
  maximum: number;
  modifier: number;
  /** Seconds until the chain drops without a hit; 0 when no chain is active. */
  timeout: number;
}

export type TornStatusState = "Abroad" | "Fallen" | "Federal" | "Hospital" | "Jail" | "Okay" | "Traveling" | string;

export interface TornStatus {
  state: TornStatusState;
  description: string;
  /** Epoch seconds this status ends (e.g. hospital release time); 0 when not applicable. */
  until: number;
}

export type TornCooldownType = "drug" | "booster" | "medical";

export type TornCooldowns = Record<TornCooldownType, number>;

export type TornRefillType = "energy" | "nerve";

export type TornRefills = Record<TornRefillType, boolean>;

export type TornTravelMethod = "Airstrip" | "Business" | "Private" | "Standard";

export interface TornTravel {
  destination: string;
  method: TornTravelMethod | string;
  /** Epoch seconds the trip started. */
  departed: number;
  /** Epoch seconds of arrival. */
  timestamp: number;
  /** Seconds left until landing; 0 when not currently travelling. */
  timeLeft: number;
}

/** Thrown when the Torn API itself returns an `{ error: { code, error } }` payload. */
export class TornApiError extends Error {
  constructor(public readonly code: number, message: string) {
    super(message);
    this.name = "TornApiError";
  }
}

interface RawErrorResponse {
  error?: {
    code: number;
    error?: string;
  };
}

async function fetchTornSelections<T extends RawErrorResponse>(apiKey: string, selections: string): Promise<T> {
  const url = `https://api.torn.com/user/?selections=${selections}&key=${encodeURIComponent(apiKey)}`;
  const res = await fetch(url);

  if (!res.ok) {
    throw new Error(`Torn API HTTP ${res.status}`);
  }

  const d = (await res.json()) as T;

  if (d.error) {
    throw new TornApiError(d.error.code, d.error.error ?? `Torn API error ${d.error.code}`);
  }

  return d;
}

/**
 * Caches a Torn API call for `ttlMs`, keyed by API key + selections, so multiple actions asking
 * for the same (or an overlapping) selection set within that window share one real HTTP request.
 */
function fetchTornSelectionsCached<T extends RawErrorResponse>(apiKey: string, selections: string, ttlMs: number): Promise<T> {
  return cached(`${apiKey}:${selections}`, ttlMs, () => fetchTornSelections<T>(apiKey, selections));
}

/** Shared TTL for the combined bars+notifications call - just under Chain's fastest refresh cadence, so Chain's own poll drives the real fetch and Stats/Notifications piggyback on it. */
const BARS_NOTIFICATIONS_TTL_MS = 15_000;
const TRAVEL_TTL_MS = 15_000;
const BASIC_TTL_MS = 25_000;
const COOLDOWNS_TTL_MS = 15_000;
const REFILLS_TTL_MS = 55_000;

interface RawBar {
  current?: number;
  maximum?: number;
  fulltime?: number;
}

interface RawChain {
  current?: number;
  maximum?: number;
  modifier?: number;
  timeout?: number;
}

interface RawBarsNotificationsResponse extends RawErrorResponse {
  energy?: RawBar;
  nerve?: RawBar;
  happy?: RawBar;
  life?: RawBar;
  chain?: RawChain;
  notifications?: {
    events?: number;
    messages?: number;
    awards?: number;
    competition?: number;
  };
}

function toBar(raw: RawBar | undefined): TornBar {
  return {
    current: raw?.current ?? 0,
    maximum: raw?.maximum ?? 0,
    fulltime: raw?.fulltime ?? 0,
  };
}

function toNotifications(raw: RawBarsNotificationsResponse["notifications"]): TornNotifications {
  return {
    events: raw?.events ?? 0,
    messages: raw?.messages ?? 0,
    awards: raw?.awards ?? 0,
    competition: raw?.competition ?? 0,
  };
}

/** Fetches (or reuses a still-fresh cached copy of) the combined bars+notifications selections - the shared source for Stats, Chain, and Notifications. */
function fetchBarsAndNotifications(apiKey: string): Promise<RawBarsNotificationsResponse> {
  return fetchTornSelectionsCached<RawBarsNotificationsResponse>(apiKey, "bars,notifications", BARS_NOTIFICATIONS_TTL_MS);
}

export async function fetchTornStats(apiKey: string): Promise<TornStats> {
  const d = await fetchBarsAndNotifications(apiKey);

  return {
    energy: toBar(d.energy),
    nerve: toBar(d.nerve),
    happy: toBar(d.happy),
    life: toBar(d.life),
    notifications: toNotifications(d.notifications),
  };
}

export async function fetchTornNotifications(apiKey: string): Promise<TornNotifications> {
  const d = await fetchBarsAndNotifications(apiKey);
  return toNotifications(d.notifications);
}

export async function fetchTornChain(apiKey: string): Promise<TornChain> {
  const d = await fetchBarsAndNotifications(apiKey);
  return {
    current: d.chain?.current ?? 0,
    maximum: d.chain?.maximum ?? 0,
    modifier: d.chain?.modifier ?? 0,
    timeout: d.chain?.timeout ?? 0,
  };
}

interface RawBasicResponse extends RawErrorResponse {
  status?: {
    state?: string;
    description?: string;
    until?: number;
  };
}

export async function fetchTornStatus(apiKey: string): Promise<TornStatus> {
  const d = await fetchTornSelectionsCached<RawBasicResponse>(apiKey, "basic", BASIC_TTL_MS);
  return {
    state: (d.status?.state as TornStatusState) ?? "Okay",
    description: d.status?.description ?? "",
    until: d.status?.until ?? 0,
  };
}

interface RawTravelResponse extends RawErrorResponse {
  travel?: {
    destination?: string;
    method?: string;
    departed?: number;
    timestamp?: number;
    time_left?: number;
  };
}

interface RawCooldownsResponse extends RawErrorResponse {
  cooldowns?: {
    drug?: number;
    booster?: number;
    medical?: number;
  };
}

export async function fetchTornCooldowns(apiKey: string): Promise<TornCooldowns> {
  const d = await fetchTornSelectionsCached<RawCooldownsResponse>(apiKey, "cooldowns", COOLDOWNS_TTL_MS);
  return {
    drug: d.cooldowns?.drug ?? 0,
    booster: d.cooldowns?.booster ?? 0,
    medical: d.cooldowns?.medical ?? 0,
  };
}

interface RawRefillsResponse extends RawErrorResponse {
  refills?: {
    energy_refill_used?: boolean;
    nerve_refill_used?: boolean;
  };
}

export async function fetchTornRefills(apiKey: string): Promise<TornRefills> {
  const d = await fetchTornSelectionsCached<RawRefillsResponse>(apiKey, "refills", REFILLS_TTL_MS);
  return {
    energy: d.refills?.energy_refill_used ?? false,
    nerve: d.refills?.nerve_refill_used ?? false,
  };
}

export async function fetchTornTravel(apiKey: string): Promise<TornTravel> {
  const d = await fetchTornSelectionsCached<RawTravelResponse>(apiKey, "travel", TRAVEL_TTL_MS);
  const t = d.travel;

  return {
    destination: t?.destination ?? "Torn",
    method: t?.method ?? "Standard",
    departed: t?.departed ?? 0,
    timestamp: t?.timestamp ?? 0,
    timeLeft: t?.time_left ?? 0,
  };
}
