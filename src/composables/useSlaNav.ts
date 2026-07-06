// Minimal two-view navigation for the SLA settings area. A full router is
// overkill for one overview + one editor, and module-scope state keeps the
// single-file file:// build trivially working.
import { ref } from 'vue'

export interface SlaNavState {
  view: 'overview' | 'editor'
  /** Policy id in edit mode; null = create mode. */
  editId: string | null
}

const nav = ref<SlaNavState>({ view: 'overview', editId: null })

/** The <main> scroll container keeps its position between views — reset it. */
function resetScroll() {
  document.querySelector('main')?.scrollTo({ top: 0 })
}

function goOverview() {
  nav.value = { view: 'overview', editId: null }
  resetScroll()
}

function goEditor(id: string | null = null) {
  nav.value = { view: 'editor', editId: id }
  resetScroll()
}

export function useSlaNav() {
  return { nav, goOverview, goEditor }
}
