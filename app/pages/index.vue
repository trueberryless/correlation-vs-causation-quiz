<script setup lang="ts">
const { t } = useI18n()
const quiz = useQuiz()

useSeoMeta({
  description: () => t('seoDescription'),
  ogDescription: () => t('seoDescription'),
  ogTitle: () => t('title'),
  title: () => t('title'),
})
</script>

<template>
  <QuizIntro v-if="quiz.step.value === 'intro'" :attempts-left="quiz.attemptsLeft.value" @start="quiz.start" />
  <QuizQuestion
    v-else-if="quiz.step.value === 'quiz' && quiz.currentQuestion.value"
    :current="quiz.currentIndex.value + 1"
    :question="quiz.currentQuestion.value"
    :total="quiz.questions.value.length"
    @answer="quiz.answer"
  />
  <QuizEstimate
    v-else-if="quiz.step.value === 'estimate'"
    v-model="quiz.estimate.value"
    :is-submitting="quiz.isSubmitting.value"
    :total="quiz.questions.value.length"
    @submit="quiz.submit"
  />
  <QuizResults
    v-else-if="quiz.step.value === 'results' && quiz.result.value"
    :attempts-left="quiz.attemptsLeft.value"
    :has-submission-failed="quiz.hasSubmissionFailed.value"
    :result="quiz.result.value"
    @retry="quiz.reset"
  />
</template>
