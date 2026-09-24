// SLA analytics — static illustrative mock for the PER-TYPE modal (Iterations 3 & 4).
// Sample/prototype data lives here (CLAUDE.md rule 4: no inline mock data).
//
// Typed SLAs mean per-type analytics: an overall SLA-compliance headline, then
// First response and Resolution each with a compliance % + a median time and a
// by-topic breakdown.
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

/* ── §0 headline compliance + median time ─────────────────────────────────── */

/** A rate: met ÷ measured. Compliance has no "median time" — it isn't a duration. */
export interface ComplianceStat {
  overall: number // 0–1
  met: number
  measured: number
}

export interface TypeStat extends ComplianceStat {
  medianTime: string // median first-response / resolution time
}

/**
 * Overall SLA compliance — the whole-ticket verdict, judged STRICTLY: a ticket
 * counts as met only if it passed EVERY target that applied to it. The
 * denominator is tickets carrying at least one SLA (2,778 have a first-response
 * SLA, 1,982 a resolution SLA, 1,780 have both → 2,980 distinct tickets);
 * no-SLA tickets are excluded entirely.
 *
 * Because it's an AND across targets, this number is necessarily BELOW both
 * per-type numbers below — 87% against 94% first response and 89% resolution.
 * If it ever reads higher than either, the calculation is wrong.
 */
export const SLA_COMPLIANCE: ByCohort<ComplianceStat> = {
  all: { overall: 0.87, met: 2595, measured: 2980 },
  human: { overall: 0.81, met: 358, measured: 443 },
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

/* ── definitions ──────────────────────────────────────────────────────────── */

export const ANALYTICS_DEFINITIONS_V3 = {
  complianceTip:
    'Share of tickets that met every SLA target that applied to them. Judged strictly — if a ticket had both a first-response and a resolution target, missing either one counts the whole ticket as a miss. Tickets with no SLA are excluded.',
  compliance:
    'The whole-ticket verdict across every applicable target — always lower than the per-type numbers, because one miss fails the ticket.',
  firstResponseTip:
    'Time from the incoming message to the first reply on the ticket. Any substantive reply stops the clock — from an AI Agent or a person — but a canned auto-acknowledgment doesn’t count.',
  resolutionTip:
    'Time from creation until the ticket is fully closed. Any proper close counts — including one made by an AI Agent — as long as it doesn’t reopen within 24 hours. Frozen time (e.g. waiting on the customer) is excluded.',
  firstResponse: 'Share of tickets answered within the first-response target.',
  resolution:
    'Share of tickets closed within the resolution target — each judged against its own target (resolution can vary by custom field).',
  byTopicNote:
    'First response uses one target for all tickets, so this by-topic view is a descriptive slice (where responses are slow), not a set of per-topic promises.',

  /* the ticket cohort (the AI filter) */
  cohortAll:
    'Every ticket with an SLA, whether or not an AI Agent was involved — the service level your customers actually experience.',
  cohortHuman:
    'Only tickets an AI Agent never touched — mostly channels where AI isn’t active. A different mix of channels and questions, so read the gap as a difference in population, not as AI’s contribution.',
  cohortDataNote:
    'This needs one ticket-level flag — whether an AI Agent took part — not per-reply bot detection.',
}
