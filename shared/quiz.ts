import { MAX_CONFIDENCE, MIN_CONFIDENCE, QUESTIONS_PER_TYPE } from './constants'
import { type Random, shuffle } from './random'
import type { Answer, Question, QuizResult } from './types'

export function selectQuestions(questions: readonly Question[], random: Random = Math.random) {
  const causal = shuffle(
    questions.filter(({ is_causal }) => is_causal),
    random,
  ).slice(0, QUESTIONS_PER_TYPE)
  const correlation = shuffle(
    questions.filter(({ is_causal }) => !is_causal),
    random,
  ).slice(0, QUESTIONS_PER_TYPE)

  return shuffle([...causal, ...correlation], random)
}

export function createAnswer(question: Question, isCausal: boolean, confidence: number): Answer {
  return { confidence, correct: isCausal === question.is_causal, questionId: question.id }
}

export function createQuizResult(
  answers: readonly Answer[],
  total: number,
  estimate: number,
  now: Date = new Date(),
): QuizResult {
  const correctCount = answers.filter((answer) => answer.correct).length
  const confidenceSum = answers.reduce((sum, answer) => sum + answer.confidence, 0)

  return {
    answers: answers.map((answer) => ({
      confidence: answer.confidence,
      correct: answer.correct,
      questionId: answer.questionId,
    })),
    avgConfidence: answers.length === 0 ? 0 : confidenceSum / answers.length,
    correct: correctCount,
    estimate,
    percentage: total === 0 ? 0 : (correctCount / total) * 100,
    timestamp: now.toISOString(),
    total,
  }
}

export function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}

export function clampEstimate(value: number, total: number) {
  return clamp(Number.isNaN(value) ? 0 : Math.trunc(value), 0, total)
}

export function clampConfidence(value: number) {
  return clamp(value, MIN_CONFIDENCE, MAX_CONFIDENCE)
}
