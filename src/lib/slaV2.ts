// Pure SLA business logic — no Vue, no storage. Everything the overview and
// editor render is derived through these helpers so behaviour stays testable
// and consistent between the two views.
import {
  ALL_CHANNEL_ITEMS,
  CUSTOM_FIELDS,
  type Policy,
  type ResolutionTarget,
  type TargetSetting,
  type TimeUnit,
} from '@/data/slaDataV2'

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

/** Display name of a custom field. */
export function fieldName(fieldId: string): string {
  return CUSTOM_FIELDS.find((f) => f.id === fieldId)?.name ?? fieldId
}

/** Display value of one option of a custom field. */
export function optionLabel(fieldId: string, optionId: string): string {
  const field = CUSTOM_FIELDS.find((f) => f.id === fieldId)
  return field?.options.find((o) => o.id === optionId)?.value ?? optionId
}

/** Rows equal to the default are no-ops — only differing rows are meaningful
 * (auto-listing a field pre-fills every value at the default). */
function differingRows(resolution: ResolutionTarget): ResolutionTarget['rows'] {
  const d = resolution.default
  return resolution.rows.filter((r) => r.value !== d.value || r.unit !== d.unit)
}

/** Plain-language one-liner for a policy row on the overview. */
export function scopeSentence(policy: Policy): string {
  const { firstReply, resolution } = policy.targets
  const parts = [channelsLabel(policy.channels)]
  if (firstReply.enabled)
    parts.push(`human reply within ${firstReply.value}${shortUnit(firstReply.unit)}`)
  if (resolution.enabled) {
    let clause = `resolve within ${resolution.default.value}${shortUnit(resolution.default.unit)}`
    const diff = differingRows(resolution).length
    if (diff) clause += ` +${diff} by type`
    parts.push(clause)
  }
  parts.push(policy.countBusinessHoursOnly ? 'business hours' : '24/7')
  return parts.join(' · ')
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

/** Resolution clause parts: default duration + a bracketed by-type list. */
function resolutionClause(resolution: ResolutionTarget): SummaryPart[] {
  const parts: SummaryPart[] = []
  parts.push({ text: `${resolution.default.value} ${resolution.default.unit}`, strong: true })
  const diff = differingRows(resolution)
  if (diff.length) {
    // e.g. " (48 hours for Invoices, Contract changes)" — grouped by duration.
    const byDuration = new Map<string, string[]>()
    for (const r of diff) {
      const key = `${r.value} ${r.unit}`
      byDuration.set(key, [...(byDuration.get(key) ?? []), optionLabel(resolution.fieldId, r.optionId)])
    }
    parts.push({ text: ' (' })
    const groups = [...byDuration.entries()]
    groups.forEach(([duration, names], i) => {
      parts.push({ text: duration, strong: true })
      parts.push({ text: ` for ${names.join(', ')}` })
      if (i < groups.length - 1) parts.push({ text: '; ' })
    })
    parts.push({ text: ')' })
  }
  return parts
}

/** "In plain terms" sentence as parts, so variable values can render darker. */
export function summaryParts(policy: Policy): SummaryPart[] {
  const parts: SummaryPart[] = [{ text: 'In plain terms: conversations on ' }]
  parts.push({ text: channelsLabel(policy.channels) || '(no channels)', strong: true })
  const { firstReply, resolution } = policy.targets
  if (firstReply.enabled) {
    parts.push({ text: ' get a first human response within ' })
    parts.push({ text: `${firstReply.value} ${firstReply.unit}`, strong: true })
    if (resolution.enabled) {
      parts.push({ text: ' and are resolved within ' })
      parts.push(...resolutionClause(resolution))
    }
  } else if (resolution.enabled) {
    parts.push({ text: ' are resolved within ' })
    parts.push(...resolutionClause(resolution))
  }
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

/** Resolution is valid when the default and every value row have value ≥ 1
 * (and any rows require a chosen field). */
export function resolutionValid(resolution: ResolutionTarget): boolean {
  if (!resolution.enabled) return true
  if (resolution.default.value < 1) return false
  if (resolution.rows.length && !resolution.fieldId) return false
  return resolution.rows.every((r) => r.value >= 1 && Boolean(r.optionId))
}

function targetSetting(value: number, unit: TimeUnit): TargetSetting {
  return { enabled: true, value, unit }
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
      resolution: { enabled: true, fieldId: '', default: { value: 48, unit: 'hours' }, rows: [] },
    },
    countBusinessHoursOnly: true,
  }
}
