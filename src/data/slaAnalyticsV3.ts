// SLA analytics (Iteration 3) — static illustrative mock for the PER-TYPE modal.
// Sample/prototype data lives here (CLAUDE.md rule 4: no inline mock data).
//
// Iteration 3 splits SLAs by type, so analytics are per type: First response and
// Resolution each get a compliance % + a median time. First response also carries
// an AI-vs-human basis (a reporting lens — incl-AI stops the clock on an instant
// AI ack, so it flatters the metric; human-only shows real human responsiveness).
// No runtime clock — every number is hand-picked demo data. Labels reference the
// real Topic custom-field options (see slaDataV3).

/* ── §0 headline compliance + median time, per type ───────────────────────── */

export interface TypeStat {
  overall: number // compliance 0–1
  met: number
  measured: number
  medianTime: string // median first-response / resolution time
}

/** First response has two reporting bases; the modal toggle picks one. */
export const FIRST_RESPONSE: { inclAI: TypeStat; human: TypeStat } = {
  inclAI: { overall: 0.94, met: 2611, measured: 2778, medianTime: '2m 40s' },
  human: { overall: 0.82, met: 2278, measured: 2778, medianTime: '38m 12s' },
}

export const RESOLUTION: TypeStat = {
  overall: 0.89,
  met: 1764,
  measured: 1982,
  medianTime: '8h 30m',
}

export type FrBasis = 'inclAI' | 'human'

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

// Consistent with the KPI met/measured above; the misses split across bands
// (incl-AI has a tight tail; human-only a much heavier one).
export const FIRST_RESPONSE_DIST: { inclAI: Distribution; human: Distribution } = {
  inclAI: { met: 2611, over1: 90, over2: 45, over3: 32 },
  human: { met: 2278, over1: 250, over2: 140, over3: 110 },
}

export const RESOLUTION_DIST: Distribution = { met: 1764, over1: 110, over2: 55, over3: 53 }

/* ── by Topic (custom field) — a breakdown per type ───────────────────────── */

/** First response compliance by Topic, per basis. Descriptive slice — first
 * response's target is uniform, so this shows where we're slow, not per-topic
 * promises. */
export interface FrTopicRow {
  optionId?: string
  label?: string
  inclAI: number
  human: number
}

export const FIRST_RESPONSE_BY_TOPIC: { fieldId: string; rows: FrTopicRow[] } = {
  fieldId: 'topic',
  rows: [
    { optionId: 'invoices', inclAI: 0.95, human: 0.8 },
    { optionId: 'contract_changes', inclAI: 0.93, human: 0.77 },
    { optionId: 'complaints', inclAI: 0.9, human: 0.68 },
    { optionId: 'refunds', inclAI: 0.94, human: 0.83 },
    { optionId: 'technical', inclAI: 0.96, human: 0.85 },
    { label: 'All other conversations', inclAI: 0.95, human: 0.84 },
  ],
}

/** Resolution compliance by Topic, each judged against its own target. */
export interface ResTopicRow {
  optionId?: string
  label?: string
  targetLabel: string
  compliance: number
}

export const RESOLUTION_BY_TOPIC: { fieldId: string; rows: ResTopicRow[] } = {
  fieldId: 'topic',
  rows: [
    { optionId: 'invoices', targetLabel: '48h', compliance: 0.88 },
    { optionId: 'contract_changes', targetLabel: '48h', compliance: 0.92 },
    { optionId: 'complaints', targetLabel: '24h', compliance: 0.71 },
    { optionId: 'refunds', targetLabel: '24h', compliance: 0.79 },
    { optionId: 'technical', targetLabel: '24h', compliance: 0.83 },
    { label: 'All other conversations', targetLabel: '24h', compliance: 0.86 },
  ],
}

/* ── breakdown tables (Channel / Team / Agent) ────────────────────────────── */

/** A per-type cell: percent + median time, or null when that dimension has no
 * SLA of the type (→ "— no SLA"). */
export interface PerfCell {
  pct: number
  time: string
}

export interface PerfRow {
  id: string
  label: string
  /** Initials for the agent avatar (agent table only; GDPR — no other PII). */
  initials?: string
  fr: { inclAI: PerfCell | null; human: PerfCell | null }
  res: PerfCell | null
  closed: number
  open: number
}

// Channels: some lack an SLA of a type (→ null). Pre-sorted worst-first.
export const CHANNEL_PERFORMANCE: PerfRow[] = [
  { id: 'sms', label: 'SMS', fr: { inclAI: null, human: null }, res: null, closed: 142, open: 63 },
  { id: 'sales_email', label: 'Sales email', fr: { inclAI: { pct: 0.95, time: '3m 5s' }, human: { pct: 0.79, time: '57m 50s' } }, res: null, closed: 305, open: 297 },
  { id: 'instagram', label: 'Instagram DM', fr: { inclAI: null, human: null }, res: null, closed: 214, open: 96 },
  { id: 'info_email', label: 'Info email', fr: { inclAI: { pct: 0.93, time: '2m 10s' }, human: { pct: 0.8, time: '1h 3m' } }, res: { pct: 0.9, time: '9h 34m' }, closed: 418, open: 71 },
  { id: 'support_email', label: 'Support email', fr: { inclAI: { pct: 0.96, time: '1m 55s' }, human: { pct: 0.85, time: '52m 4s' } }, res: { pct: 0.94, time: '8h 7m' }, closed: 662, open: 20 },
  { id: 'whatsapp', label: 'WhatsApp', fr: { inclAI: { pct: 0.98, time: '40s' }, human: { pct: 0.9, time: '21m 19s' } }, res: { pct: 0.97, time: '9h 20m' }, closed: 337, open: 265 },
]

// Teams (fictional): all carry both types.
export const TEAM_PERFORMANCE: PerfRow[] = [
  { id: 'sales', label: 'Sales', fr: { inclAI: { pct: 0.92, time: '3m 20s' }, human: { pct: 0.76, time: '1h 2m' } }, res: { pct: 0.81, time: '10h 12m' }, closed: 288, open: 154 },
  { id: 'billing', label: 'Billing', fr: { inclAI: { pct: 0.94, time: '2m 30s' }, human: { pct: 0.83, time: '44m 9s' } }, res: { pct: 0.87, time: '9h 2m' }, closed: 402, open: 96 },
  { id: 'support', label: 'Support', fr: { inclAI: { pct: 0.96, time: '1m 48s' }, human: { pct: 0.86, time: '39m 51s' } }, res: { pct: 0.92, time: '7h 41m' }, closed: 914, open: 210 },
  { id: 'vip', label: 'VIP', fr: { inclAI: { pct: 0.99, time: '35s' }, human: { pct: 0.95, time: '12m 3s' } }, res: { pct: 0.96, time: '5h 18m' }, closed: 121, open: 12 },
]

// Agents (fictional; initials only — GDPR). Pre-sorted worst-first.
export const AGENT_PERFORMANCE: PerfRow[] = [
  { id: 'a1', label: 'Noa Jansen', initials: 'NJ', fr: { inclAI: { pct: 0.9, time: '3m 40s' }, human: { pct: 0.74, time: '1h 9m' } }, res: { pct: 0.8, time: '11h 2m' }, closed: 176, open: 41 },
  { id: 'a2', label: 'Sam de Vries', initials: 'SV', fr: { inclAI: { pct: 0.93, time: '2m 55s' }, human: { pct: 0.81, time: '48m 30s' } }, res: { pct: 0.85, time: '9h 20m' }, closed: 203, open: 33 },
  { id: 'a3', label: 'Lena Bakker', initials: 'LB', fr: { inclAI: { pct: 0.95, time: '2m 5s' }, human: { pct: 0.87, time: '35m 12s' } }, res: { pct: 0.9, time: '7h 55m' }, closed: 245, open: 28 },
  { id: 'a4', label: 'Youssef El Amrani', initials: 'YE', fr: { inclAI: { pct: 0.97, time: '1m 30s' }, human: { pct: 0.91, time: '22m 47s' } }, res: { pct: 0.94, time: '6h 12m' }, closed: 268, open: 19 },
]

/* ── definitions ──────────────────────────────────────────────────────────── */

export const ANALYTICS_DEFINITIONS_V3 = {
  firstResponseTip:
    'Time from the incoming message to the first reply. “Incl. AI” is met by the first reply of any kind — an AI Agent or a person (a substantive reply, not a canned auto-acknowledgment) — so a conversation an AI answers counts here. “Human only” counts only a human’s reply.',
  resolutionTip:
    'Time from creation until the ticket is fully closed. Any proper close counts — including one made by an AI Agent — as long as it doesn’t reopen within 24 hours. Frozen time (e.g. waiting on the customer) is excluded.',
  firstResponse:
    'Share of conversations answered within the first-response target. Toggle the basis: "Incl. AI" counts the first reply of any kind — an AI Agent or a person (a substantive reply, not a canned auto-acknowledgment); "Human only" counts only a human’s reply.',
  resolution:
    'Share of conversations closed within the resolution target — each judged against its own target (resolution can vary by custom field).',
  byTopicNote:
    'First response uses one target for all conversations, so this by-topic view is a descriptive slice (where responses are slow), not a set of per-topic promises.',
  perDimension:
    'First response and resolution compliance + median times, worst first. "— no SLA" means that dimension has no SLA of that type.',
  distributionNote:
    "Closed conversations, measured in business hours. Bands are relative to each SLA's target. A substantive reply counts (an AI Agent or a person); auto-replies don't.",
  agentPrivacyNote:
    'Sample data — fictional agents, initials only. Real per-agent SLA reporting is people-performance data and needs access controls + aggregation thresholds.',
}
