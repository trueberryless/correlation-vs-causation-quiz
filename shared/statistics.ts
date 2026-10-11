import type {
  DifficultyLevel,
  Question,
  QuestionFilter,
  QuestionSort,
  QuestionStatistics,
  QuizResult,
  Statistics,
} from './types'

const SCORE_BUCKETS = 11

export function calculateStatistics(results: readonly QuizResult[]): Statistics {
  const scoreDistribution = Array.from({ length: SCORE_BUCKETS }, () => 0)

  if (results.length === 0) {
    return { averageConfidence: 0, averageScore: 0, scoreDistribution, totalAttempts: 0 }
  }

  for (const { correct } of results) {
    if (Number.isInteger(correct) && correct >= 0 && correct < SCORE_BUCKETS) {
      scoreDistribution[correct]!++
    }
  }

  return {
    averageConfidence: results.reduce((sum, result) => sum + result.avgConfidence, 0) / results.length,
    averageScore: results.reduce((sum, result) => sum + result.percentage, 0) / results.length,
    scoreDistribution,
    totalAttempts: results.length,
  }
}

function getConfidenceWeightedDifficulty(errorRate: number, attempts: number) {
  const reliability = 1 - Math.exp(-attempts / 10)
  const boost = 1 + Math.log(1 + attempts) / 5

  return errorRate * reliability * boost
}

export function calculateQuestionStatistics(
  results: readonly Pick<QuizResult, 'answers'>[],
  questions: readonly Question[],
): QuestionStatistics[] {
  const questionsById = new Map(questions.map((question) => [question.id, question]))
  const totals = new Map<number, { confidence: number; correct: number; incorrect: number }>()

  for (const { answers } of results) {
    for (const { confidence, correct, questionId } of answers) {
      if (!questionsById.has(questionId)) {
        continue
      }

      const total = totals.get(questionId) ?? { confidence: 0, correct: 0, incorrect: 0 }

      total.confidence += confidence
      total[correct ? 'correct' : 'incorrect']++
      totals.set(questionId, total)
    }
  }

  return [...totals].map(([questionId, { confidence, correct, incorrect }]) => {
    const attempts = correct + incorrect
    const accuracyRate = (correct / attempts) * 100
    const errorRate = 100 - accuracyRate

    return {
      accuracyRate,
      avgConfidence: confidence / attempts,
      confidenceWeightedDifficulty: getConfidenceWeightedDifficulty(errorRate, attempts),
      correctAttempts: correct,
      difficultyScore: errorRate,
      incorrectAttempts: incorrect,
      question: questionsById.get(questionId)!,
      questionId,
      totalAttempts: attempts,
    }
  })
}

export function getDifficultyLevel(score: number): DifficultyLevel {
  if (score >= 60) {
    return 'veryHard'
  }

  if (score >= 40) {
    return 'hard'
  }

  return score >= 20 ? 'medium' : 'easy'
}

export function filterQuestionStatistics(stats: readonly QuestionStatistics[], filter: QuestionFilter) {
  if (filter === 'causal') {
    return stats.filter(({ question }) => question.is_causal)
  }

  return filter === 'correlation' ? stats.filter(({ question }) => !question.is_causal) : [...stats]
}

const SORT_KEYS = {
  attempts: 'totalAttempts',
  confidence: 'avgConfidence',
  difficulty: 'confidenceWeightedDifficulty',
} as const

export function sortQuestionStatistics(stats: readonly QuestionStatistics[], sortBy: QuestionSort) {
  const key = SORT_KEYS[sortBy]

  return stats.toSorted((a, b) => b[key] - a[key])
}
