<script setup lang="ts">
import type { QuizResult } from '#shared/types'

defineProps<{ attemptsLeft: number; hasSubmissionFailed: boolean; result: QuizResult }>()
defineEmits<{ retry: [] }>()

const { t } = useI18n()
const localePath = useLocalePath()
</script>

<template>
  <section class="space-y-6" aria-labelledby="results-title">
    <h1 id="results-title" class="text-highlighted text-3xl font-bold">{{ t('yourResults') }}</h1>

    <dl class="grid gap-4 sm:grid-cols-3" data-testid="results">
      <div class="border-default rounded-lg border p-4">
        <dt class="text-muted">{{ t('correctAnswers') }}</dt>
        <dd class="text-highlighted text-3xl font-bold">{{ result.percentage.toFixed(1) }}%</dd>
        <dd class="text-muted">{{ result.correct }} / {{ result.total }}</dd>
      </div>
      <div class="border-default rounded-lg border p-4">
        <dt class="text-muted">{{ t('averageConfidence') }}</dt>
        <dd class="text-highlighted text-3xl font-bold">{{ result.avgConfidence.toFixed(1) }}%</dd>
      </div>
      <div class="border-default rounded-lg border p-4">
        <dt class="text-muted">{{ t('yourEstimate') }}</dt>
        <dd class="text-highlighted text-3xl font-bold">{{ result.estimate }}</dd>
        <dd class="text-muted">{{ t('outOf', { total: result.total }) }}</dd>
      </div>
    </dl>

    <div class="space-y-1">
      <p class="font-semibold">{{ t('thankYou') }}</p>
      <p v-if="hasSubmissionFailed" role="status" class="text-muted">{{ t('errorSubmitting') }}</p>
      <p v-else role="status" class="text-muted">{{ t('dataSubmitted') }}</p>
    </div>

    <div class="flex flex-wrap items-center gap-4">
      <UButton v-if="attemptsLeft > 0" size="xl" @click="$emit('retry')">{{
        t('tryAgain', { count: attemptsLeft })
      }}</UButton>
      <NuxtLink :to="localePath('/stats')" class="text-primary underline">{{ t('viewStatistics') }}</NuxtLink>
    </div>
  </section>
</template>
