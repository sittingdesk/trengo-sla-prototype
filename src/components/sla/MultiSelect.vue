<script setup lang="ts">
// MultiSelect — select-style field + anchored popover with checkboxes.
// The field shows the selection as dismissible chips (✕ per chip, "+N more"
// past `max`); clicking it opens a popover with optional search, a grouped
// checkbox list, and a counter/Select all/Clear footer. Shared by the
// channels and teams rows so both use one identical pattern.
import { computed, ref } from 'vue'
import Icon from '@/components/Icon.vue'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'

interface Option {
  id: string
  label: string
}

interface OptionGroup {
  group: string
  items: Option[]
}

const props = withDefaults(
  defineProps<{
    groups: OptionGroup[]
    placeholder?: string
    /** Muted chip shown when nothing is selected (e.g. "All teams" = valid empty). */
    emptyChipLabel?: string
    searchable?: boolean
    /** Max chips shown in the field before collapsing to "+N more". */
    max?: number
    /** id → short hint (e.g. "Already used"): renders the option disabled
     * unless it is currently selected (so it can still be unchecked). */
    disabledItems?: Record<string, string>
  }>(),
  { placeholder: 'Select…', searchable: false, max: 4 },
)

const model = defineModel<string[]>({ required: true })

const open = ref(false)
const query = ref('')

const allOptions = computed(() => props.groups.flatMap((g) => g.items))

function labelFor(id: string): string {
  return allOptions.value.find((o) => o.id === id)?.label ?? id
}

const visibleChips = computed(() => model.value.slice(0, props.max))
const overflow = computed(() => model.value.length - props.max)

/** Hide group headers when there's a single unnamed group (teams). */
const showGroupHeaders = computed(() => props.groups.length > 1 || Boolean(props.groups[0]?.group))

const filteredGroups = computed(() => {
  const q = query.value.trim().toLowerCase()
  if (!q) return props.groups
  return props.groups
    .map((g) => ({ group: g.group, items: g.items.filter((o) => o.label.toLowerCase().includes(q)) }))
    .filter((g) => g.items.length)
})

function isDisabled(id: string): boolean {
  return Boolean(props.disabledItems?.[id]) && !model.value.includes(id)
}

function toggle(id: string) {
  model.value = model.value.includes(id)
    ? model.value.filter((x) => x !== id)
    : [...model.value, id]
}

function remove(id: string) {
  model.value = model.value.filter((x) => x !== id)
}

/** Select all — skipping disabled options (they belong to another policy). */
function selectAll() {
  model.value = allOptions.value.filter((o) => !isDisabled(o.id)).map((o) => o.id)
}

function clearAll() {
  model.value = []
}
</script>

<template>
  <Popover v-model:open="open">
    <PopoverTrigger as-child>
      <button
        type="button"
        class="flex min-h-10 w-full items-center gap-1 rounded-base border border-grey-400 bg-white py-1.5 pl-2 pr-3 text-left shadow-100 transition-colors focus:outline-none focus-visible:shadow-focus"
      >
        <span class="flex min-w-0 flex-1 flex-wrap items-center gap-1">
          <template v-if="model.length">
            <!-- Chips per Figma: Sky-200 / Sky-800, pill, 14px medium, 16px ✕ -->
            <span
              v-for="id in visibleChips"
              :key="id"
              class="inline-flex items-center gap-1 rounded-pill bg-sky-200 px-2 py-0.5 text-sm font-medium text-sky-800"
            >
              {{ labelFor(id) }}
              <!-- span, not button: interactive elements can't nest in the trigger button -->
              <span
                role="button"
                :aria-label="`Remove ${labelFor(id)}`"
                class="flex size-4 items-center justify-center rounded-circle text-sky-600 transition-colors hover:text-sky-800"
                @click.stop="remove(id)"
              >
                <Icon name="Cross" :size="16" />
              </span>
            </span>
            <span v-if="overflow > 0" class="text-sm font-medium text-grey-600"
              >+{{ overflow }} more</span
            >
          </template>
          <span
            v-else-if="emptyChipLabel"
            class="inline-flex items-center rounded-pill bg-grey-200 px-2 py-0.5 text-sm font-medium text-grey-600"
          >
            {{ emptyChipLabel }}
          </span>
          <span v-else class="text-base text-grey-400">{{ placeholder }}</span>
        </span>
        <Icon
          name="ChevronDown"
          :size="20"
          class="shrink-0 text-grey-700 transition-transform duration-200"
          :class="open && 'rotate-180'"
        />
      </button>
    </PopoverTrigger>

    <PopoverContent class="w-[var(--reka-popover-trigger-width)] p-0 shadow-500" :side-offset="4">
      <!-- Search -->
      <div v-if="searchable" class="border-b border-grey-200 p-2">
        <div class="relative">
          <Icon
            name="Search"
            :size="16"
            class="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-grey-600"
          />
          <input
            v-model="query"
            type="search"
            placeholder="Search…"
            class="h-8 w-full rounded-base border border-grey-300 bg-white pl-8 pr-3 text-sm text-grey-900 placeholder:text-grey-400 focus:outline-none focus-visible:shadow-focus"
          />
        </div>
      </div>

      <!-- Grouped checkbox list -->
      <div class="scroll-thin max-h-56 space-y-2 overflow-y-auto p-2">
        <div v-for="group in filteredGroups" :key="group.group">
          <div
            v-if="showGroupHeaders"
            class="px-1.5 pb-1 text-xs font-semibold uppercase tracking-wide text-grey-600"
          >
            {{ group.group }}
          </div>
          <label
            v-for="option in group.items"
            :key="option.id"
            class="flex items-center gap-2.5 rounded-base px-1.5 py-1.5 text-sm font-medium"
            :class="
              isDisabled(option.id)
                ? 'cursor-not-allowed text-grey-400'
                : 'cursor-pointer text-grey-700 transition-colors hover:bg-grey-200'
            "
          >
            <input
              type="checkbox"
              class="size-4 accent-leaf-500 disabled:cursor-not-allowed"
              :checked="model.includes(option.id)"
              :disabled="isDisabled(option.id)"
              @change="toggle(option.id)"
            />
            <span class="min-w-0 flex-1 truncate">{{ option.label }}</span>
            <span v-if="isDisabled(option.id)" class="shrink-0 text-xs text-grey-400">
              {{ disabledItems?.[option.id] }}
            </span>
          </label>
        </div>
        <p v-if="!filteredGroups.length" class="px-1.5 py-2 text-sm text-grey-600">
          No matches for “{{ query }}”.
        </p>
      </div>

      <!-- Footer: counter + bulk actions -->
      <div class="flex items-center justify-between border-t border-grey-200 px-3 py-2">
        <span class="text-xs text-grey-600">
          {{ model.length }} of {{ allOptions.length }} selected
        </span>
        <span class="flex items-center gap-3">
          <button
            type="button"
            class="text-xs font-medium text-grey-700 transition-colors hover:text-grey-900"
            @click="selectAll"
          >
            Select all
          </button>
          <button
            type="button"
            class="text-xs font-medium text-grey-700 transition-colors hover:text-grey-900"
            @click="clearAll"
          >
            Clear
          </button>
        </span>
      </div>
    </PopoverContent>
  </Popover>
</template>
