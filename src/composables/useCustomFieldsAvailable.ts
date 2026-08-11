// Prototype-only switch to simulate whether the workspace has any eligible
// (dropdown ticket) custom field — lets us demo Iteration 2's "no custom
// fields" empty state. In-memory; never touches data or real logic.
import { ref } from 'vue'

const customFieldsAvailable = ref(true)

export function useCustomFieldsAvailable() {
  return { customFieldsAvailable }
}
