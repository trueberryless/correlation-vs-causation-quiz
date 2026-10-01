<script setup lang="ts">
import { calculateStatistics } from '#shared/statistics'
import type { QuizResult } from '#shared/types'

const { t } = useI18n()
const localePath = useLocalePath()

useSeoMeta({
  description: () => t('globalResults'),
  title: () => `${t('statistics')} | ${t('title')}`,
})

const { data: results, error, status } = await useFetch<QuizResult[]>('/api/get-stats', { default: () => [] })

const localResults = ref<QuizResult[]>([])

onMounted(() => {
  if (error.value) {
    const userId = localStorage.getItem('quizUserId')

    localResults.value = JSON.parse(localStorage.getItem(`quizResults_${userId}`) || '[]')
  }
})

const statistics = computed(() => calculateStatistics(error.value ? localResults.value : results.value))
const maxCount = computed(() => Math.max(...statistics.value.scoreDistribution, 1))
</script>

<template>
  <section class="space-y-8">
    <NuxtLink :to="localePath('/')" class="text-primary underline">{{ t('backToQuiz') }}</NuxtLink>

    <header class="space-y-1">
      <h1 class="text-highlighted text-3xl font-bold">{{ t('statistics') }}</h1>
      <p class="text-muted">{{ t('globalResults') }}</p>
    </header>

    <p v-if="status === 'pending'" role="status">{{ t('loading') }}</p>

    <template v-else-if="statistics.totalAttempts > 0">
      <dl class="grid gap-4 sm:grid-cols-3" data-testid="statistics">
        <div class="border-default rounded-lg border p-4">
          <dt class="text-muted">{{ t('totalAttempts') }}</dt>
          <dd class="text-highlighted text-3xl font-bold">{{ statistics.totalAttempts }}</dd>
        </div>
        <div class="border-default rounded-lg border p-4">
          <dt class="text-muted">{{ t('averageScore') }}</dt>
          <dd class="text-highlighted text-3xl font-bold">{{ statistics.averageScore.toFixed(1) }}%</dd>
        </div>
        <div class="border-default rounded-lg border p-4">
          <dt class="text-muted">{{ t('averageConfidence') }}</dt>
          <dd class="text-highlighted text-3xl font-bold">{{ statistics.averageConfidence.toFixed(1) }}%</dd>
        </div>
      </dl>

      <section aria-labelledby="distribution" class="space-y-3">
        <h2 id="distribution" class="text-highlighted text-xl font-semibold">{{ t('scoreDistribution') }}</h2>
        <table class="w-full">
          <thead class="sr-only">
            <tr>
              <th scope="col">{{ t('correctAnswers') }}</th>
              <th scope="col">{{ t('attempts') }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(count, score) in statistics.scoreDistribution" :key="score">
              <th scope="row" class="w-16 py-1 pr-3 text-left font-medium">{{ score }}/10</th>
              <td class="py-1">
                <div class="bg-elevated h-5 rounded">
                  <div class="bg-primary h-5 rounded" :style="{ width: `${(count / maxCount) * 100}%` }" />
                </div>
              </td>
              <td class="w-24 py-1 pl-3 text-right tabular-nums">
                {{ count }} ({{ ((count / statistics.totalAttempts) * 100).toFixed(1) }}%)
              </td>
            </tr>
          </tbody>
        </table>
      </section>
    </template>

    <div v-else class="border-default space-y-1 rounded-lg border p-6 text-center" data-testid="no-data">
      <p class="text-lg font-semibold">{{ t('noDataYet') }}</p>
      <p class="text-muted">{{ t('beFirst') }}</p>
    </div>
  </section>
</template>
