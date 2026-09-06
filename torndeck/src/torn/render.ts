import type { TornStats } from "./api";
import { CRIMES_ICON, GYM_ICON, happyIconSvg, HOSPITAL_ICON, tornIconSvg, TornIcon } from "./icons";
import { svgDataUri } from "../lib/format";

export interface BarVisibility {
  showEnergy?: boolean;
  showNerve?: boolean;
  showHappy?: boolean;
  showLife?: boolean;
  /** Shows the current value above each bar, e.g. "150". */
  showNumbers?: boolean;
}

/** Shortens large values so they fit a narrow bar column, e.g. 4400 -> "4.4k". */
function formatCompact(n: number): string {
  if (n >= 10000) return `${Math.round(n / 1000)}k`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return String(n);
}

const CARD_BG = "#1c1e24";
const TRACK_BG = "#33353d";
const LABEL_COLOR = "#9a9ca5";
const BADGE_COLOR = "#ff3b30";

const BAR_DEFS: { key: keyof Pick<TornStats, "energy" | "nerve" | "happy" | "life">; icon: TornIcon | null; color: string; visKey: keyof BarVisibility }[] = [
  { key: "energy", icon: GYM_ICON, color: "#8bc34a", visKey: "showEnergy" },
  { key: "nerve", icon: CRIMES_ICON, color: "#ff9800", visKey: "showNerve" },
  { key: "happy", icon: null, color: "#ffd700", visKey: "showHappy" },
  { key: "life", icon: HOSPITAL_ICON, color: "#4a90d9", visKey: "showLife" },
];

const SIZE = 144;

/**
 * Renders the current Torn stats (bars + unread notification count) as an SVG string, suitable
 * for passing directly to {@link import("@elgato/streamdeck").KeyAction.setImage}. When `flash` is
 * set the card renders as a bright "alert" frame, for use as the second frame of a blink. Each bar
 * is labelled with the real Torn sidebar icon players already associate with that stat (Gym for
 * Energy, Crimes for Nerve, Hospital for Life); Happy has no natural equivalent so keeps a simple
 * hand-drawn smiley.
 */
export function renderStatsSvg(stats: TornStats, visibility: BarVisibility, flash = false): string {
  const active = BAR_DEFS.filter((b) => visibility[b.visKey] ?? true);
  const pad = 14;
  const barGap = 8;
  const trackTop = 54;
  const iconAreaH = 18;
  const trackH = SIZE - trackTop - pad - iconAreaH;
  const cardBg = flash ? "#fff59d" : CARD_BG;
  const iconColor = flash ? "#1c1e24" : LABEL_COLOR;

  let bars = "";
  if (active.length > 0) {
    const barW = (SIZE - pad * 2 - barGap * (active.length - 1)) / active.length;
    bars = active
      .map((def, i) => {
        const bar = stats[def.key];
        const pct = bar.maximum > 0 ? Math.min(1, Math.max(0, bar.current / bar.maximum)) : 0;
        const x = pad + i * (barW + barGap);
        // Capped rather than barW / 2 - with fewer bars active they get much wider, and an
        // uncapped radius turned the whole track into a circle/blob instead of a bar.
        const trackRadius = Math.min(barW / 2, 12);
        const fillRadius = Math.min(barW / 2, 7);
        // Fill height has a floor of 2x its own (smaller) corner radius, just enough to keep a
        // rounded cap - not barW, which forced even near-empty bars into a full circle.
        const fillH = Math.max(Math.round(trackH * pct), fillRadius * 2);
        const y = trackTop + trackH - fillH;
        const fillColor = flash ? "#1c1e24" : def.color;
        const iconCx = x + barW / 2;
        const iconCy = trackTop + trackH + iconAreaH / 2 + 1;
        const icon = def.icon
          ? tornIconSvg(def.icon, iconCx, iconCy, iconAreaH - 2, iconColor)
          : happyIconSvg(iconCx, iconCy, iconAreaH - 2, iconColor);
        const number = visibility.showNumbers
          ? `<text x="${x + barW / 2}" y="${trackTop - 8}" font-size="11" font-family="Arial, sans-serif" font-weight="bold" fill="${flash ? "#1c1e24" : "#ffffff"}" text-anchor="middle">${formatCompact(bar.current)}</text>`
          : "";
        return `
          ${number}
          <rect x="${x}" y="${trackTop}" width="${barW}" height="${trackH}" rx="${trackRadius}" fill="${flash ? "#ffffff88" : TRACK_BG}"/>
          <rect x="${x}" y="${y}" width="${barW}" height="${fillH}" rx="${fillRadius}" fill="${fillColor}"/>
          ${icon}
        `;
      })
      .join("");
  }

  const totalNotifs =
    stats.notifications.events + stats.notifications.messages + stats.notifications.awards + stats.notifications.competition;
  const badge =
    totalNotifs > 0
      ? `
        <circle cx="${SIZE - 20}" cy="20" r="16" fill="${BADGE_COLOR}" stroke="${cardBg}" stroke-width="3"/>
        <text x="${SIZE - 20}" y="25" font-size="15" font-family="Arial, sans-serif" font-weight="bold" fill="#ffffff" text-anchor="middle">${totalNotifs > 99 ? "99+" : totalNotifs}</text>
      `
      : "";

  return svgDataUri(`
<svg xmlns="http://www.w3.org/2000/svg" width="${SIZE}" height="${SIZE}" viewBox="0 0 ${SIZE} ${SIZE}">
  <rect width="${SIZE}" height="${SIZE}" rx="18" fill="${cardBg}"/>
  ${bars}
  ${badge}
</svg>`.trim());
}
