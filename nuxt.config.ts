import { sentryVitePlugin } from '@sentry/vite-plugin';

export default defineNuxtConfig({
  devtools: { enabled: true },
  compatibilityDate: '2025-01-19',
  modules: ['@nuxtjs/tailwindcss', '@pinia/nuxt', '@nuxtjs/i18n'],

  sourcemap: true,

  app: {
    head: {
      title: 'AAPS Builder',
      link: [{ rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' }],
      script: [
        {
          src: 'https://boomerang.ju60.de/main.js',
          defer: true,
          async: true,
          'data-website-id': '80133bac-4a15-4e39-96cf-fa3edfff3c3c',
          'data-domains': 'aaps-builder.vercel.app',
        },
      ],
    },
  },

  runtimeConfig: {
    githubClientSecret: process.env.GITHUB_CLIENT_SECRET,
    googleClientSecret: process.env.GOOGLE_CLIENT_SECRET,
    dropboxClientSecret: process.env.DROPBOX_CLIENT_SECRET,
    public: {
      appUrl: process.env.APP_URL || 'http://localhost:3000',
      githubClientId: process.env.GITHUB_CLIENT_ID,
      googleClientId: process.env.GOOGLE_CLIENT_ID,
      dropboxClientId: process.env.DROPBOX_CLIENT_ID,
      sentry: {
        dsn: 'https://89bYrjUVCORXM7a55TCqUHbJkCVFOiwX@bugslide.vercel.app/6',
        environment: 'development',
      },
    },
  },

  i18n: {
    strategy: 'no_prefix',
    defaultLocale: 'en',
    locales: [
      { code: 'en', file: 'en.json' },
      { code: 'de', file: 'de.json' },
    ],

    // detectBrowserLanguage: {
    //   useCookie: true,
    //   cookieKey: 'i18n_redirected',
    //   redirectOn: 'root', // recommended
    // },
  },

  vite: {
    plugins: [
      sentryVitePlugin({
        url: 'https://bugslide.vercel.app',
        org: process.env.SENTRY_ORG ?? 'ignored',
        project: process.env.SENTRY_PROJECT ?? 'ignored',
        authToken: process.env.SENTRY_AUTH_TOKEN,
        telemetry: false,
        release: {
          name: process.env.VERCEL_GIT_COMMIT_SHA ?? '1.2.3',
        },
      }),
    ],
  },
});
