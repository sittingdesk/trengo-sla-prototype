<script setup lang="ts">
// CohortToggle — the "Everything / Human only" segmented control that sits in a
// metric card's header. Short labels because the card header is narrow; the full
// meaning of each cohort lives in that card's ⓘ tooltip, which has room.
//
// `humanEnabled` false renders "Without AI" greyed rather than hiding it, so the
// option reads as coming rather than missing.
import type { Cohort } from '@/data/slaAnalyticsV3'

const cohort = defineModel<Cohort>({ required: true })

withDefaults(defineProps<{ humanEnabled?: boolean; label?: string }>(), {
  humanEnabled: false,
  label: 'Which tickets',
})

const options = [
  { key: 'all', label: 'Everything' },
  { key: 'human', label: 'Without AI' },
] as const
</script>

<template>
  <div
    class="inline-flex shrink-0 items-center gap-0.5 rounded-pill border border-grey-300 bg-white p-0.5"
    role="group"
    :aria-label="label"
  >
    <button
      v-for="o in options"
      :key="o.key"
      type="button"
      :disabled="o.key === 'human' && !humanEnabled"
      :title="o.key === 'human' && !humanEnabled ? 'Not available yet' : undefined"
      class="rounded-pill px-2 py-px text-[10px] font-semibold leading-[14px] transition-colors disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:text-grey-600"
      :class="cohort === o.key ? 'bg-grey-900 text-white' : 'text-grey-600 hover:text-grey-900'"
      @click="cohort = o.key"
    >
      {{ o.label }}
    </button>
  </div>
</template>
