<template>
  <div>
    <a
      v-if="!authStore.status?.dropboxToken"
      :href="loginUrl"
      class="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2"
    >
      <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24">
        <path
          fill="currentColor"
          d="m3 6.2l5 3.19l5-3.19L8 3zm10 0l5 3.19l5-3.19L18 3zM3 12.55l5 3.19l5-3.19l-5-3.2zm15-3.2l-5 3.2l5 3.19l5-3.19zM8.03 16.8l5.01 3.2l5-3.2l-5-3.19z"
        />
      </svg>
      <span>{{ $t('connect_to_your_dropbox') }}</span>
    </a>

    <template v-else>
      <div class="flex items-center justify-center space-x-2 text-green-600">
        <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24">
          <path
            fill="currentColor"
            d="m3 6.2l5 3.19l5-3.19L8 3zm10 0l5 3.19l5-3.19L18 3zM3 12.55l5 3.19l5-3.19l-5-3.2zm15-3.2l-5 3.2l5 3.19l5-3.19zM8.03 16.8l5.01 3.2l5-3.2l-5-3.19z"
          />
        </svg>
        <span>{{ $t('connected_to_your_dropbox') }}</span>
      </div>
    </template>
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
