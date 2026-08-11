<script setup lang="ts">
// SlaAnalyticsModal — a large modal previewing the SLA analytics the policy
// feature unlocks. Opened from the rail's pie-chart ("Reports") icon. All numbers
// are static illustrative mock data (this prototype has no runtime SLA clock).
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import ComplianceDonut from './ComplianceDonut.vue'
import { fieldName, optionLabel } from '@/lib/slaV2'
import {
  ANALYTICS_DEFINITIONS,
  CHANNEL_PERFORMANCE,
  RESOLUTION_BY_FIELD,
  SLA_COMPLIANCE,
  type ResolutionFieldRow,
} from '@/data/slaAnalyticsV2'

const open = defineModel<boolean>('open', { default: false })

const nf = new Intl.NumberFormat('en-GB')
const pct = (v: number) => `${Math.round(v * 100)}%`

/** Label for a resolution-by-field row (option value, or the literal default). */
function rowLabel(row: ResolutionFieldRow): string {
  return row.optionId ? optionLabel(RESOLUTION_BY_FIELD.fieldId, row.optionId) : (row.label ?? '')
}
</script>

<template>
  <Dialog v-model:open="open">
    <DialogContent class="max-w-4xl max-h-[85vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle>SLA analytics</DialogTitle>
        <DialogDescription>
          A preview of the insights your SLA policies unlock — sample data.
        </DialogDescription>
      </DialogHeader>

      <!-- §1 SLA compliance -->
      <section>
        <h3 class="text-base font-semibold text-grey-900">SLA compliance</h3>
        <p class="mt-1 text-sm text-grey-600">{{ ANALYTICS_DEFINITIONS.compliance }}</p>
        <div class="mt-4 flex items-center gap-6">
          <ComplianceDonut :value="SLA_COMPLIANCE.overall" />
          <div>
            <div class="text-xl font-semibold text-grey-900">{{ pct(SLA_COMPLIANCE.overall) }} compliant</div>
            <div class="mt-1 text-sm text-grey-600">
              {{ nf.format(SLA_COMPLIANCE.met) }} of {{ nf.format(SLA_COMPLIANCE.measured) }} conversations met
              their SLA
            </div>
          </div>
        </div>
      </section>

      <!-- §2 Resolution by custom field -->
      <section class="border-t border-grey-200 pt-5">
        <h3 class="text-base font-semibold text-grey-900">Resolution by custom field</h3>
        <p class="mt-1 text-sm text-grey-600">{{ ANALYTICS_DEFINITIONS.resolutionByField }}</p>
        <p class="mt-3 text-xs font-medium uppercase tracking-wide text-grey-600">
          {{ fieldName(RESOLUTION_BY_FIELD.fieldId) }}
        </p>
        <ul class="mt-2 flex flex-col gap-2.5">
          <li v-for="row in RESOLUTION_BY_FIELD.rows" :key="rowLabel(row)" class="flex items-center gap-3">
            <span class="w-44 shrink-0 truncate text-sm text-grey-800">{{ rowLabel(row) }}</span>
            <span class="shrink-0 rounded-pill bg-grey-200 px-2 py-0.5 text-xs font-medium text-grey-600">
              {{ row.targetLabel }}
            </span>
            <span class="h-2 flex-1 overflow-hidden rounded-pill bg-grey-200">
              <span class="block h-full rounded-pill bg-leaf-400" :style="{ width: pct(row.compliance) }" />
            </span>
            <span
              class="w-10 shrink-0 text-right text-sm font-semibold tabular-nums"
              :class="row.compliance < 0.8 ? 'text-sun-700' : 'text-grey-900'"
            >
              {{ pct(row.compliance) }}
            </span>
          </li>
        </ul>
      </section>

      <!-- §3 SLA compliance per channel -->
      <section class="border-t border-grey-200 pt-5">
        <h3 class="text-base font-semibold text-grey-900">SLA compliance per channel</h3>
        <p class="mt-1 text-sm text-grey-600">{{ ANALYTICS_DEFINITIONS.perChannel }}</p>
        <div class="mt-3 overflow-x-auto">
          <table class="w-full border-collapse text-sm">
            <thead>
              <tr class="text-left">
                <th class="whitespace-nowrap border-b border-grey-200 pb-2 pr-4 text-xs font-medium text-grey-600">Channel</th>
                <th class="whitespace-nowrap border-b border-grey-200 pb-2 pr-4 text-xs font-medium text-grey-600">Resolution time</th>
                <th class="whitespace-nowrap border-b border-grey-200 pb-2 pr-4 text-xs font-medium text-grey-600">First response time</th>
                <th class="whitespace-nowrap border-b border-grey-200 pb-2 pr-4 text-xs font-medium text-grey-600">SLA compliance</th>
                <th class="whitespace-nowrap border-b border-grey-200 pb-2 pr-4 text-xs font-medium text-grey-600">Closed tickets</th>
                <th class="whitespace-nowrap border-b border-grey-200 pb-2 text-xs font-medium text-grey-600">Open tickets</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="row in CHANNEL_PERFORMANCE" :key="row.channelId" class="border-t border-grey-200 first:border-t-0">
                <td class="whitespace-nowrap py-2.5 pr-4 font-medium text-grey-900">{{ row.channel }}</td>
                <td class="whitespace-nowrap py-2.5 pr-4 tabular-nums text-grey-700">{{ row.resolution }}</td>
                <td class="whitespace-nowrap py-2.5 pr-4 tabular-nums text-grey-700">{{ row.firstResponse }}</td>
                <td class="whitespace-nowrap py-2.5 pr-4">
                  <span
                    class="rounded-pill px-2 py-0.5 text-xs font-semibold"
                    :class="row.compliance < 0.85 ? 'bg-sun-100 text-sun-700' : 'bg-leaf-100 text-leaf-700'"
                  >
                    {{ pct(row.compliance) }}
                  </span>
                </td>
                <td class="whitespace-nowrap py-2.5 pr-4 tabular-nums text-grey-700">{{ nf.format(row.closed) }}</td>
                <td class="whitespace-nowrap py-2.5 tabular-nums text-grey-700">{{ nf.format(row.open) }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </DialogContent>
  </Dialog>
</template>
