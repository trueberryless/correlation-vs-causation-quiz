export type QuizLocale = 'de' | 'en'

export interface Question {
  explanation: Record<QuizLocale, string>
  id: number
  is_causal: boolean
  source_url?: string
  statement: Record<QuizLocale, string>
}

export interface Answer {
  confidence: number
  correct: boolean
  questionId: number
}

export interface QuizResult {
  answers: Answer[]
  avgConfidence: number
  correct: number
  estimate: number
  percentage: number
  timestamp: string
  total: number
}

export interface QuestionStatistics {
  accuracyRate: number
  avgConfidence: number
  confidenceWeightedDifficulty: number
  correctAttempts: number
  difficultyScore: number
  incorrectAttempts: number
  question: Question
  questionId: number
  totalAttempts: number
}

export interface Statistics {
  averageConfidence: number
  averageScore: number
  scoreDistribution: number[]
  totalAttempts: number
}

export type DifficultyLevel = 'easy' | 'hard' | 'medium' | 'veryHard'

export type QuestionFilter = 'all' | 'causal' | 'correlation'

export type QuestionSort = 'attempts' | 'confidence' | 'difficulty'
