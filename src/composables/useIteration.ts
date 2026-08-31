// Which prototype iteration is on screen. Each iteration is a fully independent
// copy of the SLA feature (own components, store, data) so it can diverge from
// the others without affecting them. Prototype-only switch (in-memory).
import { ref } from 'vue'

export type Iteration = 1 | 2 | 3

// Opens on the latest iteration — it's the one being reviewed.
const iteration = ref<Iteration>(3)

export function useIteration() {
  return { iteration }
}
