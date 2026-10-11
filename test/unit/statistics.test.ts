import { describe, expect, test } from 'vitest'

import {
  calculateQuestionStatistics,
  calculateStatistics,
  filterQuestionStatistics,
  getDifficultyLevel,
  sortQuestionStatistics,
} from '../../shared/statistics'
import type { Question, QuestionStatistics, QuizResult } from '../../shared/types'

function createResult(result: Partial<QuizResult> = {}): QuizResult {
  return {
    answers: [],
    avgConfidence: 80,
    correct: 7,
    estimate: 6,
    percentage: 70,
    timestamp: '2026-01-01T00:00:00.000Z',
    total: 10,
    ...result,
  }
}

function createQuestion(id: number, isCausal: boolean): Question {
  return { explanation: { de: 'e', en: 'e' }, id, is_causal: isCausal, statement: { de: 's', en: 's' } }
}

describe('calculateStatistics', () => {
  test('returns zeros without results', () => {
    expect(calculateStatistics([])).toEqual({
      averageConfidence: 0,
      averageScore: 0,
      scoreDistribution: Array.from({ length: 11 }, () => 0),
      totalAttempts: 0,
    })
  })

  test('averages the results and counts the scores', () => {
    const statistics = calculateStatistics([
      createResult({ avgConfidence: 60, correct: 10, percentage: 100 }),
      createResult({ avgConfidence: 80, correct: 5, percentage: 50 }),
      createResult({ avgConfidence: 100, correct: 5, percentage: 60 }),
    ])

    expect(statistics.totalAttempts).toBe(3)
    expect(statistics.averageConfidence).toBe(80)
    expect(statistics.averageScore).toBeCloseTo(70)
    expect(statistics.scoreDistribution[5]).toBe(2)
    expect(statistics.scoreDistribution[10]).toBe(1)
  })

  test('ignores scores outside of the distribution', () => {
    const { scoreDistribution } = calculateStatistics([
      createResult({ correct: 11 }),
      createResult({ correct: -1 }),
      createResult({ correct: 2.5 }),
    ])

    expect(scoreDistribution.reduce((sum, count) => sum + count, 0)).toBe(0)
  })
})

describe('calculateQuestionStatistics', () => {
  const questions = [createQuestion(1, true), createQuestion(2, false), createQuestion(3, true)]

  test('aggregates the answers per question', () => {
    const stats = calculateQuestionStatistics(
      [
        {
          answers: [
            { confidence: 100, correct: true, questionId: 1 },
            { confidence: 50, correct: false, questionId: 2 },
          ],
        },
        {
          answers: [
            { confidence: 60, correct: false, questionId: 1 },
            { confidence: 70, correct: false, questionId: 2 },
          ],
        },
      ],
      questions,
    )

    expect(stats.map(({ questionId }) => questionId).toSorted()).toEqual([1, 2])
    expect(stats.find(({ questionId }) => questionId === 1)).toMatchObject({
      accuracyRate: 50,
      avgConfidence: 80,
      correctAttempts: 1,
      difficultyScore: 50,
      incorrectAttempts: 1,
      totalAttempts: 2,
    })
    expect(stats.find(({ questionId }) => questionId === 2)).toMatchObject({ accuracyRate: 0, difficultyScore: 100 })
  })

  test('ignores answers to questions that no longer exist', () => {
    expect(
      calculateQuestionStatistics([{ answers: [{ confidence: 90, correct: true, questionId: 99 }] }], questions),
    ).toEqual([])
  })

  test('skips questions without answers', () => {
    expect(calculateQuestionStatistics([], questions)).toEqual([])
  })

  test('trusts questions with more attempts more', () => {
    const answer = (questionId: number) => ({ confidence: 80, correct: false, questionId })
    const stats = calculateQuestionStatistics(
      [{ answers: [answer(1), answer(2)] }, { answers: [answer(1)] }, { answers: [answer(1)] }],
      questions,
    )
    const [many, few] = [
      stats.find(({ questionId }) => questionId === 1)!,
      stats.find(({ questionId }) => questionId === 2)!,
    ]

    expect(many.difficultyScore).toBe(few.difficultyScore)
    expect(many.confidenceWeightedDifficulty).toBeGreaterThan(few.confidenceWeightedDifficulty)
  })
})

describe('getDifficultyLevel', () => {
  test.each([
    [0, 'easy'],
    [19.9, 'easy'],
    [20, 'medium'],
    [39.9, 'medium'],
    [40, 'hard'],
    [59.9, 'hard'],
    [60, 'veryHard'],
    [100, 'veryHard'],
  ])('%f is %s', (score, expected) => {
    expect(getDifficultyLevel(score)).toBe(expected)
  })
})

describe('filtering and sorting', () => {
  const stat = (id: number, isCausal: boolean, values: Partial<QuestionStatistics>): QuestionStatistics => ({
    accuracyRate: 0,
    avgConfidence: 0,
    confidenceWeightedDifficulty: 0,
    correctAttempts: 0,
    difficultyScore: 0,
    incorrectAttempts: 0,
    question: createQuestion(id, isCausal),
    questionId: id,
    totalAttempts: 0,
    ...values,
  })
  const stats = [
    stat(1, true, { avgConfidence: 60, confidenceWeightedDifficulty: 10, totalAttempts: 5 }),
    stat(2, false, { avgConfidence: 90, confidenceWeightedDifficulty: 50, totalAttempts: 3 }),
    stat(3, true, { avgConfidence: 70, confidenceWeightedDifficulty: 30, totalAttempts: 9 }),
  ]

  test('filters by type', () => {
    expect(filterQuestionStatistics(stats, 'all')).toHaveLength(3)
    expect(filterQuestionStatistics(stats, 'causal').map(({ questionId }) => questionId)).toEqual([1, 3])
    expect(filterQuestionStatistics(stats, 'correlation').map(({ questionId }) => questionId)).toEqual([2])
  })

  test.each([
    ['difficulty', [2, 3, 1]],
    ['attempts', [3, 1, 2]],
    ['confidence', [2, 3, 1]],
  ] as const)('sorts by %s', (sortBy, expected) => {
    expect(sortQuestionStatistics(stats, sortBy).map(({ questionId }) => questionId)).toEqual(expected)
  })

  test('does not change the input', () => {
    const copy = [...stats]

    sortQuestionStatistics(stats, 'attempts')

    expect(stats).toEqual(copy)
  })
})
