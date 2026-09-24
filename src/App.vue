<script setup lang="ts">
// App.vue — the overall shell that frames every page.
// Layout, left to right: [ RailSidebar (icon rail) ][ SettingsSidebar ][ content ].
// The content area shows the SLA settings views for the active ITERATION:
// each iteration is a fully independent copy (own components, store, data),
// chosen via the bottom-right IterationSwitcher. The view-mode
// switcher (Normal/Loading/Empty) is shared and applies to whichever overview.
import { computed, ref } from 'vue'
import { RailSidebar } from '@/components/rail'
import SlaAnalyticsModal from '@/components/analytics/SlaAnalyticsModal.vue'
import SlaAnalyticsModalV3 from '@/components/analytics/SlaAnalyticsModalV3.vue'
import SlaExplainerModal from '@/components/analytics/SlaExplainerModal.vue'
import SettingsSidebar from '@/components/layout/SettingsSidebar.vue'
import SlaOverview from '@/components/sla/SlaOverview.vue'
import SlaEditor from '@/components/sla/SlaEditor.vue'
import SlaOverviewV2 from '@/components/sla-v2/SlaOverview.vue'
import SlaEditorV2 from '@/components/sla-v2/SlaEditor.vue'
import SlaOverviewV3 from '@/components/sla-v3/SlaOverview.vue'
import SlaEditorV3 from '@/components/sla-v3/SlaEditor.vue'
import SlaOverviewV4 from '@/components/sla-v4/SlaOverview.vue'
import SlaEditorV4 from '@/components/sla-v4/SlaEditor.vue'
import ViewModeSwitcher from '@/components/sla/ViewModeSwitcher.vue'
import PageErrorState from '@/components/sla/PageErrorState.vue'
import IterationSwitcher from '@/components/sla/IterationSwitcher.vue'
import CustomFieldsToggle from '@/components/sla/CustomFieldsToggle.vue'
import { useSlaNav } from '@/composables/useSlaNav'
import { useSlaNavV2 } from '@/composables/useSlaNavV2'
import { useSlaNavV3 } from '@/composables/useSlaNavV3'
import { useSlaNavV4 } from '@/composables/useSlaNavV4'
import { useIteration } from '@/composables/useIteration'
import { useViewMode } from '@/composables/useViewMode'

const { iteration } = useIteration()
const { mode } = useViewMode()
const { nav } = useSlaNav()
const { nav: navV2 } = useSlaNavV2()
const { nav: navV3 } = useSlaNavV3()
const { nav: navV4 } = useSlaNavV4()

// The rail's pie-chart ("Reports") icon opens the SLA analytics preview modal;
// the Help (?) icon opens the "How SLAs work" explainer reference.
const analyticsOpen = ref(false)
const explainerOpen = ref(false)

// Explicit per iteration — no catch-all, so a new iteration can never silently
// borrow the previous one's nav state.
const navByIteration = computed(() => ({ 1: nav.value, 2: navV2.value, 3: navV3.value, 4: navV4.value }))

const onOverview = computed(() => navByIteration.value[iteration.value].view === 'overview')
</script>

<template>
  <div class="flex h-full w-full overflow-hidden">
    <RailSidebar
      active="settings"
      @select="(k: string) => { if (k === 'reports') analyticsOpen = true; else if (k === 'help') explainerOpen = true }"
    />
    <SettingsSidebar />

    <!-- Scrollable content area -->
    <main class="scroll-thin flex-1 overflow-y-auto bg-grey-100">
      <!-- Page-level failure: the data never arrived, so there is no page to
           render. Replaces every iteration's content, header included — see
           PageErrorState for why creating must not stay reachable here. -->
      <PageErrorState v-if="mode === 'error'" />
      <template v-else-if="iteration === 1">
        <SlaOverview v-if="nav.view === 'overview'" />
        <SlaEditor v-else :edit-id="nav.editId" :key="nav.editId ?? 'new'" />
      </template>
      <template v-else-if="iteration === 2">
        <SlaOverviewV2 v-if="navV2.view === 'overview'" />
        <SlaEditorV2 v-else :edit-id="navV2.editId" :key="'v2-' + (navV2.editId ?? 'new')" />
      </template>
      <template v-else-if="iteration === 3">
        <SlaOverviewV3 v-if="navV3.view === 'overview'" />
        <SlaEditorV3 v-else :edit-id="navV3.editId" :key="'v3-' + (navV3.editId ?? 'new')" />
      </template>
      <template v-else>
        <SlaOverviewV4 v-if="navV4.view === 'overview'" />
        <SlaEditorV4 v-else :edit-id="navV4.editId" :key="'v4-' + (navV4.editId ?? 'new')" />
      </template>
    </main>

    <!-- Prototype controls: iteration + (overview-only) view mode -->
    <div class="fixed bottom-4 right-4 z-50 flex items-center gap-2">
      <IterationSwitcher />
      <!-- Custom-fields simulation applies to the custom-field iterations (2, 3, 4) -->
      <CustomFieldsToggle v-if="iteration >= 2" />
      <!-- Also shown while errored, so the state is escapable in the prototype -->
      <ViewModeSwitcher v-if="onOverview || mode === 'error'" />
    </div>

    <!-- SLA analytics preview (opened from the rail's pie-chart icon). The typed
         iterations (3, 4) share the per-type analytics; 1 & 2 keep the
         bundled-model modal. -->
    <SlaAnalyticsModalV3 v-if="iteration >= 3" v-model:open="analyticsOpen" />
    <SlaAnalyticsModal v-else v-model:open="analyticsOpen" />

    <!-- "How SLAs work" explainer reference (opened from the rail Help icon) -->
    <SlaExplainerModal v-model:open="explainerOpen" />
  </div>
</template>
