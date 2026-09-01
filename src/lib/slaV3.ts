// Pure SLA business logic (Iteration 3) — no Vue, no storage. Everything the
// overview and editor render is derived here so behaviour stays consistent.
// Iteration 3 works with TYPED SLAs (first_response | resolution); coverage and
// channel exclusivity are per type.
import {
  ALL_CHANNEL_ITEMS,
  CUSTOM_FIELDS,
  type ResolutionConfig,
  type Sla,
  type SlaType,
  type TimeUnit,
} from '@/data/slaDataV3'

/* ── time ──────────────────────────────────────────────────────────────── */

/** Short unit for scope sentences: 30m / 4h / 2d. */
function shortUnit(unit: TimeUnit): string {
  return unit === 'minutes' ? 'm' : unit === 'hours' ? 'h' : 'd'
}

/* ── ordering ──────────────────────────────────────────────────────────── */

/** Active first, then alphabetical by name (case-insensitive). */
export function sortSlas(slas: Sla[]): Sla[] {
  return [...slas].sort(
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
  const groups = new Map<string, number>()
  for (const id of channels) {
    const base = channelLabel(id).replace(/\s*\(.*\)$/, '')
    groups.set(base, (groups.get(base) ?? 0) + 1)
  }
  return [...groups.entries()]
    .map(([base, n]) => {
      if (n > 1) return `${base} (${n} numbers)`
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

/** Rows equal to the default are no-ops — only differing rows are meaningful. */
function differingRows(resolution: ResolutionConfig): ResolutionConfig['rows'] {
  const d = resolution.default
  return resolution.rows.filter((r) => r.value !== d.value || r.unit !== d.unit)
}

/** Plain-language one-liner for an SLA row on the overview. Leads with the type
 * ("Resolution for Info email …") so the row says what it is without a badge;
 * the target then drops the now-redundant reply/resolve verb. */
export function scopeSentence(sla: Sla): string {
  const typeLabel = sla.type === 'first_response' ? 'First response' : 'Resolution'
  const parts = [`${typeLabel} for ${channelsLabel(sla.channels)}`]
  if (sla.type === 'first_response') {
    parts.push(`within ${sla.target.value}${shortUnit(sla.target.unit)}`)
  } else {
    let clause = `within ${sla.resolution.default.value}${shortUnit(sla.resolution.default.unit)}`
    const diff = differingRows(sla.resolution).length
    if (diff) clause += ` +${diff} by type`
    parts.push(clause)
  }
  parts.push(sla.countBusinessHoursOnly ? 'business hours' : '24/7')
  return parts.join(' · ')
}

/* ── coverage (per type) ───────────────────────────────────────────────── */

export type Coverage = { ok: true } | { ok: false; uncoveredLabels: string[] }

/** Whether every channel is claimed by an active SLA OF THIS TYPE. */
export function coverage(slas: Sla[], type: SlaType): Coverage {
  const covered = new Set(
    slas.filter((s) => s.active && s.type === type).flatMap((s) => s.channels),
  )
  const uncovered = ALL_CHANNEL_ITEMS.filter((c) => !covered.has(c.id)).map((c) => c.label)
  return uncovered.length ? { ok: false, uncoveredLabels: uncovered } : { ok: true }
}

/* ── live editor summary ───────────────────────────────────────────────── */

export interface SummaryPart {
  text: string
  strong?: boolean
}

/** Resolution clause parts: default duration + a bracketed by-value list. */
function resolutionClause(resolution: ResolutionConfig): SummaryPart[] {
  const parts: SummaryPart[] = []
  parts.push({ text: `${resolution.default.value} ${resolution.default.unit}`, strong: true })
  const diff = differingRows(resolution)
  if (diff.length) {
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
export function summaryParts(sla: Sla): SummaryPart[] {
  const parts: SummaryPart[] = [{ text: 'In plain terms: conversations on ' }]
  parts.push({ text: channelsLabel(sla.channels) || '(no channels)', strong: true })
  if (sla.type === 'first_response') {
    parts.push({ text: ' get a first response within ' })
    parts.push({ text: `${sla.target.value} ${sla.target.unit}`, strong: true })
  } else {
    parts.push({ text: ' are resolved within ' })
    parts.push(...resolutionClause(sla.resolution))
  }
  parts.push({ text: ', counted during ' })
  parts.push({ text: sla.countBusinessHoursOnly ? 'business hours' : '24/7', strong: true })
  parts.push({ text: '.' })
  return parts
}

/* ── validation & conflicts ────────────────────────────────────────────── */

export interface ChannelConflict {
  channelLabel: string
  slaName: string
}

/**
 * Per-type exclusivity: a channel can carry at most one active SLA OF EACH TYPE.
 * Only SLAs of the SAME type conflict. Per-channel (not whole-set); excludes the
 * SLA itself (edit mode) and inactive SLAs.
 */
export function channelConflicts(sla: Sla, slas: Sla[]): ChannelConflict[] {
  const conflicts: ChannelConflict[] = []
  for (const other of slas) {
    if (other.id === sla.id || !other.active || other.type !== sla.type) continue
    for (const id of sla.channels) {
      if (other.channels.includes(id)) {
        conflicts.push({ channelLabel: channelLabel(id), slaName: other.name })
      }
    }
  }
  return conflicts
}

/* ── lifecycle helpers ─────────────────────────────────────────────────── */

export function normalizeSla(sla: Sla): Sla {
  return { ...sla, name: sla.name.trim() }
}

/** First-response target is valid when its value ≥ 1. */
export function firstResponseValid(sla: Sla): boolean {
  return sla.target.value >= 1
}

/** Resolution is valid when the default and every value row have value ≥ 1
 * (and any rows require a chosen field). */
export function resolutionValid(resolution: ResolutionConfig): boolean {
  if (resolution.default.value < 1) return false
  if (resolution.rows.length && !resolution.fieldId) return false
  return resolution.rows.every((r) => r.value >= 1 && Boolean(r.optionId))
}

/** True when the SLA's type-relevant target is valid. */
export function targetValid(sla: Sla): boolean {
  return sla.type === 'first_response' ? firstResponseValid(sla) : resolutionValid(sla.resolution)
}

/** Create-mode defaults for a chosen type. */
export function defaultSla(type: SlaType): Sla {
  return {
    id: `sla_${Date.now().toString(36)}`,
    type,
    name: '',
    active: true,
    channels: [],
    countBusinessHoursOnly: true,
    target: { value: 1, unit: 'hours' },
    resolution: { fieldId: '', default: { value: 48, unit: 'hours' }, rows: [] },
  }
}
