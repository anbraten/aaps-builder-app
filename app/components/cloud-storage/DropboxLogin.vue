<template>
  <div>
    <a v-if="!authStore.status?.dropboxToken" :href="loginUrl" class="btn btn-primary w-full">
      <AppIcon name="dropbox" class="h-5 w-5" />
      <span>{{ $t('connect_to_your_dropbox') }}</span>
    </a>

    <div v-else class="status-ok">
      <AppIcon name="check-circle" class="h-6 w-6 shrink-0" />
      <span>{{ $t('connected_to_your_dropbox') }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
const authStore = useBuilderStore();
const config = useRuntimeConfig();

const loginUrl = computed(() => {
  const redirectUri = `${config.public.appUrl}/api/dropbox/callback`;
  const scope = 'account_info.read files.content.write';

  return `https://www.dropbox.com/oauth2/authorize?client_id=${config.public.dropboxClientId}&redirect_uri=${redirectUri}&response_type=code&scope=${scope}`;
});
</script>
