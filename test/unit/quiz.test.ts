import { describe, expect, test } from 'vitest'

import { QUESTIONS_PER_QUIZ } from '../../shared/constants'
import { questions } from '../../shared/questions'
import {
  clamp,
  clampConfidence,
  clampEstimate,
  createAnswer,
  createQuizResult,
  selectQuestions,
} from '../../shared/quiz'
import type { Question } from '../../shared/types'

function createSeededRandom(seed: number) {
  let state = seed

  return () => {
    state = (state * 1664525 + 1013904223) % 4294967296

    return state / 4294967296
  }
}

function createQuestion(id: number, isCausal: boolean): Question {
  return { explanation: { de: 'e', en: 'e' }, id, is_causal: isCausal, statement: { de: 's', en: 's' } }
}

describe('selectQuestions', () => {
  test.each(Array.from({ length: 50 }, (_, index) => index + 1))(
    'selects five causal and five correlation questions (seed %i)',
    (seed) => {
      const selected = selectQuestions(questions, createSeededRandom(seed))

      expect(selected).toHaveLength(QUESTIONS_PER_QUIZ)
      expect(selected.filter(({ is_causal }) => is_causal)).toHaveLength(5)
      expect(new Set(selected.map(({ id }) => id)).size).toBe(QUESTIONS_PER_QUIZ)
    },
  )

  test('mixes the order of causal and correlation questions', () => {
    const orders = new Set(
      Array.from({ length: 30 }, (_, index) =>
        selectQuestions(questions, createSeededRandom(index + 1))
          .map(({ is_causal }) => (is_causal ? 'c' : 'n'))
          .join(''),
      ),
    )

    expect(orders.size).toBeGreaterThan(5)
  })

  test('selects different questions for different random sources', () => {
    const ids = new Set(
      Array.from({ length: 30 }, (_, index) => selectQuestions(questions, createSeededRandom(index + 1))[0]?.id),
    )

    expect(ids.size).toBeGreaterThan(5)
  })

  test('selects fewer questions when there are not enough', () => {
    expect(selectQuestions([createQuestion(1, true), createQuestion(2, false)])).toHaveLength(2)
  })
})

describe('createAnswer', () => {
  test('marks matching answers as correct', () => {
    expect(createAnswer(createQuestion(7, true), true, 80)).toEqual({ confidence: 80, correct: true, questionId: 7 })
    expect(createAnswer(createQuestion(8, false), false, 60)).toMatchObject({ correct: true })
  })

  test('marks other answers as incorrect', () => {
    expect(createAnswer(createQuestion(7, true), false, 90).correct).toBe(false)
  })
})

describe('createQuizResult', () => {
  const answers = [
    { confidence: 100, correct: true, questionId: 1 },
    { confidence: 60, correct: false, questionId: 2 },
    { confidence: 80, correct: true, questionId: 3 },
    { confidence: 60, correct: true, questionId: 4 },
  ]

  test('summarizes the answers', () => {
    expect(createQuizResult(answers, 4, 3, new Date('2026-01-02T03:04:05.000Z'))).toEqual({
      answers,
      avgConfidence: 75,
      correct: 3,
      estimate: 3,
      percentage: 75,
      timestamp: '2026-01-02T03:04:05.000Z',
      total: 4,
    })
  })

  test('only keeps the fields that are stored', () => {
    const [stored] = createQuizResult([{ ...answers[0]!, answer: true, timestamp: 'x' } as never], 1, 1).answers

    expect(Object.keys(stored!).toSorted()).toEqual(['confidence', 'correct', 'questionId'])
  })

  test('handles quizzes without answers', () => {
    expect(createQuizResult([], 0, 0)).toMatchObject({ avgConfidence: 0, correct: 0, percentage: 0 })
  })
})

describe('clamping', () => {
  test('clamp keeps values inside the range', () => {
    expect(clamp(5, 0, 10)).toBe(5)
    expect(clamp(-1, 0, 10)).toBe(0)
    expect(clamp(11, 0, 10)).toBe(10)
  })

  test.each([
    [5, 10, 5],
    [-3, 10, 0],
    [12, 10, 10],
    [4.9, 10, 4],
    [Number.NaN, 10, 0],
  ])('clampEstimate(%f, %i) is %i', (value, total, expected) => {
    expect(clampEstimate(value, total)).toBe(expected)
  })

  test('clampConfidence stays between 50 and 100', () => {
    expect(clampConfidence(20)).toBe(50)
    expect(clampConfidence(75)).toBe(75)
    expect(clampConfidence(150)).toBe(100)
  })
})
