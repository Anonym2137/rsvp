import tailwindcss from '@tailwindcss/vite'

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  modules: [
    '@nuxt/image',
    'shadcn-nuxt',
    '@nuxtjs/i18n',
  ],

  i18n: {
    langDir: '../locales',
    locales: [
      { code: 'en', name: 'English', file: 'en.json' },
      { code: 'pl', name: 'Polski', file: 'pl.json' },
    ],
    lazy: true,
    defaultLocale: 'en',
    strategy: 'no_prefix',
    detectBrowserLanguage: {
      useCookie: true,
      cookieKey: 'rsvp-locale',
      redirectOn: 'root',
    },
  },

  nitro: {
    rollupConfig: {
      plugins: []
    },
    commonJS: {
      ignoreDynamicRequires: true
    }
  },

  css: ['~/assets/css/main.css'],

  vite: {
    plugins: [tailwindcss()]
  },

  app: {
    head: {
      htmlAttrs: { lang: 'en' },
      title: 'RSVP Reader',
      meta: [
        { name: 'description', content: 'Speed-read any book or article with RSVP Reader\'s sequential word presentation technology.' },
      ],
      link: [
        { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
        { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' },
        { href: 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap', rel: 'stylesheet' },
      ],
    },
  },
})

