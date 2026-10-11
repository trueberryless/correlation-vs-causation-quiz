<script setup lang="ts">
import { SITE_URL } from '#shared/constants'

const { t } = useI18n()
const head = useLocaleHead()

const route = useRoute()

useHead({
  htmlAttrs: { lang: () => head.value.htmlAttrs?.lang },
  link: () => [...(head.value.link ?? []), { href: new URL(route.path, SITE_URL).href, rel: 'canonical' }],
})
</script>

<template>
  <UApp>
    <a
      href="#content"
      class="focus:bg-default sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:rounded focus:p-2"
    >
      {{ t('skipToContent') }}
    </a>
    <AppHeader />
    <main id="content" class="mx-auto w-full max-w-3xl px-4 py-10">
      <NuxtPage />
    </main>
  </UApp>
</template>
