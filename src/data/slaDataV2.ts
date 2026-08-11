// SLA prototype data — catalogs, seed policies, tooltip copy.
// Sample/prototype data lives here (CLAUDE.md rule 4: no inline mock data).
//
// V1 model: policies are scoped by CHANNEL ONLY (no teams), one channel
// belongs to exactly one active policy, and business-hours schedules live on
// the channel (out of scope here) — a policy only chooses whether to count
// business hours via `countBusinessHoursOnly`.

export type TimeUnit = 'minutes' | 'hours' | 'days'

/** A response-time target. `enabled` off = this policy doesn't measure it. */
export interface TargetSetting {
  enabled: boolean
  value: number
  unit: TimeUnit
}

/** A duration (value + unit) with no enable flag — used by resolution rows. */
export interface Duration {
  value: number
  unit: TimeUnit
}

/** A resolution target for one value of the chosen custom field. */
export interface ResolutionRow extends Duration {
  id: string
  /** An option id of the policy's chosen custom field (ResolutionTarget.fieldId). */
  optionId: string
}

/**
 * Resolution target — varies by the value of a single-select custom ticket
 * field. `fieldId` picks the field (''= no variation); each row targets one of
 * that field's option values (implicit "Equals"), checked top-to-bottom
 * (topmost match wins). `default` ("All other conversations") is mandatory and
 * catches everything else. `enabled` off = first-reply-only.
 */
export interface ResolutionTarget {
  enabled: boolean
  /** Chosen custom field id (CUSTOM_FIELDS), or '' for no variation. */
  fieldId: string
  default: Duration
  rows: ResolutionRow[]
}

export interface Policy {
  id: string
  name: string
  active: boolean
  /** 1+ channel ids from CHANNELS. Empty = invalid, blocks save. */
  channels: string[]
  targets: {
    firstReply: TargetSetting
    resolution: ResolutionTarget
  }
  /** When true the SLA clock pauses outside each channel's business hours. */
  countBusinessHoursOnly: boolean
}

/**
 * Single-select custom ticket fields (dropdown, predefined options) — the
 * scoping dimension for resolution rows. Mirrors Trengo's CustomField
 * (type=TICKET, field_type=DROPDOWN) whose options live in `meta`.
 */
export interface CustomFieldOption {
  id: string
  value: string
}

export interface CustomField {
  id: string
  name: string
  options: CustomFieldOption[]
}

export const CUSTOM_FIELDS: CustomField[] = [
  {
    id: 'topic',
    name: 'Topic',
    options: [
      { id: 'invoices', value: 'Invoices' },
      { id: 'contract_changes', value: 'Contract changes' },
      { id: 'complaints', value: 'Complaints' },
      { id: 'refunds', value: 'Refunds' },
      { id: 'technical', value: 'Technical' },
    ],
  },
  {
    id: 'priority',
    name: 'Priority',
    options: [
      { id: 'low', value: 'Low' },
      { id: 'medium', value: 'Medium' },
      { id: 'high', value: 'High' },
    ],
  },
]

export interface ChannelItem {
  id: string
  label: string
}

export interface ChannelGroup {
  group: string
  items: ChannelItem[]
}

// Grouped by channel TYPE — the picker headings. Voice is excluded for now.
export const CHANNELS: ChannelGroup[] = [
  {
    group: 'Live chat',
    items: [{ id: 'livechat', label: 'Live chat' }],
  },
  {
    group: 'Facebook',
    items: [{ id: 'messenger', label: 'Facebook Messenger' }],
  },
  {
    group: 'Email',
    items: [
      { id: 'support_email', label: 'Support email' },
      { id: 'sales_email', label: 'Sales email' },
      { id: 'info_email', label: 'Info email' },
    ],
  },
  {
    group: 'Instagram',
    items: [{ id: 'instagram', label: 'Instagram DM' }],
  },
  {
    group: 'WhatsApp',
    items: [
      { id: 'whatsapp_1', label: 'WhatsApp (+31 6 1234)' },
      { id: 'whatsapp_2', label: 'WhatsApp (+31 6 5678)' },
    ],
  },
  {
    group: 'SMS',
    items: [{ id: 'sms', label: 'SMS' }],
  },
]

export const ALL_CHANNEL_ITEMS: ChannelItem[] = CHANNELS.flatMap((g) => g.items)

/** V1 seeds: three policies, no channel used twice, no fallback. */
export const SEED_POLICIES: Policy[] = [
  {
    id: 'pol_vip_email',
    name: 'VIP email',
    active: true,
    channels: ['support_email'],
    targets: {
      firstReply: { enabled: true, value: 1, unit: 'hours' },
      resolution: { enabled: true, fieldId: '', default: { value: 48, unit: 'hours' }, rows: [] },
    },
    countBusinessHoursOnly: true,
  },
  {
    id: 'pol_whatsapp_fast',
    name: 'WhatsApp fast lane',
    active: true,
    channels: ['whatsapp_1', 'whatsapp_2'],
    targets: {
      firstReply: { enabled: true, value: 1, unit: 'hours' },
      resolution: { enabled: true, fieldId: '', default: { value: 48, unit: 'hours' }, rows: [] },
    },
    countBusinessHoursOnly: false,
  },
  {
    id: 'pol_billing',
    name: 'Billing questions',
    active: true,
    channels: ['info_email'],
    targets: {
      firstReply: { enabled: true, value: 4, unit: 'hours' },
      // Resolution varies by the Topic custom field (the Nedflex example):
      // back-office topics get 48h, everything else 24h.
      resolution: {
        enabled: true,
        fieldId: 'topic',
        default: { value: 24, unit: 'hours' },
        rows: [
          { id: 'row_invoices', optionId: 'invoices', value: 48, unit: 'hours' },
          { id: 'row_contract', optionId: 'contract_changes', value: 48, unit: 'hours' },
        ],
      },
    },
    countBusinessHoursOnly: true,
  },
]

/** Tooltip copy for the editor rows (ⓘ only on the three timing rows). */
export const SLA_TOOLTIPS = {
  firstReply:
    'Counts from the incoming message — including any time the AI spent first — and stops only when a person replies.',
  resolution:
    "How fast the ticket should be fully closed, from the moment it was created. Each value's target applies when the ticket's custom field is set to it; anything else uses the default.",
  businessHours: 'Whether the clock runs 24/7 or only during business hours.',
} as const
