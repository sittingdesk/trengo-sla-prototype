<script setup lang="ts">
// SlaOverview — the SLA policies list: header + computed coverage line +
// policy rows sorted active-first then alphabetical.
import { computed, ref } from 'vue'
import Icon from '@/components/Icon.vue'
import { Button } from '@/components/ui/button'
import { useSlaNav } from '@/composables/useSlaNav'
import { useSlaPolicies } from '@/composables/useSlaPolicies'
import { coverage, sortPolicies } from '@/lib/sla'
import PolicyRow from './PolicyRow.vue'

const { goEditor } = useSlaNav()
const { policies, toggleActive, removePolicy } = useSlaPolicies()

const sorted = computed(() => sortPolicies(policies.value))
const cov = computed(() => coverage(policies.value))

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
        <Button @click="goEditor()">+ New policy</Button>
      </div>
    </div>

    <!-- Coverage line (computed from the data) -->
    <div class="mt-6 flex items-start gap-2 text-sm">
      <template v-if="cov.ok">
        <Icon name="CheckCircle" :size="18" class="mt-px shrink-0 text-leaf-600" />
        <p class="text-grey-700">All channels are covered by an SLA policy.</p>
      </template>
      <template v-else>
        <Icon name="AlertTriangle" :size="18" class="mt-px shrink-0 text-sun-700" />
        <p class="text-grey-700">
          Conversations on {{ cov.uncoveredLabels.join(', ') }} have no SLA.
        </p>
      </template>
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
  </div>
</template>
