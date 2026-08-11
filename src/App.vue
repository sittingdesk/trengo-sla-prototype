<script setup lang="ts">
// App.vue — the overall shell that frames every page.
// Layout, left to right: [ RailSidebar (icon rail) ][ SettingsSidebar ][ content ].
// The content area shows the SLA settings views for the active ITERATION:
// iteration 1 and iteration 2 are fully independent copies (own components,
// store, data), chosen via the bottom-right IterationSwitcher. The view-mode
// switcher (Normal/Loading/Empty) is shared and applies to whichever overview.
import { computed, ref } from 'vue'
import { RailSidebar } from '@/components/rail'
import SlaAnalyticsModal from '@/components/analytics/SlaAnalyticsModal.vue'
import SettingsSidebar from '@/components/layout/SettingsSidebar.vue'
import SlaOverview from '@/components/sla/SlaOverview.vue'
import SlaEditor from '@/components/sla/SlaEditor.vue'
import SlaOverviewV2 from '@/components/sla-v2/SlaOverview.vue'
import SlaEditorV2 from '@/components/sla-v2/SlaEditor.vue'
import ViewModeSwitcher from '@/components/sla/ViewModeSwitcher.vue'
import IterationSwitcher from '@/components/sla/IterationSwitcher.vue'
import CustomFieldsToggle from '@/components/sla/CustomFieldsToggle.vue'
import { useSlaNav } from '@/composables/useSlaNav'
import { useSlaNavV2 } from '@/composables/useSlaNavV2'
import { useIteration } from '@/composables/useIteration'

const { iteration } = useIteration()
const { nav } = useSlaNav()
const { nav: navV2 } = useSlaNavV2()

// The rail's pie-chart ("Reports") icon opens the SLA analytics preview modal.
const analyticsOpen = ref(false)

const onOverview = computed(() =>
  iteration.value === 1 ? nav.value.view === 'overview' : navV2.value.view === 'overview',
)
</script>

<template>
  <div class="flex h-full w-full overflow-hidden">
    <RailSidebar active="settings" @select="(k: string) => { if (k === 'reports') analyticsOpen = true }" />
    <SettingsSidebar />

    <!-- Scrollable content area -->
    <main class="scroll-thin flex-1 overflow-y-auto bg-grey-100">
      <template v-if="iteration === 1">
        <SlaOverview v-if="nav.view === 'overview'" />
        <SlaEditor v-else :edit-id="nav.editId" :key="nav.editId ?? 'new'" />
      </template>
      <template v-else>
        <SlaOverviewV2 v-if="navV2.view === 'overview'" />
        <SlaEditorV2 v-else :edit-id="navV2.editId" :key="'v2-' + (navV2.editId ?? 'new')" />
      </template>
    </main>

    <!-- Prototype controls: iteration + (overview-only) view mode -->
    <div class="fixed bottom-4 right-4 z-50 flex items-center gap-2">
      <IterationSwitcher />
      <!-- Custom-fields simulation is only meaningful for Iteration 2 -->
      <CustomFieldsToggle v-if="iteration === 2" />
      <ViewModeSwitcher v-if="onOverview" />
    </div>

    <!-- SLA analytics preview (opened from the rail's pie-chart icon) -->
    <SlaAnalyticsModal v-model:open="analyticsOpen" />
  </div>
</template>
