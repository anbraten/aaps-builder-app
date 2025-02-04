export default defineNuxtConfig({
  devtools: { enabled: true },

  app: {
    head: {
      title: 'AAPS Builder',
      link: [{ rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' }],
    },
  },

  modules: ['@nuxtjs/tailwindcss', '@pinia/nuxt'],

  runtimeConfig: {
    githubClientSecret: process.env.GITHUB_CLIENT_SECRET,
    googleClientSecret: process.env.GOOGLE_CLIENT_SECRET,
    dropboxClientSecret: process.env.DROPBOX_CLIENT_SECRET,
    public: {
      appUrl: process.env.APP_URL || 'http://localhost:3000',
      githubClientId: process.env.GITHUB_CLIENT_ID,
      googleClientId: process.env.GOOGLE_CLIENT_ID,
      dropboxClientId: process.env.DROPBOX_CLIENT_ID,
    },
  },

  compatibilityDate: '2025-01-19',
});
