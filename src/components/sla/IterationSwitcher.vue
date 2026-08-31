<script setup lang="ts">
// IterationSwitcher — a mini dropdown (bottom-right, beside the view-mode
// switcher) to flip between prototype iterations. Prototype affordance only.
import Icon from '@/components/Icon.vue'
import { useIteration } from '@/composables/useIteration'

const { iteration } = useIteration()
</script>

<template>
  <div class="relative inline-flex items-center">
    <select
      v-model.number="iteration"
      aria-label="Prototype iteration"
      class="cursor-pointer appearance-none rounded-pill border border-grey-300 bg-white py-1 pl-2.5 pr-6 text-[10px] font-semibold leading-[12px] text-grey-700 shadow-100 focus:outline-none focus-visible:shadow-focus-sm"
    >
      <option :value="1">Iteration 1</option>
      <option :value="2">Iteration 2</option>
      <option :value="3">Iteration 3</option>
    </select>
    <Icon
      name="ChevronDown"
      :size="12"
      class="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-grey-600"
    />
  </div>
</template>
