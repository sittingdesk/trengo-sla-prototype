<script setup lang="ts">
// PageErrorState — the whole settings page failed to load (API error, 5xx,
// dropped connection). Replaces the ENTIRE content area, page header included.
//
// Dropping the header (and with it "New SLA") is deliberate, not tidiness: this
// feature validates per-channel exclusivity against the SLAs currently loaded
// (`channelConflicts`). If the list never arrived that check passes vacuously,
// so creating here could silently double-claim a channel that already has an
// SLA the user can't see. A page that failed to load must not invite writes.
//
// Shared across all iterations — a transport failure isn't iteration-specific.
// Rail + settings sidebar stay, so the user keeps their orientation.
import Icon from '@/components/Icon.vue'
import { Button } from '@/components/ui/button'
import { useViewMode } from '@/composables/useViewMode'
import { PAGE_ERROR } from '@/data/pageError'

const { mode } = useViewMode()

/** Prototype retry: there's no request to re-issue, so replay the sequence a
 * real one would — a loading pass, then the loaded page. Reviewers ask "what
 * does Try again do?", and this answers it honestly rather than snapping back. */
function retry() {
  mode.value = 'loading'
  setTimeout(() => (mode.value = 'normal'), 900)
}
</script>

<template>
  <div class="mx-auto flex w-full max-w-[868px] flex-col items-center px-6 py-24 text-center">
    <!-- Error-toned, so this never reads as the empty state. The two are easy to
         confuse and mean opposite things: one invites creating, this forbids it. -->
    <div class="flex size-12 items-center justify-center rounded-lg bg-error-bg text-error-500">
      <Icon name="CloudCross" :size="24" />
    </div>

    <h1 class="mt-4 text-base font-semibold text-grey-900">{{ PAGE_ERROR.title }}</h1>
    <p class="mt-2 max-w-[440px] text-sm font-medium text-grey-700">{{ PAGE_ERROR.body }}</p>

    <Button class="mt-6" @click="retry">
      <Icon name="RefreshCw" :size="16" />
      {{ PAGE_ERROR.action }}
    </Button>

    <p class="mt-10 text-xs text-grey-600">{{ PAGE_ERROR.supportHint }}</p>
    <span
      class="mt-1.5 rounded-base bg-grey-200 px-2 py-1 text-xs font-medium tabular-nums text-grey-700"
    >
      {{ PAGE_ERROR.reference }}
    </span>
  </div>
</template>
