export default defineNuxtConfig({
  devtools: { enabled: true },

  modules: [
    '@nuxtjs/tailwindcss',
    '@pinia/nuxt',
  ],

  runtimeConfig: {
    githubClientSecret: process.env.GITHUB_CLIENT_SECRET,
    googleClientSecret: process.env.GOOGLE_CLIENT_SECRET,
    public: {
      appUrl: process.env.APP_URL || 'http://localhost:3000',
      githubClientId: process.env.GITHUB_CLIENT_ID,
      googleClientId: process.env.GOOGLE_CLIENT_ID
    }
  },

  compatibilityDate: '2025-01-19'
})