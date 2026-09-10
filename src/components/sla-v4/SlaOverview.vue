<script setup lang="ts">
// SlaOverview (Iteration 4) — ONE list of all SLAs (first response + resolution
// mixed), each row showing its type via a thumbnail + label, above a single
// combined coverage banner. Creating is type-first: "New SLA" opens a type
// picker, then the editor. Delete is gated behind a confirmation dialog.
import { computed, ref } from 'vue'
import Icon from '@/components/Icon.vue'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { useSlaNavV4 } from '@/composables/useSlaNavV4'
import { useSlaPoliciesV4 } from '@/composables/useSlaPoliciesV4'
import { useViewMode } from '@/composables/useViewMode'
import { useIteration } from '@/composables/useIteration'
import { channelsLabel, coverage, sortSlas } from '@/lib/slaV4'
import { SLA_TYPES, SLA_TYPE_META, type Sla, type SlaType } from '@/data/slaDataV4'
import PolicyRow from './PolicyRow.vue'
import PolicyRowSkeleton from './PolicyRowSkeleton.vue'

const { goEditor, goCreate } = useSlaNavV4()
const { slas, toggleActive, removeSla } = useSlaPoliciesV4()
const { iteration } = useIteration()
const { mode } = useViewMode()

/** Every SLA in one list: active first, then alphabetical (types interleave —
 * each row's thumbnail says which type it is). */
const sorted = computed<Sla[]>(() => sortSlas(slas.value))

/** Channels missing an SLA, per type — only the types that actually have gaps.
 * Coverage stays per type (a channel can have one but not the other); the
 * banner just presents both in one place. */
const coverageGaps = computed<{ type: SlaType; labels: string[] }[]>(() =>
  SLA_TYPES.flatMap((type) => {
    const c = coverage(slas.value, type)
    return c.ok ? [] : [{ type, labels: c.uncoveredLabels }]
  }),
)

const allCovered = computed(() => coverageGaps.value.length === 0)

// Which state the list renders in. Empty also covers the real zero-SLA case.
const showSkeleton = computed(() => mode.value === 'loading')
const showEmpty = computed(
  () => mode.value === 'empty' || (mode.value === 'normal' && slas.value.length === 0),
)

/** Brief per-row message when activation is refused (per-type overlap check). */
const rowError = ref<{ id: string; message: string } | null>(null)
let errorTimer: ReturnType<typeof setTimeout> | undefined

function onToggle(id: string) {
  const result = toggleActive(id)
  if (result.ok) {
    if (rowError.value?.id === id) rowError.value = null
    return
  }
  rowError.value = { id, message: result.message }
  clearTimeout(errorTimer)
  errorTimer = setTimeout(() => (rowError.value = null), 4000)
}

/* ── type-first creation ───────────────────────────────────────────────── */

const pickerOpen = ref(false)

function pick(type: SlaType) {
  pickerOpen.value = false
  goCreate(type)
}

/* ── delete ────────────────────────────────────────────────────────────── */

const pendingDelete = ref<Sla | null>(null)

function confirmDelete() {
  if (pendingDelete.value) removeSla(pendingDelete.value.id)
  pendingDelete.value = null
}
</script>

<template>
  <!-- 820px content column, centered — matches the editor -->
  <div class="mx-auto w-full max-w-[868px] px-6 py-10">
    <!-- Header -->
    <div class="flex items-start justify-between gap-4">
      <div>
        <div class="flex items-center gap-2">
          <h1 class="text-lg font-bold text-grey-900">Service level agreements</h1>
          <span class="rounded-pill bg-grey-200 px-2 py-0.5 text-xs font-semibold text-grey-600">
            Iteration {{ iteration }}
          </span>
        </div>
        <p class="mt-1 text-sm text-grey-600">
          Response-time promises, one SLA per type. Each channel can have one SLA of each type.
        </p>
      </div>
      <div class="shrink-0">
        <Button @click="pickerOpen = true">New SLA</Button>
      </div>
    </div>

    <!-- Loading: skeleton banner + rows -->
    <template v-if="showSkeleton">
      <div class="mt-6 h-[52px] w-full animate-pulse rounded-lg bg-grey-200" />
      <div class="mt-4 space-y-2">
        <PolicyRowSkeleton v-for="n in 3" :key="n" />
      </div>
    </template>

    <!-- Empty: no SLAs (toggle, or genuinely empty) -->
    <div v-else-if="showEmpty" class="flex flex-col items-center py-16 text-center">
      <div class="flex size-12 items-center justify-center rounded-lg border border-black/10 bg-white text-grey-700">
        <Icon name="Stopwatch" :size="24" />
      </div>
      <h2 class="mt-4 text-sm font-semibold text-grey-900">No SLAs yet</h2>
      <p class="mt-2 max-w-[480px] text-sm font-medium text-grey-700">
        Create your first SLA to set a response-time promise for a set of channels.
      </p>
      <Button class="mt-10" @click="pickerOpen = true">New SLA</Button>
    </div>

    <!-- Normal: one combined coverage banner + a single list of all SLAs -->
    <template v-else>
      <!-- Coverage across both types, in one banner -->
      <div
        class="mt-6 flex items-start gap-2 rounded-lg border p-3"
        :class="allCovered ? 'border-leaf-200 bg-leaf-100' : 'border-sun-300 bg-sun-100'"
      >
        <Icon
          v-if="allCovered"
          name="CheckCircle"
          :size="20"
          class="shrink-0 text-leaf-600"
        />
        <Icon v-else name="AlertTriangle" :size="20" class="mt-px shrink-0 text-sun-700" />
        <div class="min-w-0 flex-1 text-sm font-medium text-grey-800">
          <template v-if="allCovered">
            All channels have a first response and resolution SLA.
          </template>
          <template v-else>
            <p v-for="gap in coverageGaps" :key="gap.type">
              No {{ SLA_TYPE_META[gap.type].label.toLowerCase() }} SLA on
              {{ gap.labels.join(', ') }}.
            </p>
          </template>
        </div>
      </div>

      <!-- One list: active first, then A–Z; the row thumbnail shows the type -->
      <div class="mt-4 space-y-2">
        <PolicyRow
          v-for="sla in sorted"
          :key="sla.id"
          :policy="sla"
          :error="rowError?.id === sla.id ? rowError.message : undefined"
          @open="goEditor(sla.id)"
          @toggle="onToggle(sla.id)"
          @delete="pendingDelete = sla"
        />
      </div>
    </template>

    <!-- Type picker: choose the SLA type first, then the editor opens -->
    <Dialog v-model:open="pickerOpen">
      <DialogContent class="max-w-lg">
        <DialogHeader>
          <DialogTitle>New SLA</DialogTitle>
          <DialogDescription>Choose the type of promise this SLA measures.</DialogDescription>
        </DialogHeader>
        <div class="grid grid-cols-2 gap-3">
          <button
            v-for="type in SLA_TYPES"
            :key="type"
            type="button"
            class="flex flex-col items-start gap-2 rounded-lg border border-grey-300 p-4 text-left transition-colors hover:border-leaf-400 hover:bg-grey-100 focus:outline-none focus-visible:shadow-focus-sm"
            @click="pick(type)"
          >
            <span class="flex size-10 items-center justify-center rounded-lg border border-black/10 bg-white text-grey-700">
              <Icon :name="SLA_TYPE_META[type].icon" :size="20" />
            </span>
            <span class="text-sm font-semibold text-grey-900">{{ SLA_TYPE_META[type].label }}</span>
            <span class="text-xs text-grey-600">{{ SLA_TYPE_META[type].description }}</span>
          </button>
        </div>
      </DialogContent>
    </Dialog>

    <!-- Delete confirmation: names the SLA + its coverage impact -->
    <Dialog :open="!!pendingDelete" @update:open="(v) => { if (!v) pendingDelete = null }">
      <DialogContent class="max-w-md">
        <DialogHeader>
          <DialogTitle>Delete “{{ pendingDelete?.name }}”?</DialogTitle>
          <DialogDescription>
            This SLA will be permanently deleted.
            <template v-if="pendingDelete?.active && pendingDelete.channels.length">
              Tickets on {{ channelsLabel(pendingDelete.channels) }} will no longer have a
              {{ pendingDelete ? SLA_TYPE_META[pendingDelete.type].label.toLowerCase() : '' }} SLA.
            </template>
          </DialogDescription>
        </DialogHeader>
        <div class="flex justify-end gap-2">
          <Button variant="outline" @click="pendingDelete = null">Cancel</Button>
          <Button variant="destructive" @click="confirmDelete">Delete SLA</Button>
        </div>
      </DialogContent>
    </Dialog>
  </div>
</template>
