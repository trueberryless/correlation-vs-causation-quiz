import { z } from 'zod'

import { MAX_CONFIDENCE, MIN_CONFIDENCE, QUESTIONS_PER_QUIZ } from '../../shared/constants'

const answerSchema = z.object({
  confidence: z.number().min(MIN_CONFIDENCE).max(MAX_CONFIDENCE),
  correct: z.boolean(),
  questionId: z.number().int().positive(),
})

const resultSchema = z.object({
  answers: z.array(answerSchema).max(QUESTIONS_PER_QUIZ),
  avgConfidence: z.number().min(0).max(MAX_CONFIDENCE),
  correct: z.number().int().min(0).max(QUESTIONS_PER_QUIZ),
  estimate: z.number().int().min(0).max(QUESTIONS_PER_QUIZ),
  percentage: z.number().min(0).max(100),
  timestamp: z.iso.datetime(),
  total: z.number().int().min(1).max(QUESTIONS_PER_QUIZ),
})

export const submitResultsSchema = z.object({
  results: z.array(resultSchema).min(1).max(1),
  userId: z.string().regex(/^[\w-]{10,40}$/),
})

export type SubmitResults = z.infer<typeof submitResultsSchema>
