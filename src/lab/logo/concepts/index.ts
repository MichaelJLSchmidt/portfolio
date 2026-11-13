import type { Concept } from '../model'
import { diagonalCut } from './diagonal-cut'
import { diagonalBalanced, diagonalChannel, diagonalFloating } from './diagonal-cut-stemless'
import { twoCards, twoCardsDynamic } from './two-cards'

/** The concepts in the lab, in order. Ids are stable (deep links, stored scores). */
export const concepts: Concept[] = [
  twoCards,
  twoCardsDynamic,
  diagonalCut,
  diagonalFloating,
  diagonalChannel,
  diagonalBalanced,
]

export const conceptById = (id: string | null) => concepts.find((c) => c.id === id) ?? null
