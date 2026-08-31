<script setup lang="ts">
// SlaExplainerModal — "How SLAs work": the consolidated definitions reference,
// opened from the rail Help (?) icon. An accordion (Collapsible) of explainers
// grouped by theme. Content lives in src/data/slaExplainers.ts (source of truth).
import Icon from '@/components/Icon.vue'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { SLA_EXPLAINERS } from '@/data/slaExplainers'

const open = defineModel<boolean>('open', { default: false })
</script>

<template>
  <Dialog v-model:open="open">
    <DialogContent class="max-w-2xl max-h-[85vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle>How SLAs work</DialogTitle>
        <DialogDescription>Definitions and mechanics for this prototype.</DialogDescription>
      </DialogHeader>

      <section
        v-for="(grp, gi) in SLA_EXPLAINERS"
        :key="grp.group"
        :class="gi > 0 && 'border-t border-grey-200 pt-4'"
      >
        <h3 class="text-xs font-semibold uppercase tracking-wide text-grey-600">{{ grp.group }}</h3>
        <div class="mt-1">
          <Collapsible
            v-for="(ex, ei) in grp.items"
            :key="ex.id"
            :default-open="gi === 0 && ei === 0"
            class="border-b border-grey-200 last:border-b-0"
          >
            <CollapsibleTrigger as-child>
              <button
                type="button"
                class="group flex w-full items-center gap-3 py-3 text-left focus:outline-none focus-visible:shadow-focus-sm"
              >
                <span
                  class="flex size-8 shrink-0 items-center justify-center rounded-lg border border-black/10 bg-white text-grey-700"
                >
                  <Icon :name="ex.icon" :size="18" />
                </span>
                <span class="min-w-0 flex-1">
                  <span class="flex items-center gap-2">
                    <span class="text-sm font-semibold text-grey-900">{{ ex.title }}</span>
                    <span
                      v-if="ex.badge"
                      class="rounded-pill bg-grey-200 px-1.5 py-0.5 text-[10px] font-semibold text-grey-600"
                    >{{ ex.badge }}</span>
                  </span>
                  <span class="mt-0.5 block truncate text-xs text-grey-600">{{ ex.summary }}</span>
                </span>
                <Icon
                  name="ChevronDown"
                  :size="18"
                  class="shrink-0 text-grey-500 transition-transform group-data-[state=open]:rotate-180"
                />
              </button>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div class="pb-4 pl-11 pr-2">
                <ul class="flex flex-col gap-1.5">
                  <li
                    v-for="(p, pi) in ex.points"
                    :key="pi"
                    class="flex gap-2 text-sm text-grey-700"
                  >
                    <span class="mt-1.5 size-1 shrink-0 rounded-circle bg-grey-400" aria-hidden="true" />
                    <span>{{ p }}</span>
                  </li>
                </ul>
                <!-- Counts / Doesn't count -->
                <div v-if="ex.counts || ex.notCounts" class="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div v-if="ex.counts">
                    <p class="text-xs font-semibold text-grey-800">Counts</p>
                    <ul class="mt-1 flex flex-col gap-1">
                      <li v-for="(c, ci) in ex.counts" :key="ci" class="flex gap-1.5 text-xs text-grey-700">
                        <Icon name="Check" :size="14" class="mt-px shrink-0 text-leaf-600" />
                        <span>{{ c }}</span>
                      </li>
                    </ul>
                  </div>
                  <div v-if="ex.notCounts">
                    <p class="text-xs font-semibold text-grey-800">Doesn’t count</p>
                    <ul class="mt-1 flex flex-col gap-1">
                      <li v-for="(c, ci) in ex.notCounts" :key="ci" class="flex gap-1.5 text-xs text-grey-600">
                        <Icon name="Cross" :size="14" class="mt-px shrink-0 text-grey-400" />
                        <span>{{ c }}</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </CollapsibleContent>
          </Collapsible>
        </div>
      </section>
    </DialogContent>
  </Dialog>
</template>
