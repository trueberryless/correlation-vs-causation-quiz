<script setup lang="ts">
const { locale, locales, setLocale, t } = useI18n()

const options = computed(() =>
  locales.value.map((entry) => (typeof entry === 'string' ? { code: entry, name: entry } : entry)),
)
</script>

<template>
  <div role="group" :aria-label="t('switchLanguage')" class="flex gap-1">
    <UButton
      v-for="option in options"
      :key="option.code"
      :lang="option.code"
      :aria-pressed="locale === option.code"
      :variant="locale === option.code ? 'solid' : 'ghost'"
      color="neutral"
      size="sm"
      @click="setLocale(option.code)"
    >
      {{ option.code.toUpperCase() }}
    </UButton>
  </div>
</template>
