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

export interface Policy {
  id: string
  name: string
  active: boolean
  /** 1+ channel ids from CHANNELS. Empty = invalid, blocks save. */
  channels: string[]
  targets: {
    firstReply: TargetSetting
    resolution: TargetSetting
  }
  /** When true the SLA clock pauses outside each channel's business hours. */
  countBusinessHoursOnly: boolean
}

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
      resolution: { enabled: true, value: 48, unit: 'hours' },
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
      resolution: { enabled: true, value: 48, unit: 'hours' },
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
      resolution: { enabled: true, value: 48, unit: 'hours' },
    },
    countBusinessHoursOnly: true,
  },
]

/** Tooltip copy for the editor rows (ⓘ only on the three timing rows). */
export const SLA_TOOLTIPS = {
  firstReply:
    "How fast your team should send the first reply after a customer's first message.",
  resolution:
    'How fast the ticket should be fully closed, from the moment it was created.',
  businessHours: 'Whether the clock runs 24/7 or only during business hours.',
} as const
