<script setup lang="ts">
// SettingsSidebar — the light secondary nav that sits right of the dark rail
// when the Settings context is active. Grouped, collapsible sections (Channels,
// Automation, Settings); SLA policies is the last item of the Settings group.
//
// Built from shadcn-vue primitives: Collapsible (group headers), Button
// (ghost, per nav item — hover comes from the ghost variant), Badge (the
// muted "Beta" pill). Active state is local prototype state: one item at a time.
import { ref } from 'vue'
import Icon from '@/components/Icon.vue'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { SETTINGS_NAV, type NavItem } from '@/data/settingsNav'

// Which item is highlighted. Defaults to the SLA policies item.
const activeKey = ref('sla-policies')

function select(item: NavItem) {
  activeKey.value = item.key
}
</script>

<template>
  <aside class="flex w-60 shrink-0 flex-col border-r border-grey-300 bg-white">
    <!-- Scrollable grouped nav -->
    <nav class="scroll-thin flex-1 space-y-5 overflow-y-auto px-2 py-4">
      <Collapsible
        v-for="group in SETTINGS_NAV"
        :key="group.key"
        default-open
        class="group/collapsible"
      >
        <!-- Group header — muted uppercase overline -->
        <CollapsibleTrigger
          class="mb-1 flex w-full select-none items-center gap-1.5 px-2.5 py-1 text-xs font-semibold uppercase tracking-wide text-grey-600 transition-colors hover:text-grey-800"
        >
          <Icon
            name="ChevronDown"
            :size="14"
            class="text-grey-400 transition-transform duration-200 group-data-[state=closed]/collapsible:-rotate-90"
          />
          <span>{{ group.label }}</span>
        </CollapsibleTrigger>

        <!-- Group items -->
        <CollapsibleContent class="space-y-0.5">
          <Button
            v-for="item in group.items"
            :key="item.key"
            variant="ghost"
            :class="[
              'h-9 w-full justify-start gap-2.5 px-2.5 text-sm font-medium',
              item.key === activeKey
                ? 'bg-grey-200 font-semibold text-grey-900 hover:bg-grey-200'
                : 'text-grey-700',
            ]"
            @click="select(item)"
          >
            <Icon :name="item.icon" :size="20" />
            <span class="truncate">{{ item.label }}</span>
            <Badge v-if="item.badge" variant="muted" class="ml-auto">{{ item.badge }}</Badge>
          </Button>
        </CollapsibleContent>
      </Collapsible>
    </nav>
  </aside>
</template>
