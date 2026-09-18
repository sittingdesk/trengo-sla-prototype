// Pure SLA business logic (Iteration 4) — no Vue, no storage. Everything the
// overview and editor render is derived here so behaviour stays consistent.
// Iteration 4 works with TYPED SLAs (first_response | resolution) that share ONE
// target shape, so the target helpers below are type-agnostic: only the sentence
// verb differs, and only resolution ever fills in the by-value rows. Coverage
// and channel exclusivity remain per type.
import {
  ALL_CHANNEL_ITEMS,
  CUSTOM_FIELDS,
  SLA_TYPE_META,
  type Duration,
  type Sla,
  type SlaType,
  type TargetConfig,
  type TimeUnit,
} from '@/data/slaDataV4'

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
 * Channel part of a sentence. Multiple instances of one channel type (e.g. two
 * WhatsApp numbers) collapse to "WhatsApp (2 numbers)". Pass `max` to cap the
 * list at N names and append "+N more" — used by the overview row so the target
 * never gets pushed out; omit it to name every channel (editor summary).
 */
export function channelsLabel(channels: string[], max?: number): string {
  const groups = new Map<string, number>()
  for (const id of channels) {
    const base = channelLabel(id).replace(/\s*\(.*\)$/, '')
    groups.set(base, (groups.get(base) ?? 0) + 1)
  }
  const names = [...groups.entries()].map(([base, n]) => {
    if (n > 1) return `${base} (${n} numbers)`
    const id = channels.find((c) => channelLabel(c).startsWith(base))
    return id ? channelLabel(id) : base
  })
  // Uncapped (editor summary, dialogs): prose-style "A + B + C".
  if (max === undefined) return names.join(' + ')
  // Capped (overview row): comma-separated, with "+N more" once over the cap —
  // one separator style so short and collapsed rows read the same.
  if (names.length <= max) return names.join(', ')
  return `${names.slice(0, max).join(', ')} +${names.length - max} more`
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

/** "1 hour" not "1 hours" — first-response targets are often exactly 1. */
function durationText(d: Duration): string {
  return `${d.value} ${d.value === 1 ? d.unit.slice(0, -1) : d.unit}`
}

/** Rows equal to the default are no-ops — only differing rows are meaningful. */
function differingRows(target: TargetConfig): TargetConfig['rows'] {
  const d = target.default
  return target.rows.filter((r) => r.value !== d.value || r.unit !== d.unit)
}

/** Plain-language one-liner for an SLA row on the overview. Leads with the type
 * ("Resolution for Info email …") so the row says what it is without a badge;
 * the target then drops the now-redundant reply/resolve verb. */
export function scopeSentence(sla: Sla): string {
  const parts = [`${SLA_TYPE_META[sla.type].label} for ${channelsLabel(sla.channels, 2)}`]
  let clause = `within ${sla.target.default.value}${shortUnit(sla.target.default.unit)}`
  const diff = differingRows(sla.target).length
  if (diff) clause += ` +${diff} by type`
  parts.push(clause)
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

/** Target clause parts: the default duration + a bracketed by-value list.
 * Type-agnostic — both first response and resolution read the same way. */
function targetClause(target: TargetConfig): SummaryPart[] {
  const parts: SummaryPart[] = []
  parts.push({ text: durationText(target.default), strong: true })
  const diff = differingRows(target)
  if (diff.length) {
    const byDuration = new Map<string, string[]>()
    for (const r of diff) {
      const key = durationText(r)
      byDuration.set(key, [...(byDuration.get(key) ?? []), optionLabel(target.fieldId, r.optionId)])
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
  const parts: SummaryPart[] = [{ text: 'In plain terms: tickets on ' }]
  parts.push({ text: channelsLabel(sla.channels) || '(no channels)', strong: true })
  parts.push({
    text:
      sla.type === 'first_response' ? ' get a first response within ' : ' are resolved within ',
  })
  parts.push(...targetClause(sla.target))
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

/**
 * Trim the name, and strip any custom-field variation from a type that doesn't
 * offer it (first response). Enforced here rather than trusted from the editor,
 * so a stored SLA can never carry rows the UI won't show — which would leak into
 * the scope sentence and the plain-terms summary.
 */
export function normalizeSla(sla: Sla): Sla {
  const name = sla.name.trim()
  if (SLA_TYPE_META[sla.type].varyByField) return { ...sla, name }
  return { ...sla, name, target: { ...sla.target, fieldId: '', rows: [] } }
}

/**
 * A target is valid when the default and every value row are ≥ 1, and any rows
 * require a chosen field. One rule for both types; first response simply never
 * has rows.
 */
export function targetValid(sla: Sla): boolean {
  const t = sla.target
  if (t.default.value < 1) return false
  if (t.rows.length && !t.fieldId) return false
  return t.rows.every((r) => r.value >= 1 && Boolean(r.optionId))
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
    target: { fieldId: '', default: { ...SLA_TYPE_META[type].defaultTarget }, rows: [] },
  }
}
