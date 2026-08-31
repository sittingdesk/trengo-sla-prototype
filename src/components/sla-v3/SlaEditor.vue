<script setup lang="ts">
// SlaEditor (Iteration 3) — create + edit a single TYPED SLA. The type is fixed
// (chosen in the picker on create, or the SLA's own type on edit) and shown as a
// badge in the header. The editor renders only the target that matches the type:
// first_response → one flat duration; resolution → the custom-field variation
// block. Works on a deep-copied draft; nothing touches the store until Save.
import { computed, onMounted, reactive, ref, watch } from 'vue'
import Icon from '@/components/Icon.vue'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { Tooltip } from '@/components/ui/tooltip'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { useSlaNavV3 } from '@/composables/useSlaNavV3'
import { useSlaPoliciesV3 } from '@/composables/useSlaPoliciesV3'
import { useCustomFieldsAvailable } from '@/composables/useCustomFieldsAvailable'
import {
  ALL_CHANNEL_ITEMS,
  CUSTOM_FIELDS,
  SLA_TOOLTIPS,
  SLA_TYPE_META,
  type Sla,
  type SlaType,
} from '@/data/slaDataV3'
import {
  channelConflicts,
  defaultSla,
  normalizeSla,
  optionLabel,
  summaryParts,
  targetValid,
} from '@/lib/slaV3'
import MultiSelect from './MultiSelect.vue'
import SettingRow from './SettingRow.vue'
import UnitSelect from './UnitSelect.vue'

const props = defineProps<{ editId: string | null }>()

const { nav, goOverview } = useSlaNavV3()
const { slas, byId, upsert } = useSlaPoliciesV3()
const { customFieldsAvailable } = useCustomFieldsAvailable()

/* ── draft ─────────────────────────────────────────────────────────────── */

/** JSON deep copy — SLAs are JSON-safe, and unlike structuredClone this also
 * works on Vue reactive proxies (store items and the draft). */
function deepCopy<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T
}

const source = props.editId ? byId(props.editId) : undefined
const isEdit = Boolean(source)

// Type is fixed: from the SLA (edit) or the picker choice (create; falls back to
// first_response if somehow reached without a chosen type).
const slaType: SlaType = source?.type ?? nav.value.createType ?? 'first_response'
const typeMeta = SLA_TYPE_META[slaType]

const draft = reactive<Sla>(deepCopy(source ?? defaultSla(slaType)))

// Guard: an unknown ?id would render a blank editor — fall back to overview.
onMounted(() => {
  if (props.editId && !source) goOverview()
})

/** The draft as a normalized SLA, for logic helpers and saving. */
const asSla = computed<Sla>(() => normalizeSla(deepCopy(draft)))

/** Channels as ONE unnamed group — the picker is a flat list (no type headings). */
const channelOptions = [{ group: '', items: ALL_CHANNEL_ITEMS }]

/* ── validation ────────────────────────────────────────────────────────── */

const noChannels = computed(() => draft.channels.length === 0)

// Errors must be reactive, not preemptive: a fresh create shows a muted helper;
// the red error only appears after the user HAD channels and removed the last.
const hadChannels = ref(draft.channels.length > 0)
watch(
  () => draft.channels.length,
  (n) => {
    if (n > 0) hadChannels.value = true
  },
)

const targetInvalid = computed(() => !targetValid(asSla.value))

/** Per-type overlap against other ACTIVE SLAs of the same type — a hard block. */
const conflicts = computed(() => channelConflicts(asSla.value, slas.value))

/** Channels owned by another active SLA OF THE SAME TYPE → disabled in the picker. */
const usedElsewhere = computed<Record<string, string>>(() => {
  const map: Record<string, string> = {}
  for (const other of slas.value) {
    if (other.id === draft.id || !other.active || other.type !== draft.type) continue
    for (const id of other.channels) map[id] = 'Already used'
  }
  return map
})

const canSave = computed(
  () =>
    draft.name.trim().length > 0 &&
    !noChannels.value &&
    !targetInvalid.value &&
    !conflicts.value.length,
)

const summary = computed(() => {
  const s = asSla.value
  // When simulating "no custom fields", the plain-terms line reflects the
  // default-only resolution (the by-value rows aren't shown/used).
  if (s.type === 'resolution' && !hasCustomFields.value) {
    return summaryParts({ ...s, resolution: { ...s.resolution, rows: [] } })
  }
  return summaryParts(s)
})

/* ── actions ───────────────────────────────────────────────────────────── */

function save() {
  if (!canSave.value) return
  upsert(asSla.value)
  goOverview()
}

/** Clamp a number input to a positive integer (0 = invalid, blocks Save). */
function clampInt(v: string | number | undefined): number {
  const n = Math.floor(Number(v))
  return Number.isFinite(n) && n > 0 ? n : 0
}

/* ── resolution by custom field (resolution type only) ─────────────────── */

const resolution = computed(() => draft.resolution)

/** Whether the workspace has any eligible (dropdown ticket) custom field.
 * The prototype toggle can simulate "none" to demo the empty state. */
const hasCustomFields = computed(() => customFieldsAvailable.value && CUSTOM_FIELDS.length > 0)

/** Options for the "Vary by custom field" picker (blank = no variation). */
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
// default). Fires only on user change, so a saved SLA's curated rows are kept.
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
    <!-- Sticky frosted header: back + title + type badge + Cancel / Save -->
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
        <h1 class="min-w-0 truncate text-xl font-bold text-grey-900">
          {{ draft.name || 'New SLA' }}
        </h1>
        <span
          class="inline-flex shrink-0 items-center gap-1 rounded-pill bg-grey-200 px-2.5 py-1 text-xs font-semibold text-grey-700"
        >
          <Icon :name="typeMeta.icon" :size="14" />
          {{ typeMeta.label }}
        </span>
        <div class="ml-auto flex shrink-0 items-center gap-3">
          <Button variant="outline" @click="goOverview()">Cancel</Button>
          <Button :disabled="!canSave" @click="save">Save changes</Button>
        </div>
      </div>
    </header>

    <!-- Body: 820px content column, centered -->
    <div class="mx-auto flex w-full max-w-[868px] flex-col gap-5 px-6 pb-8 pt-2">
      <div class="flex w-full flex-col gap-6 rounded-lg border border-grey-300 bg-white py-6">
        <!-- SLA name -->
        <SettingRow icon="TextBlock" label="SLA name">
          <Input
            ref="nameInput"
            v-model="draft.name"
            type="text"
            placeholder="Name this SLA"
            class="w-64 rounded-base border-grey-400 text-base font-medium text-grey-700"
          />
        </SettingRow>

        <div class="h-px w-full bg-grey-300" />

        <!-- Connect to a channel -->
        <SettingRow
          icon="Share"
          label="Connect to a channel"
          description="Which channels this SLA watches."
        >
          <template #below>
            <div class="mt-4">
              <MultiSelect
                v-model="draft.channels"
                :groups="channelOptions"
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
                    ? 'No channels selected — this SLA applies to nothing'
                    : 'Choose at least one channel.'
                }}
              </p>
            </div>
          </template>
        </SettingRow>

        <div class="h-px w-full bg-grey-300" />

        <!-- Target — first response: one flat duration -->
        <SettingRow
          v-if="draft.type === 'first_response'"
          icon="Reply"
          label="Target"
          :tooltip="SLA_TOOLTIPS.firstReply"
          description="Time until the first reply, from AI or a person."
        >
          <div class="flex items-center gap-2">
            <Input
              :model-value="draft.target.value || ''"
              type="number"
              min="1"
              step="1"
              class="w-[85px] rounded-base border-grey-400 text-base font-medium text-grey-700 shadow-100 tabular-nums"
              @update:model-value="draft.target.value = clampInt($event)"
            />
            <UnitSelect
              v-model="draft.target.unit"
              class="w-[119px]"
              :options="[
                { value: 'minutes', label: 'Minutes' },
                { value: 'hours', label: 'Hours' },
              ]"
            />
          </div>
        </SettingRow>

        <!-- Target — resolution: varies by the value of a custom ticket field -->
        <SettingRow
          v-else
          icon="Check"
          label="Target"
          :tooltip="SLA_TOOLTIPS.resolution"
          description="Time until the ticket is closed. Set a different target per custom field value."
        >
          <template #below>
            <div class="mt-4 pl-11">
              <!-- Field picker (eligible custom fields exist) -->
              <div
                v-if="hasCustomFields"
                class="flex items-center gap-3 border-b border-grey-200 py-2"
              >
                <span class="min-w-0 flex-1 text-sm font-medium text-grey-600">
                  Vary by custom field:
                </span>
                <UnitSelect
                  v-model="draft.resolution.fieldId"
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

              <!-- Value rows (only when a field is chosen; topmost match wins). -->
              <div
                v-for="row in (hasCustomFields ? draft.resolution.rows : [])"
                :key="row.id"
                class="flex items-center gap-3 border-b border-grey-200 py-2"
              >
                <span class="min-w-0 flex-1 truncate text-sm font-medium text-grey-700">
                  {{ optionLabel(draft.resolution.fieldId, row.optionId) }}
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
                  :aria-label="`Remove ${optionLabel(draft.resolution.fieldId, row.optionId)}`"
                  class="flex size-7 shrink-0 items-center justify-center rounded-base text-grey-500 transition-colors hover:bg-grey-200 hover:text-grey-900 focus:outline-none focus-visible:shadow-focus-sm"
                  @click="removeRow(row.id)"
                >
                  <Icon name="Cross" :size="16" />
                </button>
              </div>

              <!-- Default row — always present, not removable. -->
              <div class="flex items-center gap-3 py-2">
                <span class="min-w-0 flex-1 truncate text-sm font-medium text-grey-600">
                  All other conversations
                </span>
                <div class="flex items-center gap-2">
                  <Input
                    :model-value="draft.resolution.default.value || ''"
                    type="number"
                    min="1"
                    step="1"
                    class="w-[85px] rounded-base border-grey-400 text-base font-medium text-grey-700 shadow-100 tabular-nums"
                    @update:model-value="draft.resolution.default.value = clampInt($event)"
                  />
                  <UnitSelect
                    v-model="draft.resolution.default.unit"
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
                v-if="hasCustomFields && draft.resolution.fieldId"
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

        <!-- Count business hours only -->
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

      <!-- Channel overlap (same type): hard-block backstop -->
      <div
        v-if="conflicts.length"
        class="rounded-lg border border-error-500 bg-error-bg px-5 py-4 text-sm text-grey-900"
      >
        <p v-for="c in conflicts" :key="c.channelLabel + c.slaName">
          <span class="font-semibold">{{ c.channelLabel }}</span> already has a
          {{ typeMeta.label.toLowerCase() }} SLA (“{{ c.slaName }}”).
        </p>
        <p class="mt-1 text-xs text-grey-700">
          A channel can have one SLA of each type at a time.
        </p>
      </div>
    </div>
  </div>
</template>
