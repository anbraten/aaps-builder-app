<template>
  <div>
    <button
      @click="triggerWorkflow"
      :disabled="status === 'starting' || status === 'building'"
      class="w-full bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
    >
      <svg
        v-if="status === 'starting' || status === 'building'"
        class="animate-spin h-5 w-5 mr-2"
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
      >
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
        <path
          class="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
        ></path>
      </svg>
      <span>{{ status === 'starting' || status === 'building' ? 'Building the app ...' : 'Start Build' }}</span>
    </button>
    <div
      v-if="statusMessage"
      class="mt-4 p-3 rounded-lg text-sm"
      :class="{
        'bg-green-100 text-green-700': status === 'done',
        'bg-red-100 text-red-700': status === 'error',
        'bg-gray-100 text-gray-700': status === 'starting' || status === 'building',
      }"
    >
      {{ statusMessage }}
    </div>
  </div>
</template>

<script setup lang="ts">
const store = useAuthStore();
const status = ref<'starting' | 'building' | 'done' | 'error'>();

const statusMessage = computed(() => {
  if (status.value === 'done') return 'Your app should be ready soon! Please download it from Google Drive.';
  if (status.value === 'error') return 'Error building the app. Please try again.';

  return null;
});

const checkBuildInterval = ref<number>();
async function startCheckingBuildStatus() {
  checkBuildInterval.value = window.setInterval(async () => {
    const response = await $fetch<{
      status: 'building' | 'done' | 'error';
    }>('/api/github/workflow', {
      method: 'GET',
      query: {
        repoFullName: store.selectedRepo,
        // TODO: pass workflow id or sth
      },
    });

    if (response.status === 'done' || response.status === 'error') {
      status.value = response.status;
      clearInterval(checkBuildInterval.value);
    }
  }, 1000 * 10);
}

function stopCheckingBuildStatus() {
  if (checkBuildInterval.value !== undefined) {
    clearInterval(checkBuildInterval.value);
  }
}

onBeforeUnmount(() => {
  stopCheckingBuildStatus();
});

async function triggerWorkflow() {
  if (!store.githubToken || !store.googleToken || !store.selectedRepo) return;

  stopCheckingBuildStatus();

  status.value = 'starting';

  try {
    await $fetch('/api/github/workflow', {
      method: 'POST',
      body: {
        repoFullName: store.selectedRepo,
      },
    });

    // startCheckingBuildStatus();

    // status.value = 'building';
    status.value = 'done';
  } catch (error) {
    console.error('Error triggering workflow:', error);
    status.value = 'error';
  }
}
</script>
