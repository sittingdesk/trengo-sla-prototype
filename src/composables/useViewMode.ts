// Prototype-only view mode for the overview: lets us demo the Normal, Loading
// and Empty states via the bottom-right switcher. Pure view override — it never
// touches the policy store or localStorage, so seeds stay intact.
import { ref } from 'vue'

export type ViewMode = 'normal' | 'loading' | 'empty'

export const VIEW_MODES: { value: ViewMode; label: string }[] = [
  { value: 'normal', label: 'Normal' },
  { value: 'loading', label: 'Loading' },
  { value: 'empty', label: 'Empty' },
]

const mode = ref<ViewMode>('normal')

export function useViewMode() {
  return { mode }
}
