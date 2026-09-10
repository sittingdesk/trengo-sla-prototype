<script setup lang="ts" generic="T extends string">
// UnitSelect — a token-styled native <select> per the Figma field spec:
// h-10, grey-400 border, shadow-100, 16px medium grey-700 text, 20px chevron.
// Native over reka-ui Select on purpose: 2–3 static options each, and the OS
// popup is fine for a prototype. Generic over the value type so unions like
// TimeUnit bind without casts.
import Icon from '@/components/Icon.vue'

defineProps<{
  options: { value: T; label: string }[]
  disabled?: boolean
}>()

const model = defineModel<T>({ required: true })
</script>

<template>
  <div class="relative" :class="disabled && 'opacity-50'">
    <select
      v-model="model"
      :disabled="disabled"
      class="h-10 w-full cursor-pointer appearance-none rounded-base border border-grey-400 bg-white pl-3 pr-9 text-base font-medium text-grey-700 shadow-100 transition-colors focus:outline-none focus-visible:shadow-focus disabled:cursor-not-allowed"
    >
      <option v-for="opt in options" :key="opt.value" :value="opt.value">
        {{ opt.label }}
      </option>
    </select>
    <Icon
      name="ChevronDown"
      :size="20"
      class="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-grey-700"
    />
  </div>
</template>
