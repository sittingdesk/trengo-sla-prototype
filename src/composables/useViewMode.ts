// Prototype-only view mode: lets us demo the Normal, Loading, Empty and Error
// states via the bottom-right switcher. Pure view override — it never touches
// the policy store or localStorage, so seeds stay intact.
//
// Normal/Loading/Empty are states of the LIST; Error is a state of the whole
// PAGE (the data never arrived), so App.vue handles it above the iteration
// branches rather than each overview handling it individually.
import { ref } from 'vue'

export type ViewMode = 'normal' | 'loading' | 'empty' | 'error'

export const VIEW_MODES: { value: ViewMode; label: string }[] = [
  { value: 'normal', label: 'Normal' },
  { value: 'loading', label: 'Loading' },
  { value: 'empty', label: 'Empty' },
  { value: 'error', label: 'Error' },
]

const mode = ref<ViewMode>('normal')

export function useViewMode() {
  return { mode }
}
