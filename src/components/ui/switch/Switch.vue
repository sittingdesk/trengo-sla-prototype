<script setup lang="ts">
// shadcn-vue Switch — hand-written reka-ui wrapper (the shadcn-vue CLI is
// broken in this workspace; same approach as ui/collapsible).
// 36×22 pill per the Figma control spec: Leaf-500 on, Grey-400 off, 18px knob.
import type { HTMLAttributes } from 'vue'
import {
  SwitchRoot,
  SwitchThumb,
  type SwitchRootEmits,
  type SwitchRootProps,
  useForwardPropsEmits,
} from 'reka-ui'
import { computed } from 'vue'
import { cn } from '@/lib/utils'

const props = defineProps<SwitchRootProps & { class?: HTMLAttributes['class'] }>()
const emits = defineEmits<SwitchRootEmits>()

const delegated = computed(() => {
  const { class: _, ...rest } = props
  return rest
})
const forwarded = useForwardPropsEmits(delegated, emits)
</script>

<template>
  <SwitchRoot
    data-slot="switch"
    v-bind="forwarded"
    :class="
      cn(
        'inline-flex h-[22px] w-[36px] shrink-0 cursor-pointer items-center rounded-pill transition-colors focus-visible:outline-none focus-visible:shadow-focus-sm disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-leaf-500 data-[state=unchecked]:bg-grey-400',
        props.class,
      )
    "
  >
    <SwitchThumb
      class="pointer-events-none block size-[18px] rounded-circle bg-white shadow-100 transition-transform data-[state=checked]:translate-x-[16px] data-[state=unchecked]:translate-x-[2px]"
    />
  </SwitchRoot>
</template>
