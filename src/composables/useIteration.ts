// Which prototype iteration is on screen. Iteration 2 is a fully independent
// copy of the SLA feature (own components, store, data) so it can diverge from
// Iteration 1 without affecting it. Prototype-only switch (in-memory).
import { ref } from 'vue'

export type Iteration = 1 | 2

const iteration = ref<Iteration>(1)

export function useIteration() {
  return { iteration }
}
