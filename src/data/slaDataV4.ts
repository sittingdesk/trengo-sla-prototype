// SLA prototype data (Iteration 4) — TYPED SLAs with ONE target shape.
// Sample/prototype data lives here (CLAUDE.md rule 4: no inline mock data).
//
// Iteration 4 builds on 3 (each SLA is a single TYPE, picked first). Both types
// share one `TargetConfig`, but only RESOLUTION varies its target by a custom
// field value — first response is a single flat duration (`varyByField` below).
// `type` decides the copy, the icon, the time units, whether variation is
// offered, and the per-type coverage/exclusivity rules.

export type TimeUnit = 'minutes' | 'hours' | 'days'

/** A duration (value + unit). */
export interface Duration {
  value: number
  unit: TimeUnit
}

/** A target for one value of the SLA's chosen custom field. */
export interface TargetRow extends Duration {
  id: string
  /** An option id of the SLA's chosen custom field (TargetConfig.fieldId). */
  optionId: string
}

/**
 * A target that can vary by the value of a single-select custom ticket field.
 * `fieldId` picks the field ('' = no variation); each row targets one of that
 * field's option values (implicit "Equals"), checked top-to-bottom (topmost
 * match wins). `default` ("All other tickets") is mandatory — it is the
 * coverage guarantee for unlisted and future values.
 *
 * Used by both SLA types, but only resolution offers the variation
 * (`SLA_TYPE_META[type].varyByField`). A first-response SLA leaves `fieldId`
 * empty with no rows, so only `default` is meaningful — `normalizeSla` enforces
 * that rather than trusting the editor.
 */
export interface TargetConfig {
  fieldId: string
  default: Duration
  rows: TargetRow[]
}

export type SlaType = 'first_response' | 'resolution'

/**
 * A single-type SLA. `type` says which clock this promise measures; `target`
 * says how fast, optionally varying by a custom field value. One shape for both
 * types — the editor renders one target block and only swaps copy and units.
 */
export interface Sla {
  id: string
  type: SlaType
  name: string
  active: boolean
  /** 1+ channel ids from CHANNELS. Empty = invalid, blocks save. */
  channels: string[]
  /** When true the SLA clock pauses outside each channel's business hours. */
  countBusinessHoursOnly: boolean
  /** The target for this SLA's type (can vary by a custom field). */
  target: TargetConfig
}

/** An option for the editor's unit dropdowns. */
export interface UnitOption {
  value: TimeUnit
  label: string
}

/** Per-type metadata — everything the editor used to branch on (icon = Icon.vue
 * name). Units stay type-appropriate: a first response isn't measured in days,
 * a resolution isn't measured in minutes. */
export const SLA_TYPES: SlaType[] = ['first_response', 'resolution']

export const SLA_TYPE_META: Record<
  SlaType,
  {
    label: string
    description: string
    icon: string
    /** Editor description for the Target row. */
    targetDescription: string
    /** Whether this type's target can vary by a custom field value. */
    varyByField: boolean
    units: UnitOption[]
    defaultTarget: Duration
  }
> = {
  first_response: {
    label: 'First response',
    description: 'Time until the first reply — from an AI Agent or a person.',
    icon: 'Reply',
    targetDescription: 'Time until the first reply, from AI or a person.',
    varyByField: false,
    units: [
      { value: 'minutes', label: 'Minutes' },
      { value: 'hours', label: 'Hours' },
    ],
    defaultTarget: { value: 1, unit: 'hours' },
  },
  resolution: {
    label: 'Resolution',
    description: 'Time until the ticket is fully closed. Can vary by custom field.',
    icon: 'Check',
    targetDescription:
      'Time until the ticket is closed. Set a different target per custom field value.',
    varyByField: true,
    units: [
      { value: 'hours', label: 'Hours' },
      { value: 'days', label: 'Days' },
    ],
    defaultTarget: { value: 48, unit: 'hours' },
  },
}

/**
 * Single-select custom ticket fields (dropdown, predefined options) — the
 * scoping dimension for target rows. Mirrors Trengo's CustomField
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

/**
 * Seeds — typed SLAs. Per-type exclusivity holds (no channel repeated within a
 * type); a channel MAY carry one SLA of each type. Some channels are left
 * uncovered per type to demonstrate the per-type coverage banner.
 *
 * First-response SLAs carry a flat target; only the resolution seeds use the
 * custom-field variation (Billing resolution, the Nedflex example).
 */
export const SEED_SLAS: Sla[] = [
  // ── First response ──
  {
    id: 'sla_fr_whatsapp',
    type: 'first_response',
    name: 'WhatsApp fast lane',
    active: true,
    channels: ['whatsapp_1', 'whatsapp_2'],
    countBusinessHoursOnly: false,
    target: { fieldId: '', default: { value: 1, unit: 'hours' }, rows: [] },
  },
  {
    id: 'sla_fr_email',
    type: 'first_response',
    name: 'Email first response',
    active: true,
    channels: ['support_email', 'sales_email', 'info_email'],
    countBusinessHoursOnly: true,
    target: { fieldId: '', default: { value: 1, unit: 'hours' }, rows: [] },
  },
  // ── Resolution ──
  {
    id: 'sla_res_billing',
    type: 'resolution',
    name: 'Billing resolution',
    active: true,
    channels: ['info_email'],
    countBusinessHoursOnly: true,
    // Resolution varies by the Topic custom field (the Nedflex example):
    // back-office topics get 48h, everything else 24h.
    target: {
      fieldId: 'topic',
      default: { value: 24, unit: 'hours' },
      rows: [
        { id: 'row_invoices', optionId: 'invoices', value: 48, unit: 'hours' },
        { id: 'row_contract', optionId: 'contract_changes', value: 48, unit: 'hours' },
      ],
    },
  },
  {
    id: 'sla_res_standard',
    type: 'resolution',
    name: 'Standard resolution',
    active: true,
    channels: ['support_email', 'whatsapp_1', 'whatsapp_2'],
    countBusinessHoursOnly: true,
    target: { fieldId: '', default: { value: 48, unit: 'hours' }, rows: [] },
  },
]

/** Tooltip copy for the editor rows. */
export const SLA_TOOLTIPS = {
  firstReply:
    'Counts from the incoming message and stops on the first reply — whether that comes from an AI Agent or a person.',
  resolution:
    "How fast the ticket should be fully closed, from the moment it was created. Each value's target applies when the ticket's custom field is set to it; anything else uses the default. Setting the field later doesn't restart the clock — it still runs from when the ticket was created.",
  businessHours: 'Whether the clock runs 24/7 or only during business hours.',
} as const
