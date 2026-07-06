<script setup lang="ts">
// SettingRow — one setting inside the editor card (Figma row spec):
// [40px icon thumbnail] [16px semibold label + ⓘ tooltip + 14px muted
// description] [control slot right]. The ⓘ trigger is a real <button> so the
// tooltip opens on keyboard focus too. Slot `below` renders full-width content
// under the row (the channel select, helpers, errors).
import Icon from '@/components/Icon.vue'
import { Tooltip } from '@/components/ui/tooltip'

defineProps<{
  icon: string
  label: string
  tooltip?: string
  description?: string
}>()
</script>

<template>
  <div class="w-full px-6">
    <div class="flex items-center gap-3">
      <!-- Thumbnail: 40px box, 24px icon, 10%-black hairline (design.md §7.2) -->
      <div
        class="flex size-10 shrink-0 items-center justify-center rounded-lg border border-black/10 bg-white text-grey-700"
      >
        <Icon :name="icon" :size="24" />
      </div>
      <div class="min-w-0 flex-1">
        <div class="flex items-center gap-1">
          <span class="text-base font-semibold text-grey-800">{{ label }}</span>
          <Tooltip v-if="tooltip" :text="tooltip">
            <button
              type="button"
              class="flex size-4 items-center justify-center rounded-circle text-grey-400 transition-colors hover:text-grey-600 focus:outline-none focus-visible:shadow-focus-sm"
              :aria-label="`About ${label}`"
            >
              <Icon name="Info" :size="16" />
            </button>
          </Tooltip>
        </div>
        <p v-if="description" class="mt-0.5 text-sm text-grey-600">{{ description }}</p>
      </div>
      <div class="flex shrink-0 items-center gap-3">
        <slot />
      </div>
    </div>
    <slot name="below" />
  </div>
</template>
