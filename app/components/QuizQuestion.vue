<script setup lang="ts">
import { MAX_CONFIDENCE, MIN_CONFIDENCE } from '#shared/constants'
import type { Question, QuizLocale } from '#shared/types'

const props = defineProps<{ current: number; question: Question; total: number }>()
const emit = defineEmits<{ answer: [isCausal: boolean, confidence: number] }>()

const { locale, t } = useI18n()

const confidence = ref(MIN_CONFIDENCE)
const hasAdjusted = ref(false)
const showHint = ref(false)

watch(
  () => props.question.id,
  () => {
    confidence.value = MIN_CONFIDENCE
    hasAdjusted.value = false
    showHint.value = false
  },
)

function onInput() {
  hasAdjusted.value = true
  showHint.value = false
}

function answer(isCausal: boolean) {
  if (!hasAdjusted.value) {
    showHint.value = true

    return
  }

  emit('answer', isCausal, confidence.value)
}
</script>

<template>
  <section class="space-y-6" aria-labelledby="statement">
    <div class="space-y-2">
      <p class="text-muted" data-testid="progress">{{ t('questionProgress', { current, total }) }}</p>
      <progress
        class="h-2 w-full"
        :value="current"
        :max="total"
        :aria-label="t('questionProgress', { current, total })"
      />
    </div>

    <h1 id="statement" class="text-highlighted text-2xl font-semibold" data-testid="statement">
      {{ question.statement[locale as QuizLocale] }}
    </h1>

    <div class="border-default space-y-2 rounded-lg border p-4">
      <label for="confidence" class="block font-medium">{{ t('confidenceQuestion') }}</label>
      <input
        id="confidence"
        v-model.number="confidence"
        type="range"
        :min="MIN_CONFIDENCE"
        :max="MAX_CONFIDENCE"
        class="accent-primary w-full"
        :aria-describedby="hasAdjusted ? undefined : 'confidence-hint'"
        @input="onInput"
      />
      <p class="text-highlighted text-2xl font-semibold" aria-live="polite">{{ confidence }}%</p>
      <p v-if="!hasAdjusted" id="confidence-hint" class="text-muted text-sm">{{ t('adjustSliderFirst') }}</p>
    </div>

    <p v-if="showHint" role="alert" class="border-error text-error rounded-md border p-3">
      {{ t('pleaseAdjustSlider') }}
    </p>

    <div class="grid gap-3 sm:grid-cols-2">
      <UButton
        size="xl"
        color="neutral"
        variant="outline"
        class="flex-col items-start"
        data-testid="answer-causal"
        @click="answer(true)"
      >
        <span class="font-semibold">{{ t('causalRelationship') }}</span>
        <span class="text-muted text-sm font-normal">{{ t('trueStatement') }}</span>
      </UButton>
      <UButton
        size="xl"
        color="neutral"
        variant="outline"
        class="flex-col items-start"
        data-testid="answer-correlation"
        @click="answer(false)"
      >
        <span class="font-semibold">{{ t('justCorrelation') }}</span>
        <span class="text-muted text-sm font-normal">{{ t('falseStatement') }}</span>
      </UButton>
    </div>
  </section>
</template>
