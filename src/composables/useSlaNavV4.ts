// Minimal two-view navigation for the SLA settings area (Iteration 4). A full
// router is overkill for one overview + one editor. `createType` carries the
// chosen SLA type through the type-first creation flow (picker → editor).
import { ref } from 'vue'
import type { SlaType } from '@/data/slaDataV4'

export interface SlaNavState {
  view: 'overview' | 'editor'
  /** SLA id in edit mode; null = create mode. */
  editId: string | null
  /** In create mode, the type chosen in the picker; null when editing. */
  createType: SlaType | null
}

const nav = ref<SlaNavState>({ view: 'overview', editId: null, createType: null })

/** The <main> scroll container keeps its position between views — reset it. */
function resetScroll() {
  document.querySelector('main')?.scrollTo({ top: 0 })
}

function goOverview() {
  nav.value = { view: 'overview', editId: null, createType: null }
  resetScroll()
}

/** Edit an existing SLA (type comes from the SLA itself). */
function goEditor(id: string) {
  nav.value = { view: 'editor', editId: id, createType: null }
  resetScroll()
}

/** Create a new SLA of the chosen type (type-first flow, from the picker). */
function goCreate(type: SlaType) {
  nav.value = { view: 'editor', editId: null, createType: type }
  resetScroll()
}

export function useSlaNavV4() {
  return { nav, goOverview, goEditor, goCreate }
}
