// SLA store (Iteration 3) — module-scope reactive list persisted to localStorage.
// Persistence is explicit (upsert/toggleActive call persist()) rather than a
// deep watcher, so editor drafts (deep copies) can never write accidentally.
import { ref } from 'vue'
import { SEED_SLAS, type Sla } from '@/data/slaDataV3'
import { channelConflicts } from '@/lib/slaV3'

const STORAGE_KEY = 'trengo_sla_policies_v3'
// v8: cloned from Iteration 2 (bundled policy: firstReply + resolution). v9:
// Iteration 3 — TYPED SLAs (one type each), so the stored shape changes and
// old v8 data reseeds.
const SCHEMA_VERSION = 9

interface StoredShape {
  version: number
  slas: Sla[]
}

function seed(): Sla[] {
  return structuredClone(SEED_SLAS)
}

function load(): Sla[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return seed()
    const parsed = JSON.parse(raw) as StoredShape
    // Version/shape mismatch (schema drift while iterating) → discard & reseed.
    if (parsed?.version !== SCHEMA_VERSION || !Array.isArray(parsed.slas)) return seed()
    return parsed.slas
  } catch {
    return seed()
  }
}

const slas = ref<Sla[]>(load())
persist() // ensure first-load seed is written

function persist() {
  try {
    const payload: StoredShape = { version: SCHEMA_VERSION, slas: slas.value }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload))
  } catch {
    // Private mode / quota: degrade to in-memory only — prototype keeps working.
  }
}

function upsert(sla: Sla) {
  const i = slas.value.findIndex((s) => s.id === sla.id)
  if (i === -1) slas.value.push(sla)
  else slas.value[i] = sla
  persist()
}

export type ToggleResult = { ok: true } | { ok: false; message: string }

/**
 * Flip an SLA's active state. Deactivating is always allowed; ACTIVATING re-runs
 * the per-type overlap check — the editor only validates on save, so without
 * this an inactive SLA could silently claim a channel an active SLA of the same
 * type already uses.
 */
function toggleActive(id: string): ToggleResult {
  const s = slas.value.find((s) => s.id === id)
  if (!s) return { ok: false, message: 'SLA not found.' }
  if (!s.active) {
    const conflicts = channelConflicts(s, slas.value)
    if (conflicts.length) {
      const c = conflicts[0]
      return {
        ok: false,
        message: `Can't activate — ${c.channelLabel} already has an SLA of this type (“${c.slaName}”).`,
      }
    }
  }
  s.active = !s.active
  persist()
  return { ok: true }
}

function removeSla(id: string) {
  slas.value = slas.value.filter((s) => s.id !== id)
  persist()
}

function byId(id: string): Sla | undefined {
  return slas.value.find((s) => s.id === id)
}

export function useSlaPoliciesV3() {
  return { slas, upsert, toggleActive, removeSla, byId }
}
