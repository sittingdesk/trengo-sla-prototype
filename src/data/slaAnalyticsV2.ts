// SLA analytics — static illustrative mock data for the analytics preview modal.
// Sample/prototype data lives here (CLAUDE.md rule 4: no inline mock data).
//
// This prototype has NO runtime SLA clock, so every number below is seeded,
// hand-picked demo data. Labels reference the REAL channels + custom-field
// options (see slaDataV2) so the preview reads as native. Definitions mirror the
// dashboard "how it's measured" notes we tracked for the data team.

/* ── §1 SLA compliance (headline) ─────────────────────────────────────────── */

export const SLA_COMPLIANCE = {
  overall: 0.93, // met ÷ measured
  met: 1847,
  measured: 1986,
}

/* ── §2 Resolution by custom field ────────────────────────────────────────── */

export interface ResolutionFieldRow {
  /** An option id of the referenced custom field (rendered via optionLabel). */
  optionId?: string
  /** Literal label for the non-option default row. */
  label?: string
  /** The resolution target that applies to this value, e.g. "48h". */
  targetLabel: string
  /** Compliance for conversations judged against this value's target (0–1). */
  compliance: number
}

export const RESOLUTION_BY_FIELD: { fieldId: string; rows: ResolutionFieldRow[] } = {
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

/* ── §3 SLA compliance per channel ────────────────────────────────────────── */

export interface ChannelPerfRow {
  channelId: string // real channel id from slaDataV2 ALL_CHANNEL_ITEMS
  channel: string // display label (kept short, e.g. "WhatsApp")
  resolution: string // median resolution time
  firstResponse: string // median first response time
  compliance: number // 0–1
  closed: number
  open: number
}

// Pre-sorted worst-compliance-first (the operational signal — handoff rule).
export const CHANNEL_PERFORMANCE: ChannelPerfRow[] = [
  { channelId: 'sms', channel: 'SMS', resolution: '11h 48m', firstResponse: '1h 12m', compliance: 0.78, closed: 142, open: 63 },
  { channelId: 'sales_email', channel: 'Sales email', resolution: '2h 21m', firstResponse: '57m 50s', compliance: 0.84, closed: 305, open: 297 },
  { channelId: 'instagram', channel: 'Instagram DM', resolution: '6h 3m', firstResponse: '38m 27s', compliance: 0.88, closed: 214, open: 96 },
  { channelId: 'messenger', channel: 'Facebook Messenger', resolution: '5h 41m', firstResponse: '33m 9s', compliance: 0.9, closed: 268, open: 121 },
  { channelId: 'livechat', channel: 'Live chat', resolution: '22h 22m', firstResponse: '50m 13s', compliance: 0.93, closed: 298, open: 156 },
  { channelId: 'support_email', channel: 'Support email', resolution: '8h 7m', firstResponse: '57m 19s', compliance: 0.94, closed: 662, open: 20 },
  { channelId: 'info_email', channel: 'Info email', resolution: '9h 34m', firstResponse: '1h 3m', compliance: 0.95, closed: 418, open: 71 },
  { channelId: 'whatsapp_1', channel: 'WhatsApp', resolution: '9h 20m', firstResponse: '21m 19s', compliance: 0.97, closed: 337, open: 265 },
]

/* ── definitions (shown under each section) ───────────────────────────────── */

export const ANALYTICS_DEFINITIONS = {
  compliance:
    'Met ÷ measured, judged strictly: every enabled target on a conversation must pass, or the whole conversation counts as a miss. AI-only and no-policy conversations are excluded from the measured total.',
  resolutionByField:
    "Resolution compliance per custom-field value, each conversation judged against its own target. Surfaces which type of work misses its promise — not just which channel.",
  perChannel:
    'Compliance per channel, worst first. Resolution and first-response times are medians over the period; closed and open are ticket volumes.',
}
