<script setup lang="ts">
// ComplianceDonut — a themed SVG ring showing a 0–1 compliance value.
// Hand-rolled (no chart library): a grey track circle + a leaf arc drawn with
// stroke-dasharray, rotated so it starts at 12 o'clock. Percentage in the centre.
import { computed } from 'vue'

const props = withDefaults(
  defineProps<{
    /** Compliance ratio, 0–1. */
    value: number
    /** Outer diameter in px. */
    size?: number
    /** Ring thickness in px. */
    stroke?: number
  }>(),
  { size: 128, stroke: 12 },
)

const radius = computed(() => (props.size - props.stroke) / 2)
const circumference = computed(() => 2 * Math.PI * radius.value)
const dashOffset = computed(() => circumference.value * (1 - Math.min(1, Math.max(0, props.value))))
const percent = computed(() => Math.round(props.value * 100))
</script>

<template>
  <div class="relative shrink-0" :style="{ width: `${size}px`, height: `${size}px` }">
    <svg :width="size" :height="size" :viewBox="`0 0 ${size} ${size}`" class="-rotate-90">
      <circle
        class="text-grey-200"
        :cx="size / 2"
        :cy="size / 2"
        :r="radius"
        fill="none"
        stroke="currentColor"
        :stroke-width="stroke"
      />
      <circle
        class="text-leaf-500"
        :cx="size / 2"
        :cy="size / 2"
        :r="radius"
        fill="none"
        stroke="currentColor"
        :stroke-width="stroke"
        stroke-linecap="round"
        :stroke-dasharray="circumference"
        :stroke-dashoffset="dashOffset"
      />
    </svg>
    <div class="absolute inset-0 flex items-center justify-center">
      <span class="text-xl font-semibold text-grey-900">{{ percent }}%</span>
    </div>
  </div>
</template>
