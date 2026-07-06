<script setup lang="ts">
// shadcn-vue Input — a themed text field with v-model support.
// Copied from the Reporting workspace; focus ring swapped to this project's
// shadow-focus token (Reporting used a ring-* utility with no token here).
import type { HTMLAttributes } from 'vue'
import { cn } from '@/lib/utils'

defineProps<{ class?: HTMLAttributes['class'] }>()

// Two-way bound value (use as <Input v-model="..." />).
const model = defineModel<string | number>()
</script>

<template>
  <input
    v-model="model"
    :class="
      cn(
        'flex h-10 w-full rounded-md border border-grey-300 bg-white px-3 text-sm text-grey-900 placeholder:text-grey-400 transition-colors focus:outline-none focus-visible:shadow-focus disabled:cursor-not-allowed disabled:opacity-50',
        $props.class,
      )
    "
  />
</template>
