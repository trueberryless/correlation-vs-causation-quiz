<script setup lang="ts">
const { t } = useI18n()
const localePath = useLocalePath()
</script>

<template>
  <header class="border-default border-b">
    <div class="mx-auto flex w-full max-w-3xl flex-wrap items-center justify-between gap-3 px-4 py-3">
      <nav :aria-label="t('title')" class="flex items-center gap-4">
        <NuxtLink :to="localePath('/')" class="text-highlighted font-semibold">{{ t('title') }}</NuxtLink>
        <NuxtLink
          :to="localePath('/stats')"
          class="text-muted hover:text-highlighted"
          active-class="text-highlighted underline"
        >
          {{ t('statistics') }}
        </NuxtLink>
        <NuxtLink
          :to="localePath('/difficulty')"
          class="text-muted hover:text-highlighted"
          active-class="text-highlighted underline"
        >
          {{ t('difficulty') }}
        </NuxtLink>
      </nav>
      <div class="flex items-center gap-2">
        <LanguageToggle />
        <UColorModeButton />
      </div>
    </div>
  </header>
</template>
