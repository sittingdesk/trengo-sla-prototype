<script setup lang="ts">
// PolicyRow — one SLA on the overview. A type thumbnail + label identify it
// (the list mixes first-response and resolution SLAs). The whole row navigates to the
// editor; the Switch flips active without navigating (stopPropagation wrapper).
// `error` shows a brief inline message (e.g. an activation refused by the
// per-channel overlap check). Delete lives in a kebab (⋯) menu at the far
// right and only REQUESTS deletion — the overview gates it behind a dialog.
import { computed, ref } from 'vue'
import Icon from '@/components/Icon.vue'
import { Switch } from '@/components/ui/switch'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { SLA_TYPE_META, type Sla } from '@/data/slaDataV3'
import { scopeSentence } from '@/lib/slaV3'

const props = defineProps<{
  policy: Sla
  error?: string
}>()

const emit = defineEmits<{
  (e: 'open'): void
  (e: 'toggle'): void
  (e: 'delete'): void
}>()

const scope = computed(() => scopeSentence(props.policy))

const menuOpen = ref(false)

function requestDelete() {
  menuOpen.value = false
  emit('delete')
}
</script>

<template>
  <div
    class="group flex cursor-pointer items-center gap-4 rounded-lg border border-grey-300 bg-white px-5 py-4 shadow-100 transition-shadow hover:shadow-300"
    role="button"
    tabindex="0"
    @click="emit('open')"
    @keydown.enter="emit('open')"
  >
    <!-- Type thumbnail: says what kind of SLA this row is -->
    <div
      class="flex size-10 shrink-0 items-center justify-center rounded-lg border border-black/10 bg-white text-grey-700"
      :class="!policy.active && 'opacity-50'"
    >
      <Icon :name="SLA_TYPE_META[policy.type].icon" :size="20" />
    </div>

    <!-- Name + type + scope -->
    <div class="min-w-0 flex-1" :class="!policy.active && 'opacity-50'">
      <span class="flex items-center gap-2">
        <span class="min-w-0 truncate text-sm font-semibold text-grey-900">{{ policy.name }}</span>
        <span
          class="shrink-0 rounded-pill bg-grey-200 px-1.5 py-0.5 text-[10px] font-semibold text-grey-600"
        >{{ SLA_TYPE_META[policy.type].label }}</span>
      </span>
      <p class="mt-0.5 truncate text-xs text-grey-600">{{ scope }}</p>
      <p v-if="error" class="mt-1 text-xs font-medium text-error-500">{{ error }}</p>
    </div>

    <!-- Active toggle: must not trigger row navigation -->
    <span class="flex shrink-0 items-center" @click.stop>
      <Switch :model-value="policy.active" @update:model-value="emit('toggle')" />
    </span>

    <!-- Kebab menu (far right): row actions; must not trigger navigation -->
    <span class="flex shrink-0 items-center" @click.stop>
      <Popover v-model:open="menuOpen">
        <PopoverTrigger as-child>
          <button
            type="button"
            aria-label="Policy actions"
            class="flex size-7 items-center justify-center rounded-base text-grey-500 transition-colors hover:bg-grey-200 hover:text-grey-900 focus:outline-none focus-visible:shadow-focus-sm"
          >
            <Icon name="MoreVert" variant="filled" :size="18" />
          </button>
        </PopoverTrigger>
        <PopoverContent align="end" class="w-44 p-1">
          <button
            type="button"
            class="flex w-full items-center gap-2 rounded-base px-2 py-1.5 text-sm font-medium text-error-500 transition-colors hover:bg-grey-100"
            @click="requestDelete"
          >
            <Icon name="Trash" :size="16" />
            Delete policy
          </button>
        </PopoverContent>
      </Popover>
    </span>
  </div>
</template>
