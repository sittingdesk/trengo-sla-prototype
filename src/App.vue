<script setup lang="ts">
// App.vue — the overall shell that frames every page.
// Layout, left to right: [ RailSidebar (icon rail) ][ SettingsSidebar ][ content ].
// RailSidebar is the portable copy-paste component (see components/rail/README.md).
// The rail is pinned to the Settings context; the content area shows the SLA
// settings views (overview / editor) driven by the useSlaNav composable.
import { RailSidebar } from '@/components/rail'
import SettingsSidebar from '@/components/layout/SettingsSidebar.vue'
import SlaOverview from '@/components/sla/SlaOverview.vue'
import SlaEditor from '@/components/sla/SlaEditor.vue'
import { useSlaNav } from '@/composables/useSlaNav'

const { nav } = useSlaNav()
</script>

<template>
  <div class="flex h-full w-full overflow-hidden">
    <RailSidebar active="settings" />
    <SettingsSidebar />

    <!-- Scrollable content area -->
    <main class="scroll-thin flex-1 overflow-y-auto bg-grey-100">
      <SlaOverview v-if="nav.view === 'overview'" />
      <!-- Keyed so switching policies always starts from a fresh draft -->
      <SlaEditor v-else :edit-id="nav.editId" :key="nav.editId ?? 'new'" />
    </main>
  </div>
</template>
