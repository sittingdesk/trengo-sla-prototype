<script setup lang="ts">
// SlaAnalyticsModalV3 — per-type SLA analytics preview for Iteration 3 (typed
// SLAs). First response and resolution each get their own compliance % + median
// time; first response carries an AI-vs-human reporting-lens toggle. Channel /
// Team / Agent breakdowns share one table via tabs. Static illustrative mock.
import { computed, ref } from 'vue'
import Icon from '@/components/Icon.vue'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Tooltip } from '@/components/ui/tooltip'
import ComplianceDonut from './ComplianceDonut.vue'
import ResponseTimeDistribution from './ResponseTimeDistribution.vue'
import { optionLabel } from '@/lib/slaV3'
import {
  AGENT_PERFORMANCE,
  ANALYTICS_DEFINITIONS_V3 as DEF,
  CHANNEL_PERFORMANCE,
  DIST_BANDS,
  FIRST_RESPONSE,
  FIRST_RESPONSE_BY_TOPIC,
  FIRST_RESPONSE_DIST,
  RESOLUTION_DIST,
  type FrBasis,
  type FrTopicRow,
  type PerfCell,
  type PerfRow,
  type ResTopicRow,
  RESOLUTION,
  RESOLUTION_BY_TOPIC,
  TEAM_PERFORMANCE,
} from '@/data/slaAnalyticsV3'

const open = defineModel<boolean>('open', { default: false })

const nf = new Intl.NumberFormat('en-GB')
const pct = (v: number) => `${Math.round(v * 100)}%`

/** First-response reporting basis (a lens, not an SLA-config change). On the
 * future dynamic-tile dashboard this basis is per-tile config; here every
 * first-response view labels its active basis so it stays self-describing. */
const frBasis = ref<FrBasis>('inclAI')
const fr = computed(() => FIRST_RESPONSE[frBasis.value])
const basisLabel = computed(() => (frBasis.value === 'inclAI' ? 'incl. AI' : 'human only'))

/* by-Topic labels */
function frTopicLabel(row: FrTopicRow): string {
  return row.optionId ? optionLabel(FIRST_RESPONSE_BY_TOPIC.fieldId, row.optionId) : (row.label ?? '')
}
function resTopicLabel(row: ResTopicRow): string {
  return row.optionId ? optionLabel(RESOLUTION_BY_TOPIC.fieldId, row.optionId) : (row.label ?? '')
}

/* breakdown table: Channel | Team | Agent */
const dims = [
  { key: 'channel', label: 'Channel' },
  { key: 'team', label: 'Team' },
  { key: 'agent', label: 'Agent' },
] as const
type DimKey = (typeof dims)[number]['key']
const dim = ref<DimKey>('channel')

const rows = computed<PerfRow[]>(() =>
  dim.value === 'channel' ? CHANNEL_PERFORMANCE : dim.value === 'team' ? TEAM_PERFORMANCE : AGENT_PERFORMANCE,
)

/** The first-response cell for the active basis (or null → "— no SLA"). */
function frCell(row: PerfRow): PerfCell | null {
  return row.fr[frBasis.value]
}

/** Avatar bg for an agent's initials — deterministic, no PII. */
const AVATAR_BG = ['bg-leaf-200 text-leaf-800', 'bg-sky-200 text-sky-800', 'bg-sun-100 text-sun-700', 'bg-grey-300 text-grey-800']
function avatarClass(id: string): string {
  let h = 0
  for (const c of id) h = (h + c.charCodeAt(0)) % AVATAR_BG.length
  return AVATAR_BG[h]
}

const th = 'whitespace-nowrap border-b border-grey-200 pb-2 pr-4 text-xs font-medium text-grey-600'
const td = 'whitespace-nowrap py-2.5 pr-4'
function pill(v: number): string {
  return v < 0.85 ? 'bg-sun-100 text-sun-700' : 'bg-leaf-100 text-leaf-700'
}
</script>

<template>
  <Dialog v-model:open="open">
    <DialogContent class="max-w-4xl max-h-[85vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle>SLA analytics</DialogTitle>
        <DialogDescription>
          Per-type insight for your SLAs — sample data.
        </DialogDescription>
      </DialogHeader>

      <!-- §0 KPI row: one card per type (compliance % + median time) -->
      <section class="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <!-- First response (with AI-vs-human basis toggle) -->
        <div class="rounded-lg border border-grey-300 p-4">
          <div class="flex items-center justify-between gap-2">
            <h3 class="flex items-center gap-1.5 text-sm font-semibold text-grey-900">
              <Icon name="Reply" :size="16" class="text-grey-700" />
              First response
              <Tooltip :text="DEF.firstResponseTip">
                <button
                  type="button"
                  class="flex size-4 items-center justify-center rounded-circle text-grey-400 transition-colors hover:text-grey-600 focus:outline-none focus-visible:shadow-focus-sm"
                  aria-label="About first response"
                >
                  <Icon name="Info" :size="16" />
                </button>
              </Tooltip>
            </h3>
            <div
              class="inline-flex items-center gap-0.5 rounded-pill border border-grey-300 bg-white p-0.5"
              role="group"
              aria-label="First response basis"
            >
              <button
                type="button"
                class="rounded-pill px-2 py-px text-[10px] font-semibold leading-[14px] transition-colors"
                :class="frBasis === 'inclAI' ? 'bg-grey-900 text-white' : 'text-grey-600 hover:text-grey-900'"
                @click="frBasis = 'inclAI'"
              >
                Incl. AI
              </button>
              <button
                type="button"
                class="rounded-pill px-2 py-px text-[10px] font-semibold leading-[14px] transition-colors"
                :class="frBasis === 'human' ? 'bg-grey-900 text-white' : 'text-grey-600 hover:text-grey-900'"
                @click="frBasis = 'human'"
              >
                Human only
              </button>
            </div>
          </div>
          <div class="mt-3 flex items-center gap-4">
            <ComplianceDonut :value="fr.overall" :size="96" :stroke="10" />
            <div class="min-w-0">
              <div class="text-sm text-grey-600">Median time</div>
              <div class="text-xl font-semibold tabular-nums text-grey-900">{{ fr.medianTime }}</div>
              <div class="mt-1 text-xs text-grey-600">
                {{ nf.format(fr.met) }} of {{ nf.format(fr.measured) }} met
              </div>
            </div>
          </div>
        </div>

        <!-- Resolution -->
        <div class="rounded-lg border border-grey-300 p-4">
          <h3 class="flex items-center gap-1.5 text-sm font-semibold text-grey-900">
            <Icon name="Check" :size="16" class="text-grey-700" />
            Resolution
            <Tooltip :text="DEF.resolutionTip">
              <button
                type="button"
                class="flex size-4 items-center justify-center rounded-circle text-grey-400 transition-colors hover:text-grey-600 focus:outline-none focus-visible:shadow-focus-sm"
                aria-label="About resolution"
              >
                <Icon name="Info" :size="16" />
              </button>
            </Tooltip>
          </h3>
          <div class="mt-3 flex items-center gap-4">
            <ComplianceDonut :value="RESOLUTION.overall" :size="96" :stroke="10" />
            <div class="min-w-0">
              <div class="text-sm text-grey-600">Median time</div>
              <div class="text-xl font-semibold tabular-nums text-grey-900">{{ RESOLUTION.medianTime }}</div>
              <div class="mt-1 text-xs text-grey-600">
                {{ nf.format(RESOLUTION.met) }} of {{ nf.format(RESOLUTION.measured) }} met
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- §0b Response-time distribution (shape of the misses, per type) -->
      <section class="border-t border-grey-200 pt-5">
        <h3 class="text-base font-semibold text-grey-900">Response-time distribution</h3>
        <p class="mt-1 text-sm text-grey-600">{{ DEF.distributionNote }}</p>
        <div class="mt-4 grid grid-cols-1 gap-6 sm:grid-cols-2">
          <div>
            <p class="mb-2 flex items-center gap-1.5 text-sm font-medium text-grey-800">
              <Icon name="Reply" :size="14" class="text-grey-700" />
              First response
              <span class="rounded-pill bg-grey-200 px-2 py-0.5 text-[11px] font-medium text-grey-600">
                {{ basisLabel }}
              </span>
            </p>
            <ResponseTimeDistribution :dist="FIRST_RESPONSE_DIST[frBasis]" :labels="DIST_BANDS" />
          </div>
          <div>
            <p class="mb-2 flex items-center gap-1.5 text-sm font-medium text-grey-800">
              <Icon name="Check" :size="14" class="text-grey-700" />
              Resolution
            </p>
            <ResponseTimeDistribution :dist="RESOLUTION_DIST" :labels="DIST_BANDS" />
          </div>
        </div>
      </section>

      <!-- §1 First response by topic (descriptive slice) -->
      <section class="border-t border-grey-200 pt-5">
        <div class="flex items-center gap-2">
          <h3 class="text-base font-semibold text-grey-900">First response by topic</h3>
          <span class="rounded-pill bg-grey-200 px-2 py-0.5 text-[11px] font-medium text-grey-600">
            {{ basisLabel }}
          </span>
        </div>
        <p class="mt-1 text-sm text-grey-600">{{ DEF.firstResponse }}</p>
        <p class="mt-1 text-xs italic text-grey-600">{{ DEF.byTopicNote }}</p>
        <ul class="mt-3 flex flex-col gap-2.5">
          <li v-for="row in FIRST_RESPONSE_BY_TOPIC.rows" :key="frTopicLabel(row)" class="flex items-center gap-3">
            <span class="w-44 shrink-0 truncate text-sm text-grey-800">{{ frTopicLabel(row) }}</span>
            <span class="h-2 flex-1 overflow-hidden rounded-pill bg-grey-200">
              <span class="block h-full rounded-pill bg-leaf-400" :style="{ width: pct(row[frBasis]) }" />
            </span>
            <span
              class="w-10 shrink-0 text-right text-sm font-semibold tabular-nums"
              :class="row[frBasis] < 0.8 ? 'text-sun-700' : 'text-grey-900'"
            >
              {{ pct(row[frBasis]) }}
            </span>
          </li>
        </ul>
      </section>

      <!-- §2 Resolution by topic -->
      <section class="border-t border-grey-200 pt-5">
        <h3 class="text-base font-semibold text-grey-900">Resolution by topic</h3>
        <p class="mt-1 text-sm text-grey-600">{{ DEF.resolution }}</p>
        <ul class="mt-3 flex flex-col gap-2.5">
          <li v-for="row in RESOLUTION_BY_TOPIC.rows" :key="resTopicLabel(row)" class="flex items-center gap-3">
            <span class="w-44 shrink-0 truncate text-sm text-grey-800">{{ resTopicLabel(row) }}</span>
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

      <!-- §3 Breakdown: Channel | Team | Agent (tabs over one table) -->
      <section class="border-t border-grey-200 pt-5">
        <div class="flex items-center justify-between gap-3">
          <h3 class="text-base font-semibold text-grey-900">SLA compliance breakdown</h3>
          <div
            class="inline-flex items-center gap-0.5 rounded-pill border border-grey-300 bg-white p-0.5"
            role="group"
            aria-label="Breakdown dimension"
          >
            <button
              v-for="d in dims"
              :key="d.key"
              type="button"
              class="rounded-pill px-2.5 py-1 text-xs font-semibold transition-colors"
              :class="dim === d.key ? 'bg-grey-900 text-white' : 'text-grey-600 hover:text-grey-900'"
              @click="dim = d.key"
            >
              {{ d.label }}
            </button>
          </div>
        </div>
        <p class="mt-1 text-sm text-grey-600">{{ DEF.perDimension }}</p>

        <div class="mt-3 overflow-x-auto">
          <table class="w-full border-collapse text-sm">
            <thead>
              <tr class="text-left">
                <th :class="th">{{ dims.find((d) => d.key === dim)?.label }}</th>
                <th :class="th">
                  First response
                  <span class="font-normal normal-case text-grey-600">· {{ basisLabel }}</span>
                </th>
                <th :class="th">Resolution</th>
                <th :class="th">Closed</th>
                <th :class="th.replace(' pr-4', '')">Open</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="row in rows" :key="row.id" class="border-t border-grey-200 first:border-t-0">
                <td :class="[td, 'font-medium text-grey-900']">
                  <span v-if="row.initials" class="flex items-center gap-2">
                    <span
                      class="flex size-6 shrink-0 items-center justify-center rounded-circle text-[10px] font-semibold"
                      :class="avatarClass(row.id)"
                      aria-hidden="true"
                    >{{ row.initials }}</span>
                    {{ row.label }}
                  </span>
                  <template v-else>{{ row.label }}</template>
                </td>
                <!-- First response: compliance pill + median time (active basis) -->
                <td :class="td">
                  <span v-if="frCell(row)" class="flex items-center gap-2">
                    <span
                      class="rounded-pill px-2 py-0.5 text-xs font-semibold"
                      :class="pill(frCell(row)!.pct)"
                    >{{ pct(frCell(row)!.pct) }}</span>
                    <span class="text-xs tabular-nums text-grey-600">{{ frCell(row)!.time }}</span>
                  </span>
                  <span v-else class="text-xs text-grey-400">— no SLA</span>
                </td>
                <!-- Resolution: compliance pill + median time -->
                <td :class="td">
                  <span v-if="row.res" class="flex items-center gap-2">
                    <span
                      class="rounded-pill px-2 py-0.5 text-xs font-semibold"
                      :class="pill(row.res.pct)"
                    >{{ pct(row.res.pct) }}</span>
                    <span class="text-xs tabular-nums text-grey-600">{{ row.res.time }}</span>
                  </span>
                  <span v-else class="text-xs text-grey-400">— no SLA</span>
                </td>
                <td :class="[td, 'tabular-nums text-grey-700']">{{ nf.format(row.closed) }}</td>
                <td class="whitespace-nowrap py-2.5 tabular-nums text-grey-700">{{ nf.format(row.open) }}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p v-if="dim === 'agent'" class="mt-3 text-xs italic text-grey-600">{{ DEF.agentPrivacyNote }}</p>
      </section>
    </DialogContent>
  </Dialog>
</template>
