<script setup lang="ts">
// shadcn-vue CollapsibleContent — wraps reka-ui's CollapsibleContent.
import { CollapsibleContent, type CollapsibleContentProps, useForwardProps } from 'reka-ui'

const props = defineProps<CollapsibleContentProps>()

const forwarded = useForwardProps(props)
</script>

<template>
  <CollapsibleContent data-slot="collapsible-content" v-bind="forwarded">
    <slot />
  </CollapsibleContent>
</template>
