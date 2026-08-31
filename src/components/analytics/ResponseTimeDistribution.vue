<script setup lang="ts">
// ResponseTimeDistribution — a stacked bar bucketing conversations by how long
// they took, relative to the SLA's target (met → 1–2× → 2–4× → > 4×). Shows the
// SHAPE of the misses (narrowly vs catastrophically late) that a single % hides.
import { computed } from 'vue'
import type { Distribution } from '@/data/slaAnalyticsV3'

const props = defineProps<{
  dist: Distribution
  labels: [string, string, string, string]
}>()

const nf = new Intl.NumberFormat('en-GB')

const segments = computed(() => {
  const { met, over1, over2, over3 } = props.dist
  const total = met + over1 + over2 + over3 || 1
  const defs = [
    { count: met, label: props.labels[0], bar: 'bg-leaf-500', dot: 'bg-leaf-500' },
    { count: over1, label: props.labels[1], bar: 'bg-sun-400', dot: 'bg-sun-400' },
    { count: over2, label: props.labels[2], bar: 'bg-peach-500', dot: 'bg-peach-500' },
    { count: over3, label: props.labels[3], bar: 'bg-error-500', dot: 'bg-error-500' },
  ]
  return defs.map((d) => ({ ...d, pct: Math.round((d.count / total) * 100) }))
})
</script>

<template>
  <div>
    <!-- Stacked bar -->
    <div class="flex h-2.5 w-full overflow-hidden rounded-pill">
      <span
        v-for="(s, i) in segments"
        v-show="s.count > 0"
        :key="i"
        class="block h-full first:rounded-l-pill last:rounded-r-pill"
        :class="s.bar"
        :style="{ width: `${s.pct}%` }"
      />
    </div>
    <!-- Legend: swatch + label + count (pct) -->
    <ul class="mt-3 grid grid-cols-2 gap-x-4 gap-y-1.5">
      <li v-for="(s, i) in segments" :key="i" class="flex items-center gap-2 text-xs">
        <span class="size-2.5 shrink-0 rounded-[3px]" :class="s.dot" aria-hidden="true" />
        <span class="min-w-0 flex-1 truncate text-grey-600">{{ s.label }}</span>
        <span class="shrink-0 font-semibold tabular-nums text-grey-900">
          {{ nf.format(s.count) }}
          <span class="font-medium text-grey-600">({{ s.pct }}%)</span>
        </span>
      </li>
    </ul>
  </div>
</template>
