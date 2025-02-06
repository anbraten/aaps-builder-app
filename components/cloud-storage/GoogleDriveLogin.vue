<template>
  <div>
    <template v-if="!store.status?.googleToken">
      <!-- <p class="p-3 rounded-lg bg-orange-100 text-orange-700 mb-4">
        The Google Drive integration is still in development and therefore not verified. This is expected! Please sent
        your Google email address to Anton to be able to use it.
      </p> -->

      <a
        :href="loginUrl"
        class="w-full bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors flex items-center justify-center space-x-2"
      >
        <svg class="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
          <path
            d="M12 0C5.372 0 0 5.373 0 12s5.372 12 12 12c6.627 0 12-5.373 12-12S18.627 0 12 0zm.14 19.018c-3.868 0-7-3.14-7-7.018c0-3.878 3.132-7.018 7-7.018c1.89 0 3.47.697 4.682 1.829l-1.974 1.978v-.004c-.735-.702-1.667-1.062-2.708-1.062c-2.31 0-4.187 1.956-4.187 4.273c0 2.315 1.877 4.277 4.187 4.277c2.096 0 3.522-1.202 3.816-2.852H12.14v-2.737h6.585c.088.47.135.96.135 1.474c0 4.01-2.677 6.86-6.72 6.86z"
          />
        </svg>
        <span>Connect to Google Drive</span>
      </a>
    </template>

    <template v-else>
      <div class="flex items-center justify-center space-x-2 text-green-600">
        <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
          <path
            fill-rule="evenodd"
            d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
            clip-rule="evenodd"
          />
        </svg>
        <span>Connected to Google Drive</span>
      </div>
    </template>
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
