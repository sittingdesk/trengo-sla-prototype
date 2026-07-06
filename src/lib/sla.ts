// Pure SLA business logic — no Vue, no storage. Everything the overview and
// editor render is derived through these helpers so behaviour stays testable
// and consistent between the two views.
import {
  ALL_CHANNEL_ITEMS,
  type Policy,
  type TargetSetting,
  type TimeUnit,
} from '@/data/slaData'

/* ── time ──────────────────────────────────────────────────────────────── */

/** Short unit for scope sentences: 30m / 4h / 2d. */
function shortUnit(unit: TimeUnit): string {
  return unit === 'minutes' ? 'm' : unit === 'hours' ? 'h' : 'd'
}

/* ── ordering ──────────────────────────────────────────────────────────── */

/** Active first, then alphabetical by name (case-insensitive). */
export function sortPolicies(policies: Policy[]): Policy[] {
  return [...policies].sort(
    (a, b) =>
      Number(b.active) - Number(a.active) ||
      a.name.toLowerCase().localeCompare(b.name.toLowerCase()),
  )
}

/* ── labels & sentences ────────────────────────────────────────────────── */

function channelLabel(id: string): string {
  return ALL_CHANNEL_ITEMS.find((c) => c.id === id)?.label ?? id
}

/**
 * Channel part of the scope sentence. Multiple instances of one channel type
 * (e.g. two WhatsApp numbers) collapse to "WhatsApp (2 numbers)".
 */
export function channelsLabel(channels: string[]): string {
  // Group by the label's base name (text before any " (…)" suffix).
  const groups = new Map<string, number>()
  for (const id of channels) {
    const base = channelLabel(id).replace(/\s*\(.*\)$/, '')
    groups.set(base, (groups.get(base) ?? 0) + 1)
  }
  return [...groups.entries()]
    .map(([base, n]) => {
      if (n > 1) return `${base} (${n} numbers)`
      // Single instance: use the full label (keeps "+31 6 1234" visible).
      const id = channels.find((c) => channelLabel(c).startsWith(base))
      return id ? channelLabel(id) : base
    })
    .join(' + ')
}

/** Plain-language one-liner for a policy row on the overview. */
export function scopeSentence(policy: Policy): string {
  const { firstReply, resolution } = policy.targets
  return [
    channelsLabel(policy.channels),
    `reply within ${firstReply.value}${shortUnit(firstReply.unit)}`,
    `resolve within ${resolution.value}${shortUnit(resolution.unit)}`,
    policy.countBusinessHoursOnly ? 'business hours' : '24/7',
  ].join(' · ')
}

/* ── coverage ──────────────────────────────────────────────────────────── */

export type Coverage = { ok: true } | { ok: false; uncoveredLabels: string[] }

/** Whether every channel in the catalog is claimed by an active policy. */
export function coverage(policies: Policy[]): Coverage {
  const covered = new Set(policies.filter((p) => p.active).flatMap((p) => p.channels))
  const uncovered = ALL_CHANNEL_ITEMS.filter((c) => !covered.has(c.id)).map((c) => c.label)
  return uncovered.length ? { ok: false, uncoveredLabels: uncovered } : { ok: true }
}

/* ── live editor summary ───────────────────────────────────────────────── */

export interface SummaryPart {
  text: string
  strong?: boolean
}

/** "In plain terms" sentence as parts, so variable values can render darker. */
export function summaryParts(policy: Policy): SummaryPart[] {
  const parts: SummaryPart[] = [{ text: 'In plain terms: conversations on ' }]
  parts.push({ text: channelsLabel(policy.channels) || '(no channels)', strong: true })
  const { firstReply, resolution } = policy.targets
  parts.push({ text: ' get a first reply within ' })
  parts.push({ text: `${firstReply.value} ${firstReply.unit}`, strong: true })
  parts.push({ text: ' and are resolved within ' })
  parts.push({ text: `${resolution.value} ${resolution.unit}`, strong: true })
  parts.push({ text: ', counted during ' })
  parts.push({ text: policy.countBusinessHoursOnly ? 'business hours' : '24/7', strong: true })
  parts.push({ text: '.' })
  return parts
}

/* ── validation & conflicts ────────────────────────────────────────────── */

export interface ChannelConflict {
  channelLabel: string
  policyName: string
}

/**
 * V1 ONLY: one channel belongs to exactly one active policy, so any shared
 * channel is a hard save-block. When label / CRM-field scoping returns, this
 * per-channel exclusivity must relax — it is a V1 rule, not a permanent
 * constraint.
 *
 * Per-channel, not whole-set: a policy on [whatsapp_1, whatsapp_2] blocks a
 * new policy using just whatsapp_2. Excludes the policy itself (edit mode)
 * and inactive policies.
 */
export function channelConflicts(policy: Policy, policies: Policy[]): ChannelConflict[] {
  const conflicts: ChannelConflict[] = []
  for (const other of policies) {
    if (other.id === policy.id || !other.active) continue
    for (const id of policy.channels) {
      if (other.channels.includes(id)) {
        conflicts.push({ channelLabel: channelLabel(id), policyName: other.name })
      }
    }
  }
  return conflicts
}

/* ── lifecycle helpers ─────────────────────────────────────────────────── */

export function normalizePolicy(policy: Policy): Policy {
  return { ...policy, name: policy.name.trim() }
}

function targetSetting(value: number, unit: TimeUnit): TargetSetting {
  return { value, unit }
}

/** Create-mode defaults. */
export function defaultPolicy(): Policy {
  return {
    id: `pol_${Date.now().toString(36)}`,
    name: '',
    active: true,
    channels: [],
    targets: {
      firstReply: targetSetting(1, 'hours'),
      resolution: targetSetting(48, 'hours'),
    },
    countBusinessHoursOnly: true,
  }
}
