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
import { useSlaNav } from '@/composables/useSlaNav'
import { useSlaPolicies } from '@/composables/useSlaPolicies'
import { CHANNELS, SLA_TOOLTIPS, type Policy } from '@/data/slaData'
import { channelConflicts, defaultPolicy, normalizePolicy, summaryParts } from '@/lib/sla'
import MultiSelect from './MultiSelect.vue'
import SettingRow from './SettingRow.vue'
import UnitSelect from './UnitSelect.vue'

const props = defineProps<{ editId: string | null }>()

const { goOverview } = useSlaNav()
const { policies, byId, upsert } = useSlaPolicies()

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

const targetValuesInvalid = computed(
  () => draft.targets.firstReply.value < 1 || draft.targets.resolution.value < 1,
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
    !targetValuesInvalid.value &&
    !conflicts.value.length,
)

const summary = computed(() => summaryParts(asPolicy.value))

/* ── actions ───────────────────────────────────────────────────────────── */

function save() {
  if (!canSave.value) return
  upsert(asPolicy.value)
  goOverview()
}

/** Clamp a target value input to a positive integer (0 = invalid, blocks Save). */
function onValueInput(target: 'firstReply' | 'resolution', v: string | number | undefined) {
  const n = Math.floor(Number(v))
  draft.targets[target].value = Number.isFinite(n) && n > 0 ? n : 0
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
          label="First reply"
          :tooltip="SLA_TOOLTIPS.firstReply"
          description="Time until the first agent reply"
        >
          <Input
            :model-value="draft.targets.firstReply.value || ''"
            type="number"
            min="1"
            step="1"
            class="w-[85px] rounded-base border-grey-400 text-base font-medium text-grey-700 shadow-100 tabular-nums"
            @update:model-value="onValueInput('firstReply', $event)"
          />
          <UnitSelect
            v-model="draft.targets.firstReply.unit"
            class="w-[119px]"
            :options="[
              { value: 'minutes', label: 'Minutes' },
              { value: 'hours', label: 'Hours' },
            ]"
          />
        </SettingRow>

        <div class="h-px w-full bg-grey-300" />

        <!-- Resolution -->
        <SettingRow
          icon="Check"
          label="Resolution"
          :tooltip="SLA_TOOLTIPS.resolution"
          description="Time until the conversation is closed"
        >
          <Input
            :model-value="draft.targets.resolution.value || ''"
            type="number"
            min="1"
            step="1"
            class="w-[85px] rounded-base border-grey-400 text-base font-medium text-grey-700 shadow-100 tabular-nums"
            @update:model-value="onValueInput('resolution', $event)"
          />
          <UnitSelect
            v-model="draft.targets.resolution.unit"
            class="w-[119px]"
            :options="[
              { value: 'hours', label: 'Hours' },
              { value: 'days', label: 'Days' },
            ]"
          />
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
