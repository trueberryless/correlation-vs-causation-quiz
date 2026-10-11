<script setup lang="ts">
import { clampEstimate } from '#shared/quiz'

const props = defineProps<{ isSubmitting: boolean; total: number }>()
const estimate = defineModel<number>({ required: true })
defineEmits<{ submit: [] }>()

const { t } = useI18n()

function update(value: number) {
  estimate.value = clampEstimate(value, props.total)
}
</script>

<template>
  <section class="space-y-6" aria-labelledby="estimate-title">
    <h1 id="estimate-title" class="text-highlighted text-2xl font-semibold">
      {{ t('totalEstimateQuestion', { total }) }}
    </h1>

    <div class="flex items-center gap-3">
      <UButton
        color="neutral"
        variant="outline"
        :aria-label="t('decrease')"
        icon="i-lucide-minus"
        @click="update(estimate - 1)"
      />
      <input
        id="estimate"
        type="number"
        inputmode="numeric"
        min="0"
        :max="total"
        :value="estimate"
        :aria-label="t('estimate')"
        class="border-default bg-default w-20 rounded-md border px-3 py-2 text-center text-xl"
        @input="update(Number(($event.target as HTMLInputElement).value))"
      />
      <UButton
        color="neutral"
        variant="outline"
        :aria-label="t('increase')"
        icon="i-lucide-plus"
        @click="update(estimate + 1)"
      />
      <span class="text-muted">{{ t('outOf', { total }) }}</span>
    </div>

    <UButton size="xl" :disabled="isSubmitting" :loading="isSubmitting" @click="$emit('submit')">
      {{ isSubmitting ? t('submitting') : t('submitQuiz') }}
    </UButton>
  </section>
</template>
