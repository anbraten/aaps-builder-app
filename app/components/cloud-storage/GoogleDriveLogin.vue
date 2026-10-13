<template>
  <div>
    <a v-if="!store.status?.googleToken" :href="loginUrl" class="btn btn-primary w-full">
      <AppIcon name="google" class="h-5 w-5" />
      <span>{{ $t('connect_to_your_google_drive') }}</span>
    </a>

    <div v-else class="status-ok">
      <AppIcon name="check-circle" class="h-6 w-6 shrink-0" />
      <span>{{ $t('connected_to_your_google_drive') }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
const store = useBuilderStore();
const config = useRuntimeConfig();

const loginUrl = computed(() => {
  const redirectUri = `${config.public.appUrl}/api/google/callback`;
  const scope = 'https://www.googleapis.com/auth/drive.file';

  return `https://accounts.google.com/o/oauth2/v2/auth?client_id=${config.public.googleClientId}&redirect_uri=${redirectUri}&response_type=code&scope=${scope}&access_type=offline&prompt=consent`;
});
</script>
