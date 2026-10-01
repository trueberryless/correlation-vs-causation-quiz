<script setup lang="ts">
import { filterQuestionStatistics, getDifficultyLevel, sortQuestionStatistics } from '#shared/statistics'
import type { QuestionFilter, QuestionSort, QuestionStatistics, QuizLocale } from '#shared/types'

const { locale, t } = useI18n()

useSeoMeta({
  description: () => t('questionDifficultySubtitle'),
  title: () => `${t('questionDifficulty')} | ${t('title')}`,
})

const { data: stats, status } = await useFetch<QuestionStatistics[]>('/api/question-difficulty', {
  default: () => [],
})

const filter = ref<QuestionFilter>('all')
const sortBy = ref<QuestionSort>('difficulty')

const filters: { label: string; value: QuestionFilter }[] = [
  { label: 'all', value: 'all' },
  { label: 'causalOnly', value: 'causal' },
  { label: 'correlationOnly', value: 'correlation' },
]
const sorts: { label: string; value: QuestionSort }[] = [
  { label: 'difficulty', value: 'difficulty' },
  { label: 'attempts', value: 'attempts' },
  { label: 'confidence', value: 'confidence' },
]

const sorted = computed(() => sortQuestionStatistics(filterQuestionStatistics(stats.value, filter.value), sortBy.value))
const causalCount = computed(() => sorted.value.filter(({ question }) => question.is_causal).length)
const totalAttempts = computed(() => sorted.value.reduce((sum, stat) => sum + stat.totalAttempts, 0))
</script>

<template>
  <section class="space-y-8">
    <header class="space-y-1">
      <h1 class="text-highlighted text-3xl font-bold">{{ t('questionDifficulty') }}</h1>
      <p class="text-muted">{{ t('questionDifficultySubtitle') }}</p>
    </header>

    <p v-if="status === 'pending'" role="status">{{ t('loading') }}</p>

    <template v-else>
      <div class="grid gap-4 sm:grid-cols-2">
        <fieldset class="space-y-2">
          <legend class="font-medium">{{ t('filterByType') }}</legend>
          <div class="flex flex-wrap gap-2">
            <UButton
              v-for="option in filters"
              :key="option.value"
              color="neutral"
              :variant="filter === option.value ? 'solid' : 'outline'"
              :aria-pressed="filter === option.value"
              @click="filter = option.value"
            >
              {{ t(option.label) }}
            </UButton>
          </div>
        </fieldset>
        <fieldset class="space-y-2">
          <legend class="font-medium">{{ t('sortBy') }}</legend>
          <div class="flex flex-wrap gap-2">
            <UButton
              v-for="option in sorts"
              :key="option.value"
              color="neutral"
              :variant="sortBy === option.value ? 'solid' : 'outline'"
              :aria-pressed="sortBy === option.value"
              @click="sortBy = option.value"
            >
              {{ t(option.label) }}
            </UButton>
          </div>
        </fieldset>
      </div>

      <dl class="grid grid-cols-2 gap-4 sm:grid-cols-4" data-testid="summary">
        <div>
          <dt class="text-muted">{{ t('totalQuestions') }}</dt>
          <dd class="text-highlighted text-2xl font-bold">{{ sorted.length }}</dd>
        </div>
        <div>
          <dt class="text-muted">{{ t('causal') }}</dt>
          <dd class="text-highlighted text-2xl font-bold">{{ causalCount }}</dd>
        </div>
        <div>
          <dt class="text-muted">{{ t('correlation') }}</dt>
          <dd class="text-highlighted text-2xl font-bold">{{ sorted.length - causalCount }}</dd>
        </div>
        <div>
          <dt class="text-muted">{{ t('totalAttempts') }}</dt>
          <dd class="text-highlighted text-2xl font-bold">{{ totalAttempts }}</dd>
        </div>
      </dl>

      <div
        v-if="sorted.length === 0"
        class="border-default space-y-1 rounded-lg border p-6 text-center"
        data-testid="no-data"
      >
        <p class="text-lg font-semibold">{{ t('noDataYet') }}</p>
        <p class="text-muted">{{ t('completeQuizFirst') }}</p>
      </div>

      <ol v-else class="space-y-4">
        <li v-for="(stat, index) in sorted" :key="stat.questionId">
          <article class="border-default space-y-3 rounded-lg border p-5">
            <div class="flex flex-wrap items-center gap-2 text-sm">
              <span class="font-semibold">#{{ index + 1 }}</span>
              <UBadge color="neutral" variant="outline">{{
                stat.question.is_causal ? t('causal') : t('correlation')
              }}</UBadge>
              <UBadge color="neutral" variant="subtle">{{
                t(getDifficultyLevel(stat.confidenceWeightedDifficulty))
              }}</UBadge>
              <span class="text-muted">ID: {{ stat.questionId }}</span>
            </div>
            <h2 class="text-highlighted text-lg font-semibold">{{ stat.question.statement[locale as QuizLocale] }}</h2>
            <p class="text-muted">{{ stat.question.explanation[locale as QuizLocale] }}</p>
            <a
              v-if="stat.question.source_url"
              :href="stat.question.source_url"
              target="_blank"
              rel="noopener noreferrer"
              class="text-primary underline"
            >
              {{ t('viewSource') }}<span class="sr-only"> ({{ t('opensInNewTab') }})</span>
            </a>
            <dl class="grid grid-cols-2 gap-3 text-sm sm:grid-cols-5">
              <div>
                <dt class="text-muted">{{ t('difficulty') }}</dt>
                <dd class="font-semibold">{{ stat.confidenceWeightedDifficulty.toFixed(1) }}</dd>
              </div>
              <div>
                <dt class="text-muted">{{ t('errorRate') }}</dt>
                <dd class="font-semibold">{{ stat.difficultyScore.toFixed(1) }}%</dd>
              </div>
              <div>
                <dt class="text-muted">{{ t('accuracy') }}</dt>
                <dd class="font-semibold">{{ stat.accuracyRate.toFixed(1) }}%</dd>
              </div>
              <div>
                <dt class="text-muted">{{ t('attempts') }}</dt>
                <dd class="font-semibold">{{ stat.totalAttempts }}</dd>
              </div>
              <div>
                <dt class="text-muted">{{ t('avgConfidence') }}</dt>
                <dd class="font-semibold">{{ stat.avgConfidence.toFixed(1) }}%</dd>
              </div>
            </dl>
            <p class="text-muted text-sm">
              {{ stat.correctAttempts }} {{ t('correct') }}, {{ stat.incorrectAttempts }} {{ t('incorrect') }}
            </p>
          </article>
        </li>
      </ol>
    </template>
  </section>
</template>
