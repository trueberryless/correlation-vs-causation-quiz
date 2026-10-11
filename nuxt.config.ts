import { SITE_URL } from './shared/constants'

export default defineNuxtConfig({
  app: {
    head: {
      link: [{ href: '/favicon.svg', rel: 'icon', type: 'image/svg+xml' }],
      meta: [
        { content: `${SITE_URL}/og-image.png`, property: 'og:image' },
        { content: '1200', property: 'og:image:width' },
        { content: '630', property: 'og:image:height' },
        { content: 'Correlation vs Causation: Do you know the difference? Take the quiz.', property: 'og:image:alt' },
        { content: 'summary_large_image', name: 'twitter:card' },
      ],
    },
  },
  colorMode: { fallback: 'light', preference: 'system', storageKey: 'color-mode' },
  compatibilityDate: '2026-09-01',
  css: ['~/assets/css/main.css'],
  devtools: { enabled: true },
  i18n: {
    defaultLocale: 'en',
    detectBrowserLanguage: { cookieKey: 'language', fallbackLocale: 'en', useCookie: true },
    locales: [
      { code: 'en', file: 'en.json', language: 'en-US', name: 'English' },
      { code: 'de', file: 'de.json', language: 'de-DE', name: 'Deutsch' },
    ],
    strategy: 'no_prefix',
  },
  modules: ['@nuxt/ui', '@nuxtjs/i18n', '@vueuse/nuxt', '@netlify/nuxt'],
  ui: { fonts: false },
  typescript: {
    nodeTsConfig: { include: ['../vitest.config.ts', '../playwright.config.ts'] },
    tsConfig: { include: ['../test'] },
  },
})
