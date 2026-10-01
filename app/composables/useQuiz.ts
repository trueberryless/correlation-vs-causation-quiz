import { MAX_ATTEMPTS, MIN_CONFIDENCE } from '#shared/constants'
import { questions as allQuestions } from '#shared/questions'
import { createAnswer, createQuizResult, selectQuestions } from '#shared/quiz'
import type { Answer, Question, QuizResult } from '#shared/types'

export type QuizStep = 'estimate' | 'intro' | 'quiz' | 'results'

const DEFAULT_ESTIMATE = 5

export function useQuiz() {
  const userId = useLocalStorage('quizUserId', '', { initOnMounted: true })
  const attemptsLeft = useLocalStorage('quizAttempts', MAX_ATTEMPTS, { initOnMounted: true })

  const step = ref<QuizStep>('intro')
  const questions = ref<Question[]>([])
  const currentIndex = ref(0)
  const answers = ref<Answer[]>([])
  const estimate = ref(DEFAULT_ESTIMATE)
  const result = ref<QuizResult>()
  const isSubmitting = ref(false)
  const hasSubmissionFailed = ref(false)

  const currentQuestion = computed(() => questions.value[currentIndex.value])

  function reset() {
    step.value = 'intro'
    questions.value = []
    currentIndex.value = 0
    answers.value = []
    estimate.value = DEFAULT_ESTIMATE
    result.value = undefined
    hasSubmissionFailed.value = false
  }

  function start() {
    if (attemptsLeft.value <= 0) {
      return
    }

    reset()
    questions.value = selectQuestions(allQuestions)
    step.value = 'quiz'
  }

  function answer(isCausal: boolean, confidence = MIN_CONFIDENCE) {
    const question = currentQuestion.value

    if (!question) {
      return
    }

    answers.value = [...answers.value, createAnswer(question, isCausal, confidence)]

    if (currentIndex.value < questions.value.length - 1) {
      currentIndex.value++
    } else {
      step.value = 'estimate'
    }
  }

  function ensureUserId() {
    if (!userId.value) {
      userId.value = crypto.randomUUID()
    }

    return userId.value
  }

  function saveLocally(id: string, quizResult: QuizResult) {
    const key = `quizResults_${id}`

    try {
      const saved = JSON.parse(localStorage.getItem(key) || '[]') as QuizResult[]

      localStorage.setItem(key, JSON.stringify([...saved, quizResult]))
    } catch {
      localStorage.setItem(key, JSON.stringify([quizResult]))
    }
  }

  async function submit() {
    isSubmitting.value = true

    const id = ensureUserId()
    const quizResult = createQuizResult(answers.value, questions.value.length, estimate.value)

    result.value = quizResult
    saveLocally(id, quizResult)
    attemptsLeft.value = Math.max(0, attemptsLeft.value - 1)

    try {
      await $fetch('/api/submit-results', { body: { results: [quizResult], userId: id }, method: 'POST' })
    } catch (error) {
      console.warn('Failed to submit the results:', error)
      hasSubmissionFailed.value = true
    }

    isSubmitting.value = false
    step.value = 'results'
  }

  return {
    answer,
    answers,
    attemptsLeft,
    currentIndex,
    currentQuestion,
    estimate,
    hasSubmissionFailed,
    isSubmitting,
    questions,
    reset,
    result,
    start,
    step,
    submit,
  }
}
