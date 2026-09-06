/**
 * Real Torn.com sidebar icons (as SVG path data), reused here so the plugin's stat glyphs match
 * the icons players already associate with each stat: Gym for Energy, Crimes for Nerve, Hospital
 * for Life, and the Travel Agency paper-plane for the flight tracker.
 */
export interface TornIcon {
  viewBox: string;
  /** Unfilled inner markup (path/polygon/etc) - colored via a wrapping <g fill="...">. */
  markup: string;
}

export const GYM_ICON: TornIcon = {
  viewBox: "7 13 20 10",
  markup:
    '<g transform="translate(705 179)"><path d="M-684.417-157.933v-6.233A1.833,1.833,0,0,1-682.583-166a1.833,1.833,0,0,1,1.833,1.833v6.233a1.833,1.833,0,0,1-1.833,1.833A1.833,1.833,0,0,1-684.417-157.933Zm-10.833,0v-6.233A1.833,1.833,0,0,1-693.417-166a1.833,1.833,0,0,1,1.833,1.833v6.233a1.833,1.833,0,0,1-1.833,1.833A1.833,1.833,0,0,1-695.25-157.933Zm15.417-5.367a.917.917,0,0,1,.917.916v2.667a.917.917,0,0,1-.917.917Zm-17.25,3.583v.017a.917.917,0,0,1-.917-.917v-.867a.917.917,0,0,1,.917-.916v.016a.917.917,0,0,1,.917-.916v4.5A.917.917,0,0,1-697.083-159.717Zm18.167-2.683a.916.916,0,0,1,.916.916v.867a.917.917,0,0,1-.916.917Zm-11.75,2.7v-2.7h5.33v2.7Z"/></g>'
};

export const CRIMES_ICON: TornIcon = {
  viewBox: "-.5 0 19 19",
  markup:
    '<path d="M7.1,14.807a17.239,17.239,0,0,1-3.868,1.818.681.681,0,0,1-.544-.051.622.622,0,0,1-.32-.6.632.632,0,0,1,.433-.532c3.471-1.147,6.436-3.3,7.79-6.437A2.057,2.057,0,0,0,8.509,6.118,2.315,2.315,0,0,0,6.326,7.585c-.8,1.856-2.815,3.327-5.515,4.078A.634.634,0,0,1,0,11.077a.645.645,0,0,1,.478-.631C2.788,9.8,4.486,8.6,5.132,7.1a3.723,3.723,0,0,1,6.427-.7,3.127,3.127,0,0,1,.228,3.1A11.081,11.081,0,0,1,9.843,12.5a13.4,13.4,0,0,1-2.74,2.3Zm-6.07-.446c3.47-.819,6.784-2.725,8.163-5.92a.625.625,0,0,0-.346-.826A.653.653,0,0,0,8,7.953C6.945,10.405,4.271,12.3.749,13.13a.632.632,0,1,0,.284,1.231Zm15.565.916a.6.6,0,0,0,.208-.564.611.611,0,0,0-.388-.464,3.485,3.485,0,0,1-1.719-1.18,3.9,3.9,0,0,1-.086-2.759c.278-1.543.626-3.463-.759-5.4A6.209,6.209,0,0,0,9.415,2.419,6.74,6.74,0,0,0,4.191,4.1,6.745,6.745,0,0,0,2.905,5.781,3.642,3.642,0,0,1,.593,7.75a.626.626,0,0,0-.436.529.632.632,0,0,0,.831.669A4.808,4.808,0,0,0,4.023,6.415a5.593,5.593,0,0,1,1.05-1.388,5.424,5.424,0,0,1,4.2-1.354A4.911,4.911,0,0,1,12.79,5.629c1.079,1.511.808,3.011.547,4.462a4.869,4.869,0,0,0,.263,3.645,4.573,4.573,0,0,0,2.268,1.656.725.725,0,0,0,.73-.115Zm-8.8.91c-.3.169-.665.378-1.144.615a.629.629,0,0,0-.348.664.648.648,0,0,0,.922.467c.316-.156.586-.3.821-.431.933-.517,1.021-.526,1.9.109l.35.244a.671.671,0,0,0,.481.1.639.639,0,0,0,.523-.487.625.625,0,0,0-.268-.654c-.376-.252-.653-.467-.862-.631-.867-.673-1.157-.693-2.378,0ZM1.155,4.912a.575.575,0,0,0,.808-.156l.388-.562A7.564,7.564,0,0,1,9.673,1.338c2.886.37,5.257,1.978,6.037,4.1a8.112,8.112,0,0,1,.2,4.615c-.189,1.053-.353,1.963.22,2.692a2.267,2.267,0,0,0,1.021.7A.623.623,0,0,0,18,12.87a.672.672,0,0,0-.427-.619.989.989,0,0,1-.415-.274c-.229-.29-.115-.916.027-1.707a9.3,9.3,0,0,0-.255-5.26C15.985,2.45,13.2.518,9.842.088A10.9,10.9,0,0,0,8.473,0,8.8,8.8,0,0,0,1.921,2.7,4.67,4.67,0,0,0,.976,4.079a.6.6,0,0,0,.178.832Zm10.633,8.809a.658.658,0,0,0-.883-.236.621.621,0,0,0-.243.859,7.059,7.059,0,0,0,2.767,2.562.667.667,0,0,0,.61.018h0a.619.619,0,0,0,.034-1.107,5.819,5.819,0,0,1-2.286-2.1Z"/>'
};

export const HOSPITAL_ICON: TornIcon = {
  viewBox: "0 1 16 16",
  markup: '<polygon points="6 1 6 7 0 7 0 11 6 11 6 17 10 17 10 11 16 11 16 7 10 7 10 1 6 1"/>'
};

export const PERSONAL_STATS_ICON: TornIcon = {
  viewBox: "585.6 178 46 46",
  markup: '<path d="M600,208h-4v-4h4Zm6,0h-4v-8h4Zm6,0h-4V195h4Zm6,0h-4V189h4Zm1,2H595v2h24Z"/>'
};

export const PLANE_ICON: TornIcon = {
  viewBox: "173 194 34 34",
  markup:
    '<path d="M197.2,204.052a1.3,1.3,0,0,0-.971.35l-3.138,2.649a1.278,1.278,0,0,1-1.163.2l-.75-.288a.516.516,0,0,1-.254-.809l.533-.778a.231.231,0,0,0-.023-.334.893.893,0,0,0-.8-.153,1.282,1.282,0,0,0-.392.277l-.546.591a1.378,1.378,0,0,1-1.138.376l-1.28-.239c-.372-.069-.51-.346-.307-.618l.366-.492a.593.593,0,0,0,.143-.42c-.03-.249-.5-.416-.785-.344a2.47,2.47,0,0,0-.945.712l-.114.13a1.636,1.636,0,0,1-1.136.49l-1.076-.039c-.379-.014-.848-.161-1.075-.142a.366.366,0,0,0-.31.241.667.667,0,0,0-.024.383c.059.207.522.427.855.607,1.463.8,4.613,2.457,5.937,3.153a.441.441,0,0,1,.094.773l-3.778,3.346a1.469,1.469,0,0,1-1.178.292l-.391-.1a2.18,2.18,0,0,0-.966-.1,1.247,1.247,0,0,0-.577.68c-.078.323.459.718.809.861a3.48,3.48,0,0,1,1.239.683,4.124,4.124,0,0,1,.8,1.369c.13.354.35.889.621.846a.85.85,0,0,0,.425-.24l.216-.237a1.22,1.22,0,0,0,.056-.9l-.06-.246a1.191,1.191,0,0,1,.367-1.1l4.313-3.553a.488.488,0,0,1,.8.191l2.716,6.232c.151.346.693.81.812.452a2.656,2.656,0,0,0,0-1.129s-.029-.274-.064-.611a1.325,1.325,0,0,1,.469-1.038l.879-.705a1.108,1.108,0,0,0,.355-.525c.1-.341-.172-.8-.394-.769a5.158,5.158,0,0,0-.926.4c-.3.141-.568-.051-.594-.428l-.046-.685a1.263,1.263,0,0,1,.533-1.046l.228-.144a2.337,2.337,0,0,0,.912-.96v0a.718.718,0,0,0-.511-.827,4.868,4.868,0,0,0-1.126.256.563.563,0,0,1-.722-.509l-.035-.346a1.542,1.542,0,0,1,.436-1.142l2.724-2.5a2.361,2.361,0,0,0,.736-1.1,1.342,1.342,0,0,0,.013-.146A.884.884,0,0,0,197.2,204.052Z"/>'
};

/**
 * Fits `icon` centered at (cx, cy), preserving its native aspect ratio within a `maxSize` box.
 * Uses a single `<g transform>` rather than a nested `<svg>` - Stream Deck's SVG renderer (fed via
 * setImage) doesn't render nested `<svg>` elements, so that approach silently produced no image at all.
 */
export function tornIconSvg(icon: TornIcon, cx: number, cy: number, maxSize: number, color: string): string {
  const [minX, minY, vw, vh] = icon.viewBox.split(" ").map(Number);
  const scale = maxSize / Math.max(vw, vh);
  const targetX = cx - (vw * scale) / 2;
  const targetY = cy - (vh * scale) / 2;
  const tx = targetX - minX * scale;
  const ty = targetY - minY * scale;
  return `<g transform="translate(${tx.toFixed(2)},${ty.toFixed(2)}) scale(${scale.toFixed(4)})" fill="${color}">${icon.markup}</g>`;
}

/** No real Torn nav icon maps to "Happy" - a simple hand-drawn smiley, matching the others' style. */
export function happyIconSvg(cx: number, cy: number, size: number, color: string): string {
  const r = size / 2;
  return `
    <g fill="none" stroke="${color}" stroke-width="${size * 0.11}" stroke-linecap="round">
      <circle cx="${cx}" cy="${cy}" r="${r}"/>
      <path d="M ${cx - r * 0.55} ${cy + r * 0.15} Q ${cx} ${cy + r * 0.7} ${cx + r * 0.55} ${cy + r * 0.15}"/>
    </g>
    <g fill="${color}">
      <circle cx="${cx - r * 0.42}" cy="${cy - r * 0.2}" r="${size * 0.07}"/>
      <circle cx="${cx + r * 0.42}" cy="${cy - r * 0.2}" r="${size * 0.07}"/>
    </g>`;
}

/** No real Torn nav icon maps to "Drug" - a simple pill capsule outline, matching the others' style. */
export function drugIconSvg(cx: number, cy: number, size: number, color: string): string {
  const w = size * 0.85;
  const h = size * 0.4;
  const r = h / 2;
  return `<rect x="${cx - w / 2}" y="${cy - h / 2}" width="${w}" height="${h}" rx="${r}" fill="none" stroke="${color}" stroke-width="${size * 0.14}" transform="rotate(-45 ${cx} ${cy})"/>`;
}

/** No real Torn nav icon maps to "Booster" - a simple upward arrow, matching the others' style. */
export function boosterIconSvg(cx: number, cy: number, size: number, color: string): string {
  const h = size * 0.7;
  const w = size * 0.5;
  return `
    <g fill="none" stroke="${color}" stroke-width="${size * 0.14}" stroke-linecap="round" stroke-linejoin="round">
      <path d="M ${cx} ${cy + h / 2} L ${cx} ${cy - h / 2}"/>
      <path d="M ${cx - w / 2} ${cy - h / 2 + w * 0.55} L ${cx} ${cy - h / 2} L ${cx + w / 2} ${cy - h / 2 + w * 0.55}"/>
    </g>`;
}

/** No real Torn nav icon maps to "Chain" either - two interlocking links, matching the others' style. */
export function chainIconSvg(cx: number, cy: number, size: number, color: string): string {
  const rx = size * 0.24;
  const ry = size * 0.34;
  const strokeW = size * 0.14;
  const offset = size * 0.19;
  return `
    <g fill="none" stroke="${color}" stroke-width="${strokeW}">
      <rect x="${cx - offset - rx}" y="${cy - ry}" width="${rx * 2}" height="${ry * 2}" rx="${rx}"
        transform="rotate(-25 ${cx - offset} ${cy})"/>
      <rect x="${cx + offset - rx}" y="${cy - ry}" width="${rx * 2}" height="${ry * 2}" rx="${rx}"
        transform="rotate(-25 ${cx + offset} ${cy})"/>
    </g>`;
}
