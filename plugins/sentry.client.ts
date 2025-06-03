import * as Sentry from '@sentry/vue';

export default defineNuxtPlugin((nuxtApp) => {
  const router = useRouter();
  const {
    public: { sentry },
  } = useRuntimeConfig();

  if (!sentry.dsn) {
    return;
  }

  Sentry.init({
    app: nuxtApp.vueApp,
    dsn: sentry.dsn,
    environment: sentry.environment,
    integrations: [
      Sentry.browserTracingIntegration({ router }),
      Sentry.captureConsoleIntegration({
        levels: ['error'],
      }),
    ],
  });
});
