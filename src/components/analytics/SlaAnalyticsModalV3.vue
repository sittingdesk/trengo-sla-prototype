<script setup lang="ts">
// SlaAnalyticsModalV3 — per-type SLA analytics preview for the typed iterations
// (3 & 4). An overall SLA-compliance headline, then first response and
// resolution each with a compliance % + median time and a by-topic breakdown.
// Static illustrative mock.
//
// The AI split is a TICKET COHORT: "Human only" is a different SET of tickets
// (an AI Agent never touched them), not the same tickets measured differently —
// so it changes the denominator, and the two cohorts are not a like-for-like
// comparison. Each metric owns its own cohort: the First response toggle drives
// that card AND its by-topic list, likewise resolution. The two metrics are
// never summed, so they can sit at different cohorts without producing a
// nonsense total — but each section states which cohort it is showing. The
// SLA-compliance headline has no toggle: it is the verdict over every ticket
// carrying an SLA, full stop.
import { computed, ref } from 'vue'
import Icon from '@/components/Icon.vue'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Tooltip } from '@/components/ui/tooltip'
import ComplianceDonut from './ComplianceDonut.vue'
import CohortToggle from './CohortToggle.vue'
import { optionLabel } from '@/lib/slaV3'
import {
  ANALYTICS_DEFINITIONS_V3 as DEF,
  FIRST_RESPONSE,
  SLA_COMPLIANCE,
  FIRST_RESPONSE_BY_TOPIC,
  type Cohort,
  type ResTopicRow,
  RESOLUTION,
  RESOLUTION_BY_TOPIC,
  type TopicRow,
} from '@/data/slaAnalyticsV3'

const open = defineModel<boolean>('open', { default: false })

const nf = new Intl.NumberFormat('en-GB')
const pct = (v: number) => `${Math.round(v * 100)}%`

/* ── ticket cohort, per metric ─────────────────────────────────────────── */

/**
 * Human-only is parked for now — the segment shows but is disabled, so reviewers
 * can see it's coming without reading numbers we're not standing behind yet.
 * Flip this to `true` to bring it back: both toggles, the cohort data and the
 * per-section labels are all still wired up.
 */
const HUMAN_ONLY_ENABLED = false

const frCohort = ref<Cohort>('all')
const resCohort = ref<Cohort>('all')

/** The headline has NO cohort toggle: it's the overall verdict across every
 * ticket carrying an SLA, so it always reads the full population. The `human`
 * figures stay in the data, ready if we ever give it one. */
const compliance = SLA_COMPLIANCE.all
const fr = computed(() => FIRST_RESPONSE[frCohort.value])
const res = computed(() => RESOLUTION[resCohort.value])

function cohortLabel(c: Cohort): string {
  return c === 'all' ? 'everything' : 'without AI'
}

/** The metric definition plus what the chosen cohort actually contains — the
 * card header has no room for the caveat, the tooltip does. */
function tip(base: string, c: Cohort): string {
  return `${base} ${c === 'all' ? DEF.cohortAll : DEF.cohortHuman}`
}

/* by-Topic labels */
function frTopicLabel(row: TopicRow): string {
  return row.optionId ? optionLabel(FIRST_RESPONSE_BY_TOPIC.fieldId, row.optionId) : (row.label ?? '')
}
function resTopicLabel(row: ResTopicRow): string {
  return row.optionId ? optionLabel(RESOLUTION_BY_TOPIC.fieldId, row.optionId) : (row.label ?? '')
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

      <!-- §0 Headline: the whole-ticket verdict. Full width and above the pair
           because the two below are its components, not its peers — and it is
           always the lower number, since one miss fails the whole ticket. -->
      <section class="rounded-lg border border-grey-300 p-4">
        <div class="flex items-start gap-2">
          <h3 class="flex items-center gap-1.5 text-sm font-semibold text-grey-900">
            <Icon name="ProcentCircle" :size="16" class="text-grey-700" />
            SLA compliance
            <Tooltip :text="tip(DEF.complianceTip, 'all')">
              <button
                type="button"
                class="flex size-4 items-center justify-center rounded-circle text-grey-400 transition-colors hover:text-grey-600 focus:outline-none focus-visible:shadow-focus-sm"
                aria-label="About SLA compliance"
              >
                <Icon name="Info" :size="16" />
              </button>
            </Tooltip>
          </h3>
        </div>
        <div class="mt-3 flex items-center gap-5">
          <ComplianceDonut :value="compliance.overall" :size="96" :stroke="10" />
          <div class="min-w-0">
            <div class="text-sm font-medium text-grey-800">
              {{ nf.format(compliance.met) }} of {{ nf.format(compliance.measured) }} tickets met
              every target that applied
            </div>
            <p class="mt-1 max-w-[520px] text-xs text-grey-600">{{ DEF.compliance }}</p>
          </div>
        </div>
      </section>

      <!-- §1 One card per type (compliance % + median time), each with its own
           ticket cohort. -->
      <section class="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <!-- First response -->
        <div class="rounded-lg border border-grey-300 p-4">
          <div class="flex items-start justify-between gap-2">
            <h3 class="flex items-center gap-1.5 text-sm font-semibold text-grey-900">
              <Icon name="Reply" :size="16" class="text-grey-700" />
              First response
              <Tooltip :text="tip(DEF.firstResponseTip, frCohort)">
                <button
                  type="button"
                  class="flex size-4 items-center justify-center rounded-circle text-grey-400 transition-colors hover:text-grey-600 focus:outline-none focus-visible:shadow-focus-sm"
                  aria-label="About first response"
                >
                  <Icon name="Info" :size="16" />
                </button>
              </Tooltip>
            </h3>
            <CohortToggle
              v-model="frCohort"
              :human-enabled="HUMAN_ONLY_ENABLED"
              label="First response — which tickets"
            />
          </div>
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
        </div>

        <!-- Resolution -->
        <div class="rounded-lg border border-grey-300 p-4">
          <div class="flex items-start justify-between gap-2">
            <h3 class="flex items-center gap-1.5 text-sm font-semibold text-grey-900">
              <Icon name="Check" :size="16" class="text-grey-700" />
              Resolution
              <Tooltip :text="tip(DEF.resolutionTip, resCohort)">
                <button
                  type="button"
                  class="flex size-4 items-center justify-center rounded-circle text-grey-400 transition-colors hover:text-grey-600 focus:outline-none focus-visible:shadow-focus-sm"
                  aria-label="About resolution"
                >
                  <Icon name="Info" :size="16" />
                </button>
              </Tooltip>
            </h3>
            <CohortToggle
              v-model="resCohort"
              :human-enabled="HUMAN_ONLY_ENABLED"
              label="Resolution — which tickets"
            />
          </div>
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
        </div>
      </section>

      <!-- §2 First response by topic (descriptive slice) — follows the card -->
      <section class="border-t border-grey-200 pt-5">
        <div class="flex items-center gap-2">
          <h3 class="text-base font-semibold text-grey-900">First response by topic</h3>
          <span
            v-if="HUMAN_ONLY_ENABLED"
            class="rounded-pill bg-grey-200 px-2 py-0.5 text-[11px] font-medium text-grey-600"
          >
            {{ cohortLabel(frCohort) }}
          </span>
        </div>
        <p class="mt-1 text-sm text-grey-600">{{ DEF.firstResponse }}</p>
        <p class="mt-1 text-xs italic text-grey-600">{{ DEF.byTopicNote }}</p>
        <ul class="mt-3 flex flex-col gap-2.5">
          <li v-for="row in FIRST_RESPONSE_BY_TOPIC.rows" :key="frTopicLabel(row)" class="flex items-center gap-3">
            <span class="w-44 shrink-0 truncate text-sm text-grey-800">{{ frTopicLabel(row) }}</span>
            <span class="h-2 flex-1 overflow-hidden rounded-pill bg-grey-200">
              <span class="block h-full rounded-pill bg-leaf-400" :style="{ width: pct(row[frCohort]) }" />
            </span>
            <span
              class="w-10 shrink-0 text-right text-sm font-semibold tabular-nums"
              :class="row[frCohort] < 0.8 ? 'text-sun-700' : 'text-grey-900'"
            >
              {{ pct(row[frCohort]) }}
            </span>
          </li>
        </ul>
      </section>

      <!-- §3 Resolution by topic — follows the resolution card -->
      <section class="border-t border-grey-200 pt-5">
        <div class="flex items-center gap-2">
          <h3 class="text-base font-semibold text-grey-900">Resolution by topic</h3>
          <span
            v-if="HUMAN_ONLY_ENABLED"
            class="rounded-pill bg-grey-200 px-2 py-0.5 text-[11px] font-medium text-grey-600"
          >
            {{ cohortLabel(resCohort) }}
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
              <span class="block h-full rounded-pill bg-leaf-400" :style="{ width: pct(row[resCohort]) }" />
            </span>
            <span
              class="w-10 shrink-0 text-right text-sm font-semibold tabular-nums"
              :class="row[resCohort] < 0.8 ? 'text-sun-700' : 'text-grey-900'"
            >
              {{ pct(row[resCohort]) }}
            </span>
          </li>
        </ul>
      </section>
    </DialogContent>
  </Dialog>
</template>
