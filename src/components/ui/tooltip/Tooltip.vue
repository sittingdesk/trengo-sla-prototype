<script setup lang="ts">
// Tooltip — a self-contained styled hover tooltip (reka-ui based).
// Usage: <Tooltip text="Description…"><button>trigger</button></Tooltip>
// Opens on hover AND keyboard focus (the trigger must be focusable).
// Styling per design.md: dark surface, white 12px medium text.
// Copied from the Reporting workspace; dropped animate-in/out classes that
// belong to a Tailwind plugin this project doesn't have.
import {
  TooltipProvider,
  TooltipRoot,
  TooltipTrigger,
  TooltipPortal,
  TooltipContent,
  TooltipArrow,
} from 'reka-ui'

defineProps<{ text?: string }>()
</script>

<template>
  <TooltipProvider :delay-duration="150">
    <TooltipRoot>
      <TooltipTrigger as-child>
        <slot />
      </TooltipTrigger>
      <TooltipPortal>
        <TooltipContent
          :side-offset="6"
          class="z-50 max-w-xs rounded-base bg-grey-800 px-3 py-1.5 text-sm font-semibold text-white shadow-300"
        >
          {{ text }}
          <TooltipArrow class="fill-grey-800" :width="10" :height="5" />
        </TooltipContent>
      </TooltipPortal>
    </TooltipRoot>
  </TooltipProvider>
</template>
