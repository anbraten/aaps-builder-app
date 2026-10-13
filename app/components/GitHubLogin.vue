<template>
  <div class="space-y-4">
    <p class="text-muted">{{ $t('first_lets_connect_your_github') }}</p>

    <p v-if="!store.status?.githubToken && authError" class="alert alert-warning">
      {{ $t('github_login_failed') }}
    </p>

    <a v-if="!store.status?.githubToken" :href="loginUrl" class="btn btn-dark w-full">
      <AppIcon name="github" class="h-5 w-5" />
      <span>{{ $t('connect_with_github') }}</span>
    </a>
    <div v-else class="status-ok">
      <AppIcon name="check-circle" class="h-6 w-6 shrink-0" />
      <span>{{ $t('connected_to_github') }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
const config = useRuntimeConfig();
const store = useBuilderStore();
const route = useRoute();
const authError = computed(() => route.query.auth_error === 'github');

defineEmits<{
  (event: 'continue'): void;
}>();

const loginUrl = computed(() => {
  if (!import.meta.client) {
    return '';
  }

  const REDIRECT_URI = `${window.location.origin}/api/github/callback`;
  const scope = 'repo workflow';
  return `https://github.com/login/oauth/authorize?client_id=${config.public.githubClientId}&redirect_uri=${REDIRECT_URI}&scope=${scope}`;
});
</script>
