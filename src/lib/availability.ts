// src/lib/availability.ts

/**
 * Configuration for booking availability.
 * Times are interpreted in the user's local timezone.
 */
export type AvailabilityConfig = {
  /** First hour (0–23) included in the bookable window. */
  startHour: number;
  /**
   * Business-day boundary hour (0–23).
   * The END of any slot must be <= endHour:00.
   * Example: startHour=10, endHour=17, step=60 -> last start is 16:00 (16–17).
   */
  endHour: number;
  /** Slot step in minutes (>= 15). */
  stepMins: number;
  /** Weekdays closed (0=Sun … 6=Sat). */
  closedWeekdays: number[];
  /** ISO dates (YYYY-MM-DD) that are not bookable. */
  blackoutDates: string[];
  /** How many days ahead can be booked. */
  maxDaysAhead: number;
};

/** Sensible defaults used across the site. */
export const defaultAvailability: Readonly<AvailabilityConfig> = {
  startHour: 10,
  endHour: 17,          // boundary: slots must end by 17:00
  stepMins: 60,         // one-hour slots
  closedWeekdays: [],   // e.g. [0] to close Sundays
  blackoutDates: [],    // e.g. ['2025-09-05','2025-09-12']
  maxDaysAhead: 60,
} as const;

/**
 * Merge user overrides with defaults and sanitize the result.
 * - clamps hours to 0–23
 * - ensures startHour <= endHour
 * - enforces stepMins >= 15
 * - dedupes/sanitizes arrays
 */
export function normalizeAvailability(
  overrides?: Partial<AvailabilityConfig>
): AvailabilityConfig {
  const cfg: AvailabilityConfig = {
    ...defaultAvailability,
    ...(overrides || {}),
  };

  const clampHour = (h: number) => Math.min(23, Math.max(0, Math.floor(h)));

  cfg.startHour = clampHour(cfg.startHour);
  cfg.endHour = clampHour(cfg.endHour);
  if (cfg.endHour < cfg.startHour) {
    const t = cfg.startHour;
    cfg.startHour = cfg.endHour;
    cfg.endHour = t;
  }

  cfg.stepMins = Math.max(15, Math.floor(cfg.stepMins || 60));
  cfg.maxDaysAhead = Math.max(1, Math.floor(cfg.maxDaysAhead || 30));

  const isIso = (s: string) => /^\d{4}-\d{2}-\d{2}$/.test(s);
  cfg.blackoutDates = Array.from(new Set((cfg.blackoutDates || []).filter(isIso)));
  cfg.closedWeekdays = Array.from(
    new Set((cfg.closedWeekdays || []).map((n) => Math.min(6, Math.max(0, Math.floor(n)))))
  );

  return cfg;
}

/** Helper: ISO date (YYYY-MM-DD) closed by weekday/blackout rules? */
export function isClosedIsoDate(isoDate: string, cfg: AvailabilityConfig): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(isoDate)) return true;
  if (cfg.blackoutDates.includes(isoDate)) return true;
  const [y, m, d] = isoDate.split('-').map(Number);
  const wd = new Date(y, m - 1, d).getDay(); // 0–6
  return cfg.closedWeekdays.includes(wd);
}

/** Internal helpers */
const pad = (n: number) => String(n).padStart(2, '0');
const fmtHM = (h: number, m: number) => `${pad(h)}:${pad(m)}`;
const addMinutes = (h: number, m: number, add: number) => {
  const total = h * 60 + m + add;
  return { h: Math.floor(total / 60), m: total % 60 };
};
const to12 = (h: number, m = 0) => {
  const period = h < 12 ? 'am' : 'pm';
  const hour12 = ((h + 11) % 12) + 1;
  const min = m ? `:${pad(m)}` : '';
  return { hour12, min, period };
};
const humanRange = (sh: number, sm: number, eh: number, em: number) => {
  const endIsNoon = eh === 12 && em === 0;
  const s = to12(sh, sm);
  const e = to12(eh, em);
  const endSuffix = endIsNoon ? 'noon' : e.period;
  return `${s.hour12}${s.min}–${e.hour12}${e.min} ${endSuffix}`;
};

/**
 * List start times ("HH:MM") for a given ISO date.
 * Only returns slots whose END <= endHour:00.
 * Past slots for "today" are NOT filtered here. Do it in UI if needed.
 */
export function listSlotsForIsoDate(isoDate: string, cfg: AvailabilityConfig): string[] {
  if (isClosedIsoDate(isoDate, cfg)) return [];
  const out: string[] = [];
  for (let h = cfg.startHour; h < cfg.endHour; h++) {
    for (let m = 0; m < 60; m += cfg.stepMins) {
      const end = addMinutes(h, m, cfg.stepMins);
      if (end.h > cfg.endHour || (end.h === cfg.endHour && end.m > 0)) continue;
      out.push(fmtHM(h, m));
    }
  }
  return out;
}

/**
 * List slot objects with both machine start and human label.
 * Label format: "10–11am", "11–12 noon", "1:30–2:30pm", etc.
 */
export function listSlotObjectsForIsoDate(
  isoDate: string,
  cfg: AvailabilityConfig
): { start: string; label: string }[] {
  if (isClosedIsoDate(isoDate, cfg)) return [];
  const out: { start: string; label: string }[] = [];
  for (let h = cfg.startHour; h < cfg.endHour; h++) {
    for (let m = 0; m < 60; m += cfg.stepMins) {
      const end = addMinutes(h, m, cfg.stepMins);
      if (end.h > cfg.endHour || (end.h === cfg.endHour && end.m > 0)) continue;
      out.push({
        start: fmtHM(h, m),
        label: humanRange(h, m, end.h, end.m),
      });
    }
  }
  return out;
}

/**
 * Next N open ISO dates from a given start date (inclusive).
 * Respects closedWeekdays/blackoutDates and maxDaysAhead.
 */
export function nextOpenIsoDates(
  startIso: string,
  count: number,
  cfg: AvailabilityConfig
): string[] {
  const out: string[] = [];
  const [y, m, d] = startIso.split('-').map(Number);
  const start = new Date(y, m - 1, d);
  for (let i = 0; i <= cfg.maxDaysAhead && out.length < count; i++) {
    const dt = new Date(start.getFullYear(), start.getMonth(), start.getDate() + i);
    const iso = `${dt.getFullYear()}-${pad(dt.getMonth() + 1)}-${pad(dt.getDate())}`;
    if (!isClosedIsoDate(iso, cfg) && listSlotsForIsoDate(iso, cfg).length > 0) {
      out.push(iso);
    }
  }
  return out;
}
