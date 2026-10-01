import { describe, expect, test } from 'vitest'

import { shuffle } from '../../shared/random'

describe('shuffle', () => {
  test('returns a new array with the same items', () => {
    const items = [1, 2, 3, 4, 5]
    const shuffled = shuffle(items)

    expect(shuffled).not.toBe(items)
    expect(shuffled.toSorted()).toEqual(items)
  })

  test('does not change the input', () => {
    const items = [1, 2, 3]

    shuffle(items, () => 0)

    expect(items).toEqual([1, 2, 3])
  })

  test('uses the random source', () => {
    expect(shuffle([1, 2, 3], () => 0)).toEqual([2, 3, 1])
  })

  test('handles empty and single item arrays', () => {
    expect(shuffle([])).toEqual([])
    expect(shuffle([1])).toEqual([1])
  })

  test('reaches every permutation of three items', () => {
    let state = 1
    const random = () => {
      state = (state * 1664525 + 1013904223) % 4294967296

      return state / 4294967296
    }
    const permutations = new Set(Array.from({ length: 200 }, () => shuffle([1, 2, 3], random).join('')))

    expect(permutations.size).toBe(6)
  })
})
