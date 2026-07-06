<script setup lang="ts">
// shadcn-vue Collapsible — thin wrapper over reka-ui's CollapsibleRoot.
// Matches the component the shadcn-vue CLI generates; forwards all props so
// v-model:open, defaultOpen, disabled etc. work as usual.
import { CollapsibleRoot, type CollapsibleRootProps, useForwardPropsEmits } from 'reka-ui'
import type { CollapsibleRootEmits } from 'reka-ui'

const props = defineProps<CollapsibleRootProps>()
const emits = defineEmits<CollapsibleRootEmits>()

const forwarded = useForwardPropsEmits(props, emits)
</script>

<template>
  <CollapsibleRoot data-slot="collapsible" v-bind="forwarded">
    <slot />
  </CollapsibleRoot>
</template>
