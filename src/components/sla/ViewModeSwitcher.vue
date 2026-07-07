<script setup lang="ts">
// ViewModeSwitcher — a mini segmented control pinned bottom-right that flips the
// overview between Normal / Loading / Empty. Prototype affordance only.
import { useViewMode, VIEW_MODES } from '@/composables/useViewMode'

const { mode } = useViewMode()
</script>

<template>
  <div
    class="fixed bottom-4 right-4 z-50 inline-flex items-center gap-0.5 rounded-pill border border-grey-300 bg-white p-0.5 shadow-100"
    role="group"
    aria-label="Prototype view mode"
  >
    <button
      v-for="m in VIEW_MODES"
      :key="m.value"
      type="button"
      class="rounded-pill px-2 py-px text-[10px] font-semibold leading-[12px] transition-colors"
      :class="
        mode === m.value
          ? 'bg-grey-900 text-white'
          : 'text-grey-600 hover:text-grey-900'
      "
      @click="mode = m.value"
    >
      {{ m.label }}
    </button>
  </div>
</template>
