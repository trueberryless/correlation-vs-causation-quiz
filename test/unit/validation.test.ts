import { describe, expect, test } from 'vitest'

import { submitResultsSchema } from '../../server/utils/validation'

const result = {
  answers: [{ confidence: 80, correct: true, questionId: 1 }],
  avgConfidence: 80,
  correct: 7,
  estimate: 6,
  percentage: 70,
  timestamp: '2026-06-05T15:17:50.272Z',
  total: 10,
}
const body = { results: [result], userId: 'V1StGXR8_Z5jdHi6B-myT' }

describe('submitResultsSchema', () => {
  test('accepts a valid submission', () => {
    expect(submitResultsSchema.safeParse(body).success).toBe(true)
  })

  test('accepts uuids as user ids', () => {
    expect(submitResultsSchema.safeParse({ ...body, userId: crypto.randomUUID() }).success).toBe(true)
  })

  test.each([
    '',
    'short',
    '../../src/pages/index',
    'a/b/c/d/e/f/g/h',
    'with space in it',
    'x'.repeat(41),
    'results/abcdefghijk',
  ])('rejects the user id %j', (userId) => {
    expect(submitResultsSchema.safeParse({ ...body, userId }).success).toBe(false)
  })

  test.each([
    ['no results', { ...body, results: [] }],
    ['more than one result', { ...body, results: [result, result] }],
    ['a missing user id', { results: [result] }],
    ['a score above the total', { ...body, results: [{ ...result, correct: 11 }] }],
    ['a negative score', { ...body, results: [{ ...result, correct: -1 }] }],
    [
      'a confidence below 50',
      { ...body, results: [{ ...result, answers: [{ confidence: 10, correct: true, questionId: 1 }] }] },
    ],
    [
      'too many answers',
      { ...body, results: [{ ...result, answers: Array.from({ length: 11 }, () => result.answers[0]) }] },
    ],
    ['an invalid timestamp', { ...body, results: [{ ...result, timestamp: 'yesterday' }] }],
    ['a percentage above 100', { ...body, results: [{ ...result, percentage: 150 }] }],
    ['a non-numeric score', { ...body, results: [{ ...result, correct: '7' }] }],
    ['no body', undefined],
  ])('rejects %s', (_name, input) => {
    expect(submitResultsSchema.safeParse(input).success).toBe(false)
  })
})
