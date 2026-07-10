// SLA policy store — module-scope reactive list persisted to localStorage.
// Persistence is explicit (upsert/toggleActive call persist()) rather than a
// deep watcher, so editor drafts (deep copies) can never write accidentally.
import { ref } from 'vue'
import { SEED_POLICIES, type Policy } from '@/data/slaData'
import { channelConflicts } from '@/lib/sla'

const STORAGE_KEY = 'trengo_sla_policies'
// v2: schedule → scheduleId. v3: channel-only scoping — dropped teams /
// hoursMode / scheduleId, added countBusinessHoursOnly. v4: dropped warnMinutes.
// v5: targets always-on — dropped TargetSetting.enabled. v6: re-added
// TargetSetting.enabled (per-target on/off toggles).
const SCHEMA_VERSION = 6

interface StoredShape {
  version: number
  policies: Policy[]
}

function seed(): Policy[] {
  return structuredClone(SEED_POLICIES)
}

function load(): Policy[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return seed()
    const parsed = JSON.parse(raw) as StoredShape
    // Version/shape mismatch (schema drift while iterating) → discard & reseed.
    if (parsed?.version !== SCHEMA_VERSION || !Array.isArray(parsed.policies)) return seed()
    return parsed.policies
  } catch {
    return seed()
  }
}

const policies = ref<Policy[]>(load())
persist() // ensure first-load seed is written

function persist() {
  try {
    const payload: StoredShape = { version: SCHEMA_VERSION, policies: policies.value }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload))
  } catch {
    // Private mode / quota: degrade to in-memory only — prototype keeps working.
  }
}

function upsert(policy: Policy) {
  const i = policies.value.findIndex((p) => p.id === policy.id)
  if (i === -1) policies.value.push(policy)
  else policies.value[i] = policy
  persist()
}

export type ToggleResult = { ok: true } | { ok: false; message: string }

/**
 * Flip a policy's active state. Deactivating is always allowed; ACTIVATING
 * re-runs the per-channel overlap check — the editor only validates on save,
 * so without this an inactive policy could silently claim a channel an active
 * policy already uses.
 */
function toggleActive(id: string): ToggleResult {
  const p = policies.value.find((p) => p.id === id)
  if (!p) return { ok: false, message: 'Policy not found.' }
  if (!p.active) {
    const conflicts = channelConflicts(p, policies.value)
    if (conflicts.length) {
      const c = conflicts[0]
      return {
        ok: false,
        message: `Can't activate — ${c.channelLabel} is already used by “${c.policyName}”.`,
      }
    }
  }
  p.active = !p.active
  persist()
  return { ok: true }
}

function removePolicy(id: string) {
  policies.value = policies.value.filter((p) => p.id !== id)
  persist()
}

function byId(id: string): Policy | undefined {
  return policies.value.find((p) => p.id === id)
}

export function useSlaPolicies() {
  return { policies, upsert, toggleActive, removePolicy, byId }
}
