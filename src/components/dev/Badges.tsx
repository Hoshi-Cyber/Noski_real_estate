// src/components/dev/Badges.tsx
// Maps a Development entry → UI-ready badges.
// Variants: 'cta' | 'neutral' | 'warn'

import type {
  DevelopmentEntry,
  DevelopmentNew,
  DevelopmentUnfinished,
} from '../../content/config';

export type BadgeVariant = 'cta' | 'neutral' | 'warn';

export type BadgeItem = {
  key: string;
  label: string;
  variant: BadgeVariant;
};

/** Public API: return badges for a development card/detail */
export function getBadges(dev: DevelopmentEntry): BadgeItem[] {
  return isNew(dev) ? badgesForNew(dev) : badgesForUnfinished(dev);
}

/** Optional helper for rendering classes in UI components */
export function badgeClass(v: BadgeVariant): string {
  if (v === 'cta') return 'badge-cta';
  if (v === 'warn') return 'badge-warn';
  return 'badge';
}

/* ----------------------- internal ----------------------- */

function isNew(d: DevelopmentEntry): d is DevelopmentNew {
  return d.category === 'new_development';
}

function monthYear(d?: Date | null): string | null {
  if (!d) return null;
  try {
    return d.toLocaleDateString(undefined, { month: 'short', year: 'numeric' });
  } catch {
    return null;
  }
}

function hasCta(dev: DevelopmentEntry, contains: string): boolean {
  return (dev.ctas || []).some((c) =>
    (c.label || '').toLowerCase().includes(contains.toLowerCase())
  );
}

function badgesForNew(dev: DevelopmentNew): BadgeItem[] {
  const out: BadgeItem[] = [];

  // Always show Off-plan for new developments
  out.push({ key: 'offplan', label: 'Off-plan', variant: 'neutral' });

  if (dev.phase) {
    out.push({ key: `phase:${dev.phase}`, label: dev.phase, variant: 'neutral' });
  }

  const eta = monthYear(dev.expected_completion_date);
  if (eta) {
    out.push({ key: `eta:${eta}`, label: `Completion ${eta}`, variant: 'neutral' });
  }

  if ((dev.payment_plan || []).length > 0) {
    out.push({ key: 'payment-plan', label: 'Payment Plan', variant: 'cta' });
  }

  if ((dev.approvals || []).length > 0) {
    out.push({
      key: `approvals:${dev.approvals.length}`,
      label: `Approvals ×${dev.approvals.length}`,
      variant: 'neutral',
    });
  }

  if (hasCta(dev, 'show house') || hasCta(dev, 'site visit')) {
    out.push({ key: 'show-house', label: 'Show House Open', variant: 'cta' });
  }

  return dedupe(out);
}

function badgesForUnfinished(dev: DevelopmentUnfinished): BadgeItem[] {
  const out: BadgeItem[] = [];

  if (typeof dev.completion_percent === 'number') {
    out.push({
      key: `pct:${dev.completion_percent}`,
      label: `${Math.round(dev.completion_percent)}% Complete`,
      variant: 'neutral',
    });
  }

  if (dev.completion_stage) {
    out.push({
      key: `stage:${dev.completion_stage}`,
      label: dev.completion_stage,
      variant: 'neutral',
    });
  }

  if (typeof dev.est_completion_cost_min === 'number' || typeof dev.est_completion_cost_max === 'number') {
    const min = toMoney(dev.est_completion_cost_min);
    const max = toMoney(dev.est_completion_cost_max);
    const label =
      min && max ? `Finish Cost ${min}–${max}` :
      min ? `Finish Cost ≥ ${min}` :
      max ? `Finish Cost ≤ ${max}` :
      '';
    if (label) out.push({ key: `cost:${label}`, label, variant: 'neutral' });
  }

  if (dev.boq_url) {
    out.push({ key: 'boq', label: 'BOQ Available', variant: 'cta' });
  }

  if (dev.structural_report_url) {
    out.push({ key: 'eng-report', label: 'Engineer Report', variant: 'cta' });
  }

  if (dev.permits_status) {
    const s = dev.permits_status.toLowerCase();
    if (s.includes('pending') || s.includes('none') || s.includes('missing')) {
      out.push({ key: 'permits-pending', label: 'Permits Pending', variant: 'warn' });
    } else if (s.includes('approved')) {
      out.push({ key: 'permits-ok', label: 'Permits Approved', variant: 'neutral' });
    } else {
      out.push({ key: `permits:${s}`, label: dev.permits_status, variant: 'neutral' });
    }
  }

  if (dev.risk_notes) {
    out.push({ key: 'risk', label: 'Risk Review', variant: 'warn' });
  }

  return dedupe(out);
}

function dedupe(items: BadgeItem[]): BadgeItem[] {
  const seen = new Set<string>();
  const out: BadgeItem[] = [];
  for (const b of items) {
    const sig = `${b.variant}|${b.label}`;
    if (!seen.has(sig)) {
      seen.add(sig);
      out.push(b);
    }
  }
  return out;
}

function toMoney(n?: number): string | null {
  if (typeof n !== 'number' || !isFinite(n)) return null;
  try {
    return new Intl.NumberFormat(undefined, { style: 'currency', currency: 'KES', maximumFractionDigits: 0 }).format(n);
  } catch {
    // Fallback without currency if Intl fails in some environments
    return new Intl.NumberFormat(undefined, { maximumFractionDigits: 0 }).format(n);
  }
}
