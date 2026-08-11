<script setup lang="ts">
// SlaEditor — create + edit a single policy, rebuilt pixel-perfect from the
// Figma redesign (file mO3tiRGCXVwTBfgbgQzZ4L, node 6953:25932): sticky
// frosted header (back + H4 title + Cancel / Save changes pills), one card
// with full-bleed dividers between rows, and an info summary banner.
// Works on a deep-copied draft; nothing touches the store until Save.
import { computed, onMounted, reactive, ref, watch } from 'vue'
import Icon from '@/components/Icon.vue'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { Tooltip } from '@/components/ui/tooltip'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { useSlaNavV2 } from '@/composables/useSlaNavV2'
import { useSlaPoliciesV2 } from '@/composables/useSlaPoliciesV2'
import { useCustomFieldsAvailable } from '@/composables/useCustomFieldsAvailable'
import { CHANNELS, CUSTOM_FIELDS, SLA_TOOLTIPS, type Policy } from '@/data/slaDataV2'
import {
  channelConflicts,
  defaultPolicy,
  normalizePolicy,
  optionLabel,
  resolutionValid,
  summaryParts,
} from '@/lib/slaV2'
import MultiSelect from './MultiSelect.vue'
import SettingRow from './SettingRow.vue'
import UnitSelect from './UnitSelect.vue'

const props = defineProps<{ editId: string | null }>()

const { goOverview } = useSlaNavV2()
const { policies, byId, upsert } = useSlaPoliciesV2()
const { customFieldsAvailable } = useCustomFieldsAvailable()

/* ── draft ─────────────────────────────────────────────────────────────── */

/** JSON deep copy — policies are JSON-safe, and unlike structuredClone this
 * also works on Vue reactive proxies (store items and the draft). */
function deepCopy<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T
}

const source = props.editId ? byId(props.editId) : undefined
const isEdit = Boolean(source)

const draft = reactive<Policy>(deepCopy(source ?? defaultPolicy()))

// Guard: an unknown ?id would render a blank editor — fall back to overview.
onMounted(() => {
  if (props.editId && !source) goOverview()
})

/** The draft as a normalized Policy, for logic helpers and saving. */
const asPolicy = computed<Policy>(() => normalizePolicy(deepCopy(draft)))

/* ── validation ────────────────────────────────────────────────────────── */

const noChannels = computed(() => draft.channels.length === 0)

// Errors must be reactive, not preemptive: a fresh create shows a muted
// helper; the red error only appears after the user HAD channels and removed
// the last one.
const hadChannels = ref(draft.channels.length > 0)
watch(
  () => draft.channels.length,
  (n) => {
    if (n > 0) hadChannels.value = true
  },
)

// At least one target must be enabled (a policy with none measures nothing).
const noTargets = computed(
  () => !draft.targets.firstReply.enabled && !draft.targets.resolution.enabled,
)

// Only enabled targets need valid (≥ 1) values. Resolution validates its
// default + every label row (see resolutionValid).
const targetValuesInvalid = computed(
  () =>
    (draft.targets.firstReply.enabled && draft.targets.firstReply.value < 1) ||
    !resolutionValid(draft.targets.resolution),
)

/** Per-channel overlap against other ACTIVE policies — a hard block (V1 rule). */
const conflicts = computed(() => channelConflicts(asPolicy.value, policies.value))

/** Channels owned by another active policy → disabled in the picker. */
const usedElsewhere = computed<Record<string, string>>(() => {
  const map: Record<string, string> = {}
  for (const other of policies.value) {
    if (other.id === draft.id || !other.active) continue
    for (const id of other.channels) map[id] = 'Already used'
  }
  return map
})

const canSave = computed(
  () =>
    draft.name.trim().length > 0 &&
    !noChannels.value &&
    !noTargets.value &&
    !targetValuesInvalid.value &&
    !conflicts.value.length,
)

const summary = computed(() => {
  const p = asPolicy.value
  // When simulating "no custom fields", the plain-terms line reflects the
  // default-only resolution (the by-value rows aren't shown/used).
  if (hasCustomFields.value) return summaryParts(p)
  return summaryParts({
    ...p,
    targets: { ...p.targets, resolution: { ...p.targets.resolution, rows: [] } },
  })
})

/* ── actions ───────────────────────────────────────────────────────────── */

function save() {
  if (!canSave.value) return
  upsert(asPolicy.value)
  goOverview()
}

/** Clamp a number input to a positive integer (0 = invalid, blocks Save). */
function clampInt(v: string | number | undefined): number {
  const n = Math.floor(Number(v))
  return Number.isFinite(n) && n > 0 ? n : 0
}

/* ── resolution by question type ─────────────────────────────────────────── */

const resolution = computed(() => draft.targets.resolution)

/** Whether the workspace has any eligible (dropdown ticket) custom field.
 * The prototype toggle can simulate "none" to demo the empty state. */
const hasCustomFields = computed(() => customFieldsAvailable.value && CUSTOM_FIELDS.length > 0)

/** Options for the "Vary resolution by" field picker (blank = no variation). */
const fieldOptions = [
  { value: '', label: 'No variation' },
  ...CUSTOM_FIELDS.map((f) => ({ value: f.id, label: f.name })),
]

/** The chosen field's options not yet used by a row — the "Add value" pool. */
const availableOptions = computed(() => {
  const field = CUSTOM_FIELDS.find((f) => f.id === resolution.value.fieldId)
  if (!field) return []
  const used = new Set(resolution.value.rows.map((r) => r.optionId))
  return field.options.filter((o) => !used.has(o.id))
})

// Picking a field auto-lists all its option values as rows (pre-filled at the
// default) so the setup is visible immediately — the user tweaks the ones that
// differ and removes any they don't want. Clearing the field removes the rows.
// Fires only on user change, so a saved policy's curated rows are preserved.
watch(
  () => resolution.value.fieldId,
  (fieldId) => {
    const field = CUSTOM_FIELDS.find((f) => f.id === fieldId)
    const d = resolution.value.default
    resolution.value.rows = field
      ? field.options.map((o) => ({
          id: `row_${o.id}_${Date.now().toString(36)}`,
          optionId: o.id,
          value: d.value,
          unit: d.unit,
        }))
      : []
  },
)

const addMenuOpen = ref(false)

function addRow(optionId: string) {
  const d = resolution.value.default
  resolution.value.rows.push({
    id: `row_${Date.now().toString(36)}`,
    optionId,
    value: d.value,
    unit: d.unit,
  })
  addMenuOpen.value = false
}

function removeRow(id: string) {
  resolution.value.rows = resolution.value.rows.filter((r) => r.id !== id)
}

// Template ref on the Input component — focus its root <input> element.
const nameInput = ref<InstanceType<typeof Input> | null>(null)
onMounted(() => {
  if (!isEdit) (nameInput.value?.$el as HTMLInputElement | undefined)?.focus()
})
</script>

<template>
  <div class="flex w-full flex-col">
    <!-- Sticky frosted header: back + title + Cancel / Save changes -->
    <header
      class="sticky top-0 z-10 h-20 w-full bg-grey-100/70 px-6 pb-4 pt-6 backdrop-blur-[12px]"
    >
      <div class="mx-auto flex h-full w-full max-w-[820px] items-center gap-3">
      <Tooltip text="Back">
        <button
          type="button"
          aria-label="Back"
          class="flex size-10 shrink-0 items-center justify-center rounded-lg text-grey-900 transition-colors hover:bg-grey-200 focus:outline-none focus-visible:shadow-focus-sm"
          @click="goOverview()"
        >
          <Icon name="ArrowLeft" :size="20" />
        </button>
      </Tooltip>
      <h1 class="min-w-0 flex-1 truncate text-xl font-bold text-grey-900">
        {{ draft.name || 'New policy' }}
      </h1>
      <div class="flex shrink-0 items-center gap-3">
        <Button variant="outline" @click="goOverview()">Cancel</Button>
        <Button :disabled="!canSave" @click="save">Save changes</Button>
      </div>
      </div>
    </header>

    <!-- Body: 820px content column, centered -->
    <div class="mx-auto flex w-full max-w-[868px] flex-col gap-5 px-6 pb-8 pt-2">
      <!-- The single settings card: rows separated by full-bleed dividers -->
      <div class="flex w-full flex-col gap-6 rounded-lg border border-grey-300 bg-white py-6">
        <!-- SLA name -->
        <SettingRow icon="TextBlock" label="SLA name">
          <Input
            ref="nameInput"
            v-model="draft.name"
            type="text"
            placeholder="Name this policy"
            class="w-64 rounded-base border-grey-400 text-base font-medium text-grey-700"
          />
        </SettingRow>

        <div class="h-px w-full bg-grey-300" />

        <!-- Connect to a channel -->
        <SettingRow
          icon="Share"
          label="Connect to a channel"
          description="Which channels this policy watches."
        >
          <template #below>
            <div class="mt-4">
              <MultiSelect
                v-model="draft.channels"
                :groups="CHANNELS"
                :disabled-items="usedElsewhere"
                searchable
                placeholder="Select channels…"
              />
              <p
                v-if="noChannels"
                class="mt-2 text-sm font-medium"
                :class="hadChannels ? 'text-error-500' : 'text-grey-600'"
              >
                {{
                  hadChannels
                    ? 'No channels selected — this policy applies to nothing'
                    : 'Choose at least one channel.'
                }}
              </p>
            </div>
          </template>
        </SettingRow>

        <div class="h-px w-full bg-grey-300" />

        <!-- First reply -->
        <SettingRow
          icon="Reply"
          label="First response"
          :tooltip="SLA_TOOLTIPS.firstReply"
          description="Time until the first reply, from AI or a person"
        >
          <div class="flex items-center gap-2">
            <Input
              :model-value="draft.targets.firstReply.value || ''"
              type="number"
              min="1"
              step="1"
              :disabled="!draft.targets.firstReply.enabled"
              class="w-[85px] rounded-base border-grey-400 text-base font-medium text-grey-700 shadow-100 tabular-nums"
              @update:model-value="draft.targets.firstReply.value = clampInt($event)"
            />
            <UnitSelect
              v-model="draft.targets.firstReply.unit"
              class="w-[119px]"
              :disabled="!draft.targets.firstReply.enabled"
              :options="[
                { value: 'minutes', label: 'Minutes' },
                { value: 'hours', label: 'Hours' },
              ]"
            />
          </div>
          <!-- Lock the last enabled target so ≥1 can't be turned off -->
          <Switch
            v-model="draft.targets.firstReply.enabled"
            :disabled="draft.targets.firstReply.enabled && !draft.targets.resolution.enabled"
          />
        </SettingRow>

        <div class="h-px w-full bg-grey-300" />

        <!-- Resolution — varies by the value of a single-select custom ticket
             field. Default row is mandatory; value rows re-scope resolution
             within the policy (topmost match wins). -->
        <SettingRow
          icon="Check"
          label="Resolution"
          :tooltip="SLA_TOOLTIPS.resolution"
          description="Time until the ticket is closed. Set a different target per custom field value."
        >
          <Switch
            v-model="draft.targets.resolution.enabled"
            :disabled="draft.targets.resolution.enabled && !draft.targets.firstReply.enabled"
          />
          <template #below>
            <div
              class="mt-4 pl-11"
              :class="!draft.targets.resolution.enabled && 'pointer-events-none opacity-50'"
            >
              <!-- Field picker (eligible custom fields exist) -->
              <div
                v-if="hasCustomFields"
                class="flex items-center gap-3 border-b border-grey-200 py-2"
              >
                <span class="min-w-0 flex-1 text-sm font-medium text-grey-600">
                  Vary by custom field:
                </span>
                <UnitSelect
                  v-model="draft.targets.resolution.fieldId"
                  class="w-[212px]"
                  :options="fieldOptions"
                />
                <span class="size-7 shrink-0" aria-hidden="true" />
              </div>

              <!-- No eligible custom field: a polished callout (the default row
                   below still keeps the base target working). -->
              <div
                v-else
                class="mb-2 flex items-center gap-4 rounded-lg border border-grey-300 bg-grey-100 p-4"
              >
                <p class="min-w-0 flex-1 text-sm text-grey-700">
                  No dropdown ticket field yet, create one to set targets by ticket type.
                </p>
                <Button variant="outline" size="sm" class="shrink-0">
                  <Icon name="Plus" :size="16" />
                  Create custom field
                </Button>
              </div>

              <!-- Value rows (only when a field is chosen; topmost match wins).
                   Hidden when no eligible custom field (prototype sim). -->
              <div
                v-for="row in (hasCustomFields ? draft.targets.resolution.rows : [])"
                :key="row.id"
                class="flex items-center gap-3 border-b border-grey-200 py-2"
              >
                <span class="min-w-0 flex-1 truncate text-sm font-medium text-grey-700">
                  {{ optionLabel(draft.targets.resolution.fieldId, row.optionId) }}
                </span>
                <div class="flex items-center gap-2">
                  <Input
                    :model-value="row.value || ''"
                    type="number"
                    min="1"
                    step="1"
                    class="w-[85px] rounded-base border-grey-400 text-base font-medium text-grey-700 shadow-100 tabular-nums"
                    @update:model-value="row.value = clampInt($event)"
                  />
                  <UnitSelect
                    v-model="row.unit"
                    class="w-[119px]"
                    :options="[
                      { value: 'hours', label: 'Hours' },
                      { value: 'days', label: 'Days' },
                    ]"
                  />
                </div>
                <button
                  type="button"
                  :aria-label="`Remove ${optionLabel(draft.targets.resolution.fieldId, row.optionId)}`"
                  class="flex size-7 shrink-0 items-center justify-center rounded-base text-grey-500 transition-colors hover:bg-grey-200 hover:text-grey-900 focus:outline-none focus-visible:shadow-focus-sm"
                  @click="removeRow(row.id)"
                >
                  <Icon name="Cross" :size="16" />
                </button>
              </div>

              <!-- Default row — always present, not removable. No divider below:
                   it's the last row. -->
              <div class="flex items-center gap-3 py-2">
                <span class="min-w-0 flex-1 truncate text-sm font-medium text-grey-600">
                  All other conversations
                </span>
                <div class="flex items-center gap-2">
                  <Input
                    :model-value="draft.targets.resolution.default.value || ''"
                    type="number"
                    min="1"
                    step="1"
                    class="w-[85px] rounded-base border-grey-400 text-base font-medium text-grey-700 shadow-100 tabular-nums"
                    @update:model-value="draft.targets.resolution.default.value = clampInt($event)"
                  />
                  <UnitSelect
                    v-model="draft.targets.resolution.default.unit"
                    class="w-[119px]"
                    :options="[
                      { value: 'hours', label: 'Hours' },
                      { value: 'days', label: 'Days' },
                    ]"
                  />
                </div>
                <span class="size-7 shrink-0" aria-hidden="true" />
              </div>

              <!-- Add a value of the chosen field -->
              <Popover
                v-if="hasCustomFields && draft.targets.resolution.fieldId"
                v-model:open="addMenuOpen"
              >
                <PopoverTrigger as-child>
                  <button
                    type="button"
                    :disabled="!availableOptions.length"
                    class="mt-2 inline-flex items-center gap-1.5 rounded-base px-2 py-1.5 text-sm font-semibold text-leaf-700 transition-colors hover:bg-grey-100 focus:outline-none focus-visible:shadow-focus-sm disabled:pointer-events-none disabled:opacity-50"
                  >
                    <Icon name="Plus" :size="16" />
                    Add value
                  </button>
                </PopoverTrigger>
                <PopoverContent align="start" class="w-56 p-1">
                  <button
                    v-for="o in availableOptions"
                    :key="o.id"
                    type="button"
                    class="flex w-full items-center rounded-base px-2 py-1.5 text-sm font-medium text-grey-700 transition-colors hover:bg-grey-100"
                    @click="addRow(o.id)"
                  >
                    {{ o.value }}
                  </button>
                </PopoverContent>
              </Popover>
            </div>
          </template>
        </SettingRow>

        <div class="h-px w-full bg-grey-300" />

        <!-- Count business hours only. NOTE: a channel with no schedule
             configured falls back to 24/7 for this policy — the toggle simply
             has no effect there (registry decision, no warning). -->
        <SettingRow
          icon="Clock"
          label="Count business hours only"
          :tooltip="SLA_TOOLTIPS.businessHours"
          description="The clock pauses outside each channel's business hours."
        >
          <Switch v-model="draft.countBusinessHoursOnly" />
        </SettingRow>
      </div>

      <!-- Plain-language summary (inline banner) -->
      <div class="flex w-full items-center gap-2 rounded-lg border border-grey-300 bg-grey-200 p-3">
        <Icon name="Info" :size="24" class="shrink-0 text-grey-800" />
        <p class="min-w-0 flex-1 text-sm font-medium text-grey-800">
          <span v-for="(part, i) in summary" :key="i" :class="part.strong && 'font-semibold'">{{
            part.text
          }}</span>
        </p>
      </div>

      <!-- Channel overlap: hard-block backstop (the picker already disables
           channels owned by other active policies) -->
      <div
        v-if="conflicts.length"
        class="rounded-lg border border-error-500 bg-error-bg px-5 py-4 text-sm text-grey-900"
      >
        <p v-for="c in conflicts" :key="c.channelLabel + c.policyName">
          <span class="font-semibold">{{ c.channelLabel }}</span> is already used by
          “{{ c.policyName }}”.
        </p>
        <p class="mt-1 text-xs text-grey-700">A channel can belong to one policy at a time.</p>
      </div>
    </div>
  </div>
</template>
