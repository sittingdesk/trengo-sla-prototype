<script setup lang="ts">
// CustomFieldsToggle — prototype control (bottom-right, Iteration 2 only) that
// simulates whether the workspace has custom fields, to demo the editor's
// "no custom fields" empty state. Prototype affordance only.
import { useCustomFieldsAvailable } from '@/composables/useCustomFieldsAvailable'

const { customFieldsAvailable } = useCustomFieldsAvailable()
</script>

<template>
  <div
    class="inline-flex items-center gap-0.5 rounded-pill border border-grey-300 bg-white p-0.5 shadow-100"
    role="group"
    aria-label="Prototype custom fields"
  >
    <span class="px-1.5 text-[10px] font-semibold text-grey-500">Custom fields</span>
    <button
      type="button"
      class="rounded-pill px-2 py-px text-[10px] font-semibold leading-[12px] transition-colors"
      :class="customFieldsAvailable ? 'bg-grey-900 text-white' : 'text-grey-600 hover:text-grey-900'"
      @click="customFieldsAvailable = true"
    >
      On
    </button>
    <button
      type="button"
      class="rounded-pill px-2 py-px text-[10px] font-semibold leading-[12px] transition-colors"
      :class="!customFieldsAvailable ? 'bg-grey-900 text-white' : 'text-grey-600 hover:text-grey-900'"
      @click="customFieldsAvailable = false"
    >
      Off
    </button>
  </div>
</template>
