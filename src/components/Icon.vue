<script setup lang="ts">
/**
 * Icon — loads SVGs from the project's existing icon folder (CLAUDE.md).
 *
 * Source: svg icons/linear/*  (outline, stroke=currentColor)
 *
 * Names are fuzzy-matched: case-insensitive, ignoring separators and the
 * decorations 'icon' / 'outline'. Colour comes from the surrounding text colour
 * (currentColor) — set it with a text-* utility. Render sizes per design.md §8:
 * 16 / 20 / 32.
 */
import { computed } from 'vue'

const props = withDefaults(
  defineProps<{
    name: string
    size?: number
  }>(),
  { size: 20 },
)

// Eagerly inline icons as raw SVG strings. NOTE (flagged): this inlines the
// whole linear set, not just what's used — fine for a single-file prototype,
// but an engineer should switch to on-demand loading for production.
const linear = import.meta.glob('../../svg icons/linear/*.svg', {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>

/** Strip decorations + non-alphanumerics for fuzzy matching. */
function normalize(raw: string): string {
  return raw
    .toLowerCase()
    .replace(/\.svg$/, '')
    .replace(/icon|outline/g, '')
    .replace(/[^a-z0-9]/g, '')
}

const map: Record<string, string> = {}
for (const [path, svg] of Object.entries(linear)) {
  const file = path.split('/').pop() ?? ''
  const key = normalize(file)
  if (key) map[key] = svg
}

const svg = computed(() => {
  const found = map[normalize(props.name)]
  if (!found && import.meta.env.DEV) {
    // eslint-disable-next-line no-console
    console.warn(`[Icon] no match for "${props.name}"`)
  }
  return found ?? ''
})
</script>

<template>
  <span
    class="icon-host inline-flex shrink-0 items-center justify-center"
    :style="{ width: `${size}px`, height: `${size}px` }"
    v-html="svg"
  />
</template>

<style scoped>
.icon-host :deep(svg) {
  width: 100%;
  height: 100%;
  display: block;
}
</style>
