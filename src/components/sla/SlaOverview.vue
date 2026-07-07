<script setup lang="ts">
// SlaOverview — the SLA policies list: header + computed coverage line +
// policy rows sorted active-first then alphabetical.
import { computed, ref } from 'vue'
import Icon from '@/components/Icon.vue'
import { Button } from '@/components/ui/button'
import { useSlaNav } from '@/composables/useSlaNav'
import { useSlaPolicies } from '@/composables/useSlaPolicies'
import { useViewMode } from '@/composables/useViewMode'
import { coverage, sortPolicies } from '@/lib/sla'
import PolicyRow from './PolicyRow.vue'
import PolicyRowSkeleton from './PolicyRowSkeleton.vue'

const { goEditor } = useSlaNav()
const { policies, toggleActive, removePolicy } = useSlaPolicies()
const { mode } = useViewMode()

const sorted = computed(() => sortPolicies(policies.value))
const cov = computed(() => coverage(policies.value))

// Which state the list renders in. Empty also covers the real zero-policy case
// (not just the prototype toggle); Loading is toggle-only.
const showSkeleton = computed(() => mode.value === 'loading')
const showEmpty = computed(
  () => mode.value === 'empty' || (mode.value === 'normal' && sorted.value.length === 0),
)

/** Brief per-row message when activation is refused (overlap check). */
const rowError = ref<{ id: string; message: string } | null>(null)
let errorTimer: ReturnType<typeof setTimeout> | undefined

function onToggle(id: string) {
  const result = toggleActive(id)
  if (result.ok) {
    if (rowError.value?.id === id) rowError.value = null
    return
  }
  rowError.value = { id, message: result.message }
  clearTimeout(errorTimer)
  errorTimer = setTimeout(() => (rowError.value = null), 4000)
}
</script>

<template>
  <!-- 820px content column, centered — matches the editor -->
  <div class="mx-auto w-full max-w-[868px] px-6 py-10">
    <!-- Header -->
    <div class="flex items-start justify-between gap-4">
      <div>
        <h1 class="text-lg font-bold text-grey-900">Service level agreements</h1>
        <p class="mt-1 text-sm text-grey-600">
          Response time promises for your team, one policy per channel.
        </p>
      </div>
      <div class="shrink-0">
        <Button @click="goEditor()">New policy</Button>
      </div>
    </div>

    <!-- Loading: skeleton banner + rows -->
    <template v-if="showSkeleton">
      <div class="mt-6 h-[52px] w-full animate-pulse rounded-lg bg-grey-200" />
      <div class="mt-4 space-y-2">
        <PolicyRowSkeleton v-for="n in 3" :key="n" />
      </div>
    </template>

    <!-- Empty: no policies (toggle, or genuinely empty) -->
    <div v-else-if="showEmpty" class="flex flex-col items-center py-16 text-center">
      <!-- Thumbnail per Figma: 48px box, 24px icon, 10%-black hairline -->
      <div class="flex size-12 items-center justify-center rounded-lg border border-black/10 bg-white text-grey-700">
        <Icon name="Stopwatch" :size="24" />
      </div>
      <h2 class="mt-4 text-sm font-semibold text-grey-900">No SLA policies yet</h2>
      <p class="mt-2 max-w-[480px] text-sm font-medium text-grey-700">
        Create your first policy to set response-time promises for each channel.
      </p>
      <Button class="mt-10" @click="goEditor()">New policy</Button>
    </div>

    <!-- Normal: coverage inline banner + policy rows -->
    <template v-else>
      <!-- Coverage as an inline banner (semantic), matching the editor's box -->
      <div
        class="mt-6 flex items-center gap-2 rounded-lg border p-3"
        :class="cov.ok ? 'border-leaf-200 bg-leaf-100' : 'border-sun-300 bg-sun-100'"
      >
        <Icon
          v-if="cov.ok"
          name="CheckCircle"
          :size="24"
          class="shrink-0 text-leaf-600"
        />
        <Icon v-else name="AlertTriangle" :size="24" class="shrink-0 text-sun-700" />
        <p class="min-w-0 flex-1 text-sm font-medium text-grey-800">
          <template v-if="cov.ok">All channels are covered by an SLA policy.</template>
          <template v-else>
            Conversations on {{ cov.uncoveredLabels.join(', ') }} have no SLA.
          </template>
        </p>
      </div>

      <!-- Policy rows: active first, then alphabetical -->
      <div class="mt-4 space-y-2">
        <PolicyRow
          v-for="policy in sorted"
          :key="policy.id"
          :policy="policy"
          :error="rowError?.id === policy.id ? rowError.message : undefined"
          @open="goEditor(policy.id)"
          @toggle="onToggle(policy.id)"
          @delete="removePolicy(policy.id)"
        />
      </div>
    </template>
  </div>
</template>
