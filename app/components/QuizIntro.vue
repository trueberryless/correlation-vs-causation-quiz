<script setup lang="ts">
defineProps<{ attemptsLeft: number }>()
defineEmits<{ start: [] }>()

const { t } = useI18n()
const localePath = useLocalePath()
</script>

<template>
  <section class="space-y-8">
    <header class="space-y-2">
      <h1 class="text-highlighted text-4xl font-bold">{{ t('title') }}</h1>
      <p class="text-muted text-xl">{{ t('subtitle') }}</p>
    </header>

    <section aria-labelledby="difference" class="border-default space-y-4 rounded-lg border p-6">
      <h2 id="difference" class="text-highlighted text-xl font-semibold">{{ t('whatIsTheDifference') }}</h2>
      <p>{{ t('correlationExplanation') }}</p>
      <dl class="grid gap-4 sm:grid-cols-2">
        <div class="bg-elevated rounded-md p-4">
          <dt class="text-highlighted font-semibold">{{ t('correlationTitle') }}</dt>
          <dd class="mt-1 text-sm">{{ t('correlationExample') }}</dd>
        </div>
        <div class="bg-elevated rounded-md p-4">
          <dt class="text-highlighted font-semibold">{{ t('causalityTitle') }}</dt>
          <dd class="mt-1 text-sm">{{ t('causalityExample') }}</dd>
        </div>
      </dl>
    </section>

    <p class="border-default rounded-lg border p-4">{{ t('note') }}</p>

    <div class="flex flex-wrap items-center gap-4">
      <UButton size="xl" :disabled="attemptsLeft <= 0" @click="$emit('start')">{{ t('startQuiz') }}</UButton>
      <p data-testid="attempts-left" class="text-muted">
        {{ attemptsLeft > 0 ? t('attemptsLeft', attemptsLeft) : t('noAttemptsLeft') }}
      </p>
      <NuxtLink :to="localePath('/stats')" class="text-primary underline">{{ t('viewStatistics') }}</NuxtLink>
    </div>
  </section>
</template>
