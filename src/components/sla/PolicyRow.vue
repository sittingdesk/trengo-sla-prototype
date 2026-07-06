<script setup lang="ts">
// PolicyRow — one policy on the overview. The whole row navigates to the
// editor; the Switch flips active without navigating (stopPropagation wrapper).
// `error` shows a brief inline message (e.g. an activation refused by the
// per-channel overlap check). Delete is a hover-revealed trash with an inline
// two-step confirm (arm → "Delete?" → confirm); it disarms on mouseleave/timeout.
import { computed, ref } from 'vue'
import Icon from '@/components/Icon.vue'
import { Switch } from '@/components/ui/switch'
import type { Policy } from '@/data/slaData'
import { scopeSentence } from '@/lib/sla'

const props = defineProps<{
  policy: Policy
  error?: string
}>()

const emit = defineEmits<{
  (e: 'open'): void
  (e: 'toggle'): void
  (e: 'delete'): void
}>()

const scope = computed(() => scopeSentence(props.policy))

const deleteArmed = ref(false)
let disarmTimer: ReturnType<typeof setTimeout> | undefined

function onDeleteClick() {
  if (deleteArmed.value) {
    clearTimeout(disarmTimer)
    deleteArmed.value = false
    emit('delete')
    return
  }
  deleteArmed.value = true
  clearTimeout(disarmTimer)
  disarmTimer = setTimeout(disarm, 3000)
}

function disarm() {
  clearTimeout(disarmTimer)
  deleteArmed.value = false
}
</script>

<template>
  <div
    class="group flex cursor-pointer items-center gap-4 rounded-lg border border-grey-300 bg-white px-5 py-4 shadow-100 transition-shadow hover:shadow-300"
    role="button"
    tabindex="0"
    @click="emit('open')"
    @keydown.enter="emit('open')"
    @mouseleave="disarm"
  >
    <!-- Name + scope -->
    <div class="min-w-0 flex-1" :class="!policy.active && 'opacity-50'">
      <span class="block truncate text-sm font-semibold text-grey-900">{{ policy.name }}</span>
      <p class="mt-0.5 truncate text-xs text-grey-600">{{ scope }}</p>
      <p v-if="error" class="mt-1 text-xs font-medium text-error-500">{{ error }}</p>
    </div>

    <!-- Delete: hover-revealed, two-step confirm; must not trigger navigation -->
    <span class="flex shrink-0 items-center" @click.stop>
      <button
        v-if="deleteArmed"
        type="button"
        class="rounded-base px-2 py-1 text-xs font-semibold text-error-500 transition-colors hover:bg-grey-200"
        @click="onDeleteClick"
      >
        Delete?
      </button>
      <button
        v-else
        type="button"
        title="Delete policy"
        class="flex size-7 items-center justify-center rounded-base text-grey-600 opacity-0 transition-all hover:bg-grey-200 hover:text-grey-900 focus-visible:opacity-100 focus-visible:outline-none focus-visible:shadow-focus-sm group-hover:opacity-100"
        @click="onDeleteClick"
      >
        <Icon name="Trash" :size="16" />
      </button>
    </span>

    <!-- Active toggle: must not trigger row navigation -->
    <span class="flex shrink-0 items-center" @click.stop>
      <Switch :model-value="policy.active" @update:model-value="emit('toggle')" />
    </span>

    <Icon name="ChevronRight" :size="16" class="shrink-0 text-grey-400" />
  </div>
</template>
