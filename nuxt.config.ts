import tailwindcss from '@tailwindcss/vite';
import { sentryVitePlugin } from '@sentry/vite-plugin';

const release = process.env.VERCEL_GIT_COMMIT_SHA ?? 'dev';
const environment = process.env.VERCEL_ENV ?? 'development';

export default defineNuxtConfig({
  devtools: { enabled: true },
  compatibilityDate: '2025-01-19',
  modules: ['@pinia/nuxt', '@nuxtjs/i18n'],
  css: ['@fontsource-variable/nunito', '~/assets/css/tailwind.css'],

  sourcemap: true,

  app: {
    head: {
      title: 'AAPS Builder',
      meta: [
        { name: 'viewport', content: 'width=device-width, initial-scale=1, viewport-fit=cover' },
        { name: 'theme-color', content: '#f5f5f4', media: '(prefers-color-scheme: light)' },
        { name: 'theme-color', content: '#1c1917', media: '(prefers-color-scheme: dark)' },
        { name: 'color-scheme', content: 'light dark' },
      ],
      link: [{ rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' }],
      script: [
        {
          // apply theme before first paint to avoid a flash
          innerHTML:
            "try{var t=localStorage.getItem('theme');if(t==='dark'||(t!=='light'&&matchMedia('(prefers-color-scheme: dark)').matches))document.documentElement.classList.add('dark')}catch(e){}",
        },
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
        environment,
        release,
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
      tailwindcss(),
      sentryVitePlugin({
        url: 'https://bugslide.tiny.ju60.de',
        org: process.env.SENTRY_ORG ?? 'ignored',
        project: process.env.SENTRY_PROJECT ?? 'ignored',
        authToken: process.env.SENTRY_AUTH_TOKEN,
        telemetry: false,
        release: {
          name: release,
        },
      }),
    ],
  },
});
