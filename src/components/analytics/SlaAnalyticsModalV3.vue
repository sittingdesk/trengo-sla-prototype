<script setup lang="ts">
// SlaAnalyticsModalV3 — per-type SLA analytics preview for the typed iterations
// (3 & 4). First response and resolution each get their own compliance % +
// median time; Channel / Team / Agent breakdowns share one table via tabs.
//
// The AI split is ONE GLOBAL TICKET COHORT filter at the top, not a per-card
// toggle: "Human only" means a different SET of tickets (AI never touched them),
// so two cards with independent toggles could describe two different
// populations side by side. Because a filter hides the contrast — and the
// contrast is the interesting part — each KPI card also carries a muted
// reference line for the other cohort. Static illustrative mock.
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
  type Cohort,
  type CohortCells,
  type PerfRow,
  type ResTopicRow,
  RESOLUTION,
  RESOLUTION_BY_TOPIC,
  TEAM_PERFORMANCE,
  type TopicRow,
} from '@/data/slaAnalyticsV3'

const open = defineModel<boolean>('open', { default: false })

const nf = new Intl.NumberFormat('en-GB')
const pct = (v: number) => `${Math.round(v * 100)}%`

/* ── ticket cohort (the global AI filter) ──────────────────────────────── */

const cohorts = [
  { key: 'all', label: 'Everything, including AI' },
  { key: 'human', label: 'Human only' },
] as const

/**
 * Human-only is parked for now — the segment shows but is disabled, so reviewers
 * can see it's coming without reading numbers we're not standing behind yet.
 * Flip this to `true` to bring it back: the cohort data, the filter, the
 * comparison lines and the per-section labels are all still wired up.
 */
const HUMAN_ONLY_ENABLED = false

/** Which tickets every figure in the modal describes. Defaults to `all` — that's
 * the service level customers actually experience. */
const cohort = ref<Cohort>('all')
const other = computed<Cohort>(() => (cohort.value === 'all' ? 'human' : 'all'))

const cohortLabel = computed(() => (cohort.value === 'all' ? 'everything, incl. AI' : 'human only'))
function cohortName(c: Cohort): string {
  return c === 'all' ? 'Everything, including AI' : 'Human only'
}

const fr = computed(() => FIRST_RESPONSE[cohort.value])
const res = computed(() => RESOLUTION[cohort.value])

/** The caption under the filter: the cohort's size, in tickets. Human-only is a
 * small slice, so the share is stated rather than left to be inferred. */
const cohortCaption = computed(() => {
  if (cohort.value === 'all') return DEF.cohortAll
  const share = Math.round((FIRST_RESPONSE.human.measured / FIRST_RESPONSE.all.measured) * 100)
  return `${nf.format(FIRST_RESPONSE.human.measured)} of ${nf.format(
    FIRST_RESPONSE.all.measured,
  )} tickets (${share}%). ${DEF.cohortHuman}`
})

/* by-Topic labels */
function frTopicLabel(row: TopicRow): string {
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

/** This row's figures within the active cohort. */
function cells(row: PerfRow): CohortCells {
  return row[cohort.value]
}

/** No tickets at all in this cohort — a 0% pill would be a lie, so say so. */
function isEmpty(row: PerfRow): boolean {
  const c = cells(row)
  return c.closed === 0 && c.open === 0
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

      <!-- Ticket cohort: ONE filter for the whole modal. Everything below moves
           together, so no two sections ever describe different populations. -->
      <section class="rounded-lg border border-grey-300 bg-grey-100 p-3">
        <div class="flex flex-wrap items-center gap-x-3 gap-y-2">
          <span class="text-sm font-semibold text-grey-900">Which tickets</span>
          <div
            class="inline-flex items-center gap-0.5 rounded-pill border border-grey-300 bg-white p-0.5"
            role="group"
            aria-label="Ticket cohort"
          >
            <button
              v-for="c in cohorts"
              :key="c.key"
              type="button"
              :disabled="c.key === 'human' && !HUMAN_ONLY_ENABLED"
              :title="c.key === 'human' && !HUMAN_ONLY_ENABLED ? 'Not available yet' : undefined"
              class="rounded-pill px-2.5 py-1 text-xs font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:text-grey-600"
              :class="cohort === c.key ? 'bg-grey-900 text-white' : 'text-grey-600 hover:text-grey-900'"
              @click="cohort = c.key"
            >
              {{ c.label }}
            </button>
          </div>
        </div>
        <p class="mt-2 text-xs text-grey-700">{{ cohortCaption }}</p>
      </section>

      <!-- §0 KPI row: one card per type (compliance % + median time) -->
      <section class="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <!-- First response -->
        <div class="rounded-lg border border-grey-300 p-4">
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
          <div class="mt-3 flex items-center gap-4">
            <ComplianceDonut :value="fr.overall" :size="96" :stroke="10" />
            <div class="min-w-0">
              <div class="text-sm text-grey-600">Median time</div>
              <div class="text-xl font-semibold tabular-nums text-grey-900">{{ fr.medianTime }}</div>
              <div class="mt-1 text-xs text-grey-600">
                {{ nf.format(fr.met) }} of {{ nf.format(fr.measured) }} tickets met
              </div>
            </div>
          </div>
          <!-- The other cohort, for contrast the filter would otherwise hide. -->
          <p v-if="HUMAN_ONLY_ENABLED" class="mt-3 border-t border-grey-200 pt-2 text-xs text-grey-600">
            {{ cohortName(other) }}:
            <span class="font-semibold text-grey-700">{{ pct(FIRST_RESPONSE[other].overall) }}</span>
            · {{ FIRST_RESPONSE[other].medianTime }}
            · {{ nf.format(FIRST_RESPONSE[other].measured) }} tickets
          </p>
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
            <ComplianceDonut :value="res.overall" :size="96" :stroke="10" />
            <div class="min-w-0">
              <div class="text-sm text-grey-600">Median time</div>
              <div class="text-xl font-semibold tabular-nums text-grey-900">{{ res.medianTime }}</div>
              <div class="mt-1 text-xs text-grey-600">
                {{ nf.format(res.met) }} of {{ nf.format(res.measured) }} tickets met
              </div>
            </div>
          </div>
          <p v-if="HUMAN_ONLY_ENABLED" class="mt-3 border-t border-grey-200 pt-2 text-xs text-grey-600">
            {{ cohortName(other) }}:
            <span class="font-semibold text-grey-700">{{ pct(RESOLUTION[other].overall) }}</span>
            · {{ RESOLUTION[other].medianTime }}
            · {{ nf.format(RESOLUTION[other].measured) }} tickets
          </p>
        </div>
      </section>

      <!-- §0b Response-time distribution (shape of the misses, per type) -->
      <section class="border-t border-grey-200 pt-5">
        <div class="flex items-center gap-2">
          <h3 class="text-base font-semibold text-grey-900">Response-time distribution</h3>
          <span
            v-if="HUMAN_ONLY_ENABLED"
            class="rounded-pill bg-grey-200 px-2 py-0.5 text-[11px] font-medium text-grey-600"
          >
            {{ cohortLabel }}
          </span>
        </div>
        <p class="mt-1 text-sm text-grey-600">{{ DEF.distributionNote }}</p>
        <div class="mt-4 grid grid-cols-1 gap-6 sm:grid-cols-2">
          <div>
            <p class="mb-2 flex items-center gap-1.5 text-sm font-medium text-grey-800">
              <Icon name="Reply" :size="14" class="text-grey-700" />
              First response
            </p>
            <ResponseTimeDistribution :dist="FIRST_RESPONSE_DIST[cohort]" :labels="DIST_BANDS" />
          </div>
          <div>
            <p class="mb-2 flex items-center gap-1.5 text-sm font-medium text-grey-800">
              <Icon name="Check" :size="14" class="text-grey-700" />
              Resolution
            </p>
            <ResponseTimeDistribution :dist="RESOLUTION_DIST[cohort]" :labels="DIST_BANDS" />
          </div>
        </div>
      </section>

      <!-- §1 First response by topic (descriptive slice) -->
      <section class="border-t border-grey-200 pt-5">
        <div class="flex items-center gap-2">
          <h3 class="text-base font-semibold text-grey-900">First response by topic</h3>
          <span
            v-if="HUMAN_ONLY_ENABLED"
            class="rounded-pill bg-grey-200 px-2 py-0.5 text-[11px] font-medium text-grey-600"
          >
            {{ cohortLabel }}
          </span>
        </div>
        <p class="mt-1 text-sm text-grey-600">{{ DEF.firstResponse }}</p>
        <p class="mt-1 text-xs italic text-grey-600">{{ DEF.byTopicNote }}</p>
        <ul class="mt-3 flex flex-col gap-2.5">
          <li v-for="row in FIRST_RESPONSE_BY_TOPIC.rows" :key="frTopicLabel(row)" class="flex items-center gap-3">
            <span class="w-44 shrink-0 truncate text-sm text-grey-800">{{ frTopicLabel(row) }}</span>
            <span class="h-2 flex-1 overflow-hidden rounded-pill bg-grey-200">
              <span class="block h-full rounded-pill bg-leaf-400" :style="{ width: pct(row[cohort]) }" />
            </span>
            <span
              class="w-10 shrink-0 text-right text-sm font-semibold tabular-nums"
              :class="row[cohort] < 0.8 ? 'text-sun-700' : 'text-grey-900'"
            >
              {{ pct(row[cohort]) }}
            </span>
          </li>
        </ul>
      </section>

      <!-- §2 Resolution by topic -->
      <section class="border-t border-grey-200 pt-5">
        <div class="flex items-center gap-2">
          <h3 class="text-base font-semibold text-grey-900">Resolution by topic</h3>
          <span
            v-if="HUMAN_ONLY_ENABLED"
            class="rounded-pill bg-grey-200 px-2 py-0.5 text-[11px] font-medium text-grey-600"
          >
            {{ cohortLabel }}
          </span>
        </div>
        <p class="mt-1 text-sm text-grey-600">{{ DEF.resolution }}</p>
        <ul class="mt-3 flex flex-col gap-2.5">
          <li v-for="row in RESOLUTION_BY_TOPIC.rows" :key="resTopicLabel(row)" class="flex items-center gap-3">
            <span class="w-44 shrink-0 truncate text-sm text-grey-800">{{ resTopicLabel(row) }}</span>
            <span class="shrink-0 rounded-pill bg-grey-200 px-2 py-0.5 text-xs font-medium text-grey-600">
              {{ row.targetLabel }}
            </span>
            <span class="h-2 flex-1 overflow-hidden rounded-pill bg-grey-200">
              <span class="block h-full rounded-pill bg-leaf-400" :style="{ width: pct(row[cohort]) }" />
            </span>
            <span
              class="w-10 shrink-0 text-right text-sm font-semibold tabular-nums"
              :class="row[cohort] < 0.8 ? 'text-sun-700' : 'text-grey-900'"
            >
              {{ pct(row[cohort]) }}
            </span>
          </li>
        </ul>
      </section>

      <!-- §3 Breakdown: Channel | Team | Agent (tabs over one table) -->
      <section class="border-t border-grey-200 pt-5">
        <div class="flex items-center justify-between gap-3">
          <div class="flex items-center gap-2">
            <h3 class="text-base font-semibold text-grey-900">SLA compliance breakdown</h3>
            <span
              v-if="HUMAN_ONLY_ENABLED"
              class="rounded-pill bg-grey-200 px-2 py-0.5 text-[11px] font-medium text-grey-600"
            >
              {{ cohortLabel }}
            </span>
          </div>
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
                <th :class="th">First response</th>
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
                <!-- No tickets in this cohort is a different fact from no SLA. -->
                <template v-if="isEmpty(row)">
                  <td :class="td" colspan="2">
                    <span class="text-xs text-grey-400">— no tickets in this view</span>
                  </td>
                </template>
                <template v-else>
                  <!-- First response: compliance pill + median time -->
                  <td :class="td">
                    <span v-if="cells(row).fr" class="flex items-center gap-2">
                      <span
                        class="rounded-pill px-2 py-0.5 text-xs font-semibold"
                        :class="pill(cells(row).fr!.pct)"
                      >{{ pct(cells(row).fr!.pct) }}</span>
                      <span class="text-xs tabular-nums text-grey-600">{{ cells(row).fr!.time }}</span>
                    </span>
                    <span v-else class="text-xs text-grey-400">— no SLA</span>
                  </td>
                  <!-- Resolution: compliance pill + median time -->
                  <td :class="td">
                    <span v-if="cells(row).res" class="flex items-center gap-2">
                      <span
                        class="rounded-pill px-2 py-0.5 text-xs font-semibold"
                        :class="pill(cells(row).res!.pct)"
                      >{{ pct(cells(row).res!.pct) }}</span>
                      <span class="text-xs tabular-nums text-grey-600">{{ cells(row).res!.time }}</span>
                    </span>
                    <span v-else class="text-xs text-grey-400">— no SLA</span>
                  </td>
                </template>
                <td :class="[td, 'tabular-nums text-grey-700']">{{ nf.format(cells(row).closed) }}</td>
                <td class="whitespace-nowrap py-2.5 tabular-nums text-grey-700">{{ nf.format(cells(row).open) }}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p class="mt-3 text-xs italic text-grey-600">{{ DEF.cohortDataNote }}</p>
        <p v-if="dim === 'agent'" class="mt-1 text-xs italic text-grey-600">{{ DEF.agentPrivacyNote }}</p>
      </section>
    </DialogContent>
  </Dialog>
</template>
