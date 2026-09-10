// SLA analytics — static illustrative mock for the PER-TYPE modal (Iterations 3 & 4).
// Sample/prototype data lives here (CLAUDE.md rule 4: no inline mock data).
//
// Typed SLAs mean per-type analytics: First response and Resolution each get a
// compliance % + a median time.
//
// The AI split is a TICKET COHORT, not a measurement basis: "Human only" means
// an AI Agent never touched the ticket at all — so it is a different, much
// smaller SET of tickets (mostly channels where AI isn't switched on), not the
// same tickets measured with a different clock. Every metric therefore carries
// its own `measured`, and the two cohorts are NOT a like-for-like comparison.
//
// No runtime clock — every number is hand-picked demo data. Labels reference the
// real Topic custom-field options (see slaDataV3).

/** Which tickets we're looking at. `all` is the service level customers actually
 * experience; `human` is the slice AI never touched. */
export type Cohort = 'all' | 'human'

/** A metric per cohort. `measured` DIFFERS per cohort — that's the whole point. */
export type ByCohort<T> = Record<Cohort, T>

/* ── §0 headline compliance + median time, per type ───────────────────────── */

export interface TypeStat {
  overall: number // compliance 0–1
  met: number
  measured: number
  medianTime: string // median first-response / resolution time
}

/**
 * The numbers deliberately tell an honest story rather than a flattering one:
 *
 * - FIRST RESPONSE looks far better with AI (2m 40s vs 24m 30s) — but that is
 *   close to tautological. An AI Agent replies in seconds, so "everything"
 *   mostly measures the bot's reflexes.
 * - RESOLUTION is slightly BETTER without AI (91% / 6h 45m vs 89% / 8h 30m).
 *   That contrast is the point: it kills the lazy reading that AI improves every
 *   number, and raises the real question — does an AI-touched ticket close
 *   faster (deflection working) or slower (it detoured through a bot first)?
 *
 * Either way the gap is confounded by channel mix, so the UI always shows the
 * cohort size next to the number.
 */
export const FIRST_RESPONSE: ByCohort<TypeStat> = {
  all: { overall: 0.94, met: 2611, measured: 2778, medianTime: '2m 40s' },
  human: { overall: 0.86, met: 354, measured: 412, medianTime: '24m 30s' },
}

export const RESOLUTION: ByCohort<TypeStat> = {
  all: { overall: 0.89, met: 1764, measured: 1982, medianTime: '8h 30m' },
  human: { overall: 0.91, met: 269, measured: 296, medianTime: '6h 45m' },
}

/* ── response-time distribution (bands relative to target) ────────────────── */

/** Counts per band: met (≤ target), then 1–2× / 2–4× / > 4× the target. */
export interface Distribution {
  met: number
  over1: number
  over2: number
  over3: number
}

/** Bands are relative to each SLA's target, so the bar is meaningful across
 * policies with different targets (and normalizes custom-field variation). */
export const DIST_BANDS: [string, string, string, string] = [
  '≤ target',
  '1–2× target',
  '2–4× target',
  '> 4× target',
]

// Each band set sums to that cohort's `measured` above.
export const FIRST_RESPONSE_DIST: ByCohort<Distribution> = {
  all: { met: 2611, over1: 90, over2: 45, over3: 32 }, // 2778
  human: { met: 354, over1: 30, over2: 16, over3: 12 }, // 412
}

export const RESOLUTION_DIST: ByCohort<Distribution> = {
  all: { met: 1764, over1: 110, over2: 55, over3: 53 }, // 1982
  human: { met: 269, over1: 14, over2: 8, over3: 5 }, // 296
}

/* ── by Topic (custom field) — a breakdown per type ───────────────────────── */

/** Compliance for one custom-field value, per cohort. */
export interface TopicRow {
  optionId?: string
  label?: string
  all: number
  human: number
}

export const FIRST_RESPONSE_BY_TOPIC: { fieldId: string; rows: TopicRow[] } = {
  fieldId: 'topic',
  rows: [
    { optionId: 'invoices', all: 0.95, human: 0.85 },
    { optionId: 'contract_changes', all: 0.93, human: 0.82 },
    { optionId: 'complaints', all: 0.9, human: 0.76 },
    { optionId: 'refunds', all: 0.94, human: 0.88 },
    { optionId: 'technical', all: 0.96, human: 0.89 },
    { label: 'All other tickets', all: 0.95, human: 0.87 },
  ],
}

/** Resolution compliance by Topic, each judged against its own target. */
export interface ResTopicRow extends TopicRow {
  targetLabel: string
}

export const RESOLUTION_BY_TOPIC: { fieldId: string; rows: ResTopicRow[] } = {
  fieldId: 'topic',
  rows: [
    { optionId: 'invoices', targetLabel: '48h', all: 0.88, human: 0.9 },
    { optionId: 'contract_changes', targetLabel: '48h', all: 0.92, human: 0.94 },
    { optionId: 'complaints', targetLabel: '24h', all: 0.71, human: 0.78 },
    { optionId: 'refunds', targetLabel: '24h', all: 0.79, human: 0.84 },
    { optionId: 'technical', targetLabel: '24h', all: 0.83, human: 0.86 },
    { label: 'All other tickets', targetLabel: '24h', all: 0.86, human: 0.89 },
  ],
}

/* ── breakdown tables (Channel / Team / Agent) ────────────────────────────── */

/** A per-type cell: percent + median time. */
export interface PerfCell {
  pct: number
  time: string
}

/**
 * One dimension's figures within one cohort. Volumes live here too — they must
 * move with the cohort, or the table contradicts the headline.
 * `fr`/`res` null = no SLA of that type; `closed + open === 0` = no tickets in
 * this cohort (rendered differently — a 0% pill would be a lie).
 */
export interface CohortCells {
  fr: PerfCell | null
  res: PerfCell | null
  closed: number
  open: number
}

export interface PerfRow {
  id: string
  label: string
  /** Initials for the agent avatar (agent table only; GDPR — no other PII). */
  initials?: string
  all: CohortCells
  human: CohortCells
}

/**
 * Channels. Shaped so the human-only view SHOWS the point rather than captioning
 * it: AI Agents run on WhatsApp, Support email and Info email, so those collapse
 * to slivers, while Sales email (no AI) carries most of the human-only volume.
 * SMS + Instagram DM have no SLA of either type. Pre-sorted worst-first.
 */
export const CHANNEL_PERFORMANCE: PerfRow[] = [
  {
    id: 'sms',
    label: 'SMS',
    all: { fr: null, res: null, closed: 142, open: 63 },
    human: { fr: null, res: null, closed: 138, open: 61 },
  },
  {
    id: 'sales_email',
    label: 'Sales email',
    all: { fr: { pct: 0.83, time: '41m 12s' }, res: null, closed: 305, open: 297 },
    // No AI on this channel — the cohort barely changes it.
    human: { fr: { pct: 0.83, time: '42m 30s' }, res: null, closed: 298, open: 291 },
  },
  {
    id: 'instagram',
    label: 'Instagram DM',
    all: { fr: null, res: null, closed: 214, open: 96 },
    human: { fr: null, res: null, closed: 58, open: 22 },
  },
  {
    id: 'info_email',
    label: 'Info email',
    all: { fr: { pct: 0.93, time: '2m 10s' }, res: { pct: 0.9, time: '9h 34m' }, closed: 418, open: 71 },
    human: { fr: { pct: 0.87, time: '28m 5s' }, res: { pct: 0.92, time: '7h 2m' }, closed: 61, open: 9 },
  },
  {
    id: 'support_email',
    label: 'Support email',
    all: { fr: { pct: 0.96, time: '1m 55s' }, res: { pct: 0.94, time: '8h 7m' }, closed: 662, open: 20 },
    human: { fr: { pct: 0.91, time: '19m 40s' }, res: { pct: 0.95, time: '6h 30m' }, closed: 48, open: 3 },
  },
  {
    id: 'whatsapp',
    label: 'WhatsApp',
    all: { fr: { pct: 0.98, time: '40s' }, res: { pct: 0.97, time: '9h 20m' }, closed: 337, open: 265 },
    // Almost fully AI-handled — nothing left to report on.
    human: { fr: null, res: null, closed: 0, open: 0 },
  },
]

// Teams (fictional): all carry both types.
export const TEAM_PERFORMANCE: PerfRow[] = [
  {
    id: 'sales',
    label: 'Sales',
    all: { fr: { pct: 0.92, time: '3m 20s' }, res: { pct: 0.81, time: '10h 12m' }, closed: 288, open: 154 },
    human: { fr: { pct: 0.84, time: '38m 10s' }, res: { pct: 0.85, time: '8h 40m' }, closed: 121, open: 62 },
  },
  {
    id: 'billing',
    label: 'Billing',
    all: { fr: { pct: 0.94, time: '2m 30s' }, res: { pct: 0.87, time: '9h 2m' }, closed: 402, open: 96 },
    human: { fr: { pct: 0.86, time: '26m 45s' }, res: { pct: 0.9, time: '7h 15m' }, closed: 74, open: 14 },
  },
  {
    id: 'support',
    label: 'Support',
    all: { fr: { pct: 0.96, time: '1m 48s' }, res: { pct: 0.92, time: '7h 41m' }, closed: 914, open: 210 },
    human: { fr: { pct: 0.89, time: '21m 5s' }, res: { pct: 0.94, time: '6h 2m' }, closed: 96, open: 18 },
  },
  {
    id: 'vip',
    label: 'VIP',
    all: { fr: { pct: 0.99, time: '35s' }, res: { pct: 0.96, time: '5h 18m' }, closed: 121, open: 12 },
    human: { fr: { pct: 0.94, time: '11m 20s' }, res: { pct: 0.97, time: '4h 50m' }, closed: 63, open: 7 },
  },
]

// Agents (fictional; initials only — GDPR). Pre-sorted worst-first.
export const AGENT_PERFORMANCE: PerfRow[] = [
  {
    id: 'a1',
    label: 'Noa Jansen',
    initials: 'NJ',
    all: { fr: { pct: 0.9, time: '3m 40s' }, res: { pct: 0.8, time: '11h 2m' }, closed: 176, open: 41 },
    human: { fr: { pct: 0.81, time: '41m 15s' }, res: { pct: 0.84, time: '9h 10m' }, closed: 34, open: 9 },
  },
  {
    id: 'a2',
    label: 'Sam de Vries',
    initials: 'SV',
    all: { fr: { pct: 0.93, time: '2m 55s' }, res: { pct: 0.85, time: '9h 20m' }, closed: 203, open: 33 },
    human: { fr: { pct: 0.85, time: '30m 2s' }, res: { pct: 0.88, time: '7h 45m' }, closed: 41, open: 7 },
  },
  {
    id: 'a3',
    label: 'Lena Bakker',
    initials: 'LB',
    all: { fr: { pct: 0.95, time: '2m 5s' }, res: { pct: 0.9, time: '7h 55m' }, closed: 245, open: 28 },
    human: { fr: { pct: 0.88, time: '24m 18s' }, res: { pct: 0.92, time: '6h 20m' }, closed: 52, open: 6 },
  },
  {
    id: 'a4',
    label: 'Youssef El Amrani',
    initials: 'YE',
    all: { fr: { pct: 0.97, time: '1m 30s' }, res: { pct: 0.94, time: '6h 12m' }, closed: 268, open: 19 },
    human: { fr: { pct: 0.93, time: '15m 40s' }, res: { pct: 0.95, time: '5h 30m' }, closed: 58, open: 4 },
  },
]

/* ── definitions ──────────────────────────────────────────────────────────── */

export const ANALYTICS_DEFINITIONS_V3 = {
  firstResponseTip:
    'Time from the incoming message to the first reply on the ticket. Any substantive reply stops the clock — from an AI Agent or a person — but a canned auto-acknowledgment doesn’t count.',
  resolutionTip:
    'Time from creation until the ticket is fully closed. Any proper close counts — including one made by an AI Agent — as long as it doesn’t reopen within 24 hours. Frozen time (e.g. waiting on the customer) is excluded.',
  firstResponse: 'Share of tickets answered within the first-response target.',
  resolution:
    'Share of tickets closed within the resolution target — each judged against its own target (resolution can vary by custom field).',
  byTopicNote:
    'First response uses one target for all tickets, so this by-topic view is a descriptive slice (where responses are slow), not a set of per-topic promises.',
  perDimension:
    'First response and resolution compliance + median times, worst first. "— no SLA" means that dimension has no SLA of that type.',
  distributionNote:
    "Closed tickets, measured in business hours. Bands are relative to each SLA's target. A substantive reply counts (an AI Agent or a person); auto-replies don't.",
  agentPrivacyNote:
    'Sample data — fictional agents, initials only. Real per-agent SLA reporting is people-performance data and needs access controls + aggregation thresholds.',

  /* the ticket cohort (the AI filter) */
  cohortAll:
    'Every ticket with an SLA, whether or not an AI Agent was involved — the service level your customers actually experience.',
  cohortHuman:
    'Only tickets an AI Agent never touched — mostly channels where AI isn’t active. A different mix of channels and questions, so read the gap as a difference in population, not as AI’s contribution.',
  cohortDataNote:
    'This needs one ticket-level flag — whether an AI Agent took part — not per-reply bot detection.',
}
