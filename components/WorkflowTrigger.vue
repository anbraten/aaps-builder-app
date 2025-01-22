<template>
  <div>
    <button
      @click="triggerWorkflow"
      :disabled="building"
      class="w-full bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
    >
      <svg
        v-if="building"
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
      <span>{{ building ? 'Building app ...' : 'Start Build' }}</span>
    </button>
    <div
      v-if="statusMessage"
      class="mt-4 p-3 rounded-lg text-sm"
      :class="{
        'bg-green-100 text-green-700': status === 'done',
        'bg-red-100 text-red-700': status === 'error',
        'bg-gray-100 text-red-700': status === 'building' || status === 'starting',
      }"
    >
      {{ statusMessage }}
    </div>
  </div>
</template>

<script setup lang="ts">
const store = useAuthStore();
const building = ref(false);
const status = ref<'starting' | 'building' | 'done' | 'error'>();
const statusMessage = computed(() => {
  if (status.value === 'starting') return 'Starting the build workflow ...';
  if (status.value === 'building') return 'Building the app ...';
  if (status.value === 'done') return 'Your app is ready!';
  if (status.value === 'error') return 'Error starting the build workflow. Please try again.';

  return null;
});

async function triggerWorkflow() {
  if (!store.githubToken || !store.googleToken || !store.selectedRepo) return;

  building.value = true;
  status.value = 'starting';

  try {
    await $fetch('/api/github/workflow', {
      method: 'POST',
      body: {
        repoFullName: store.selectedRepo,
      },
    });

    status.value = 'building';
  } catch (error) {
    console.error('Error triggering workflow:', error);
    status.value = 'error';
    building.value = false;
  }
}

async function checkBuildStatus() {
  setInterval(async () => {
    const status = await $fetch('/api/github/workflow', {});
  }, 1000 * 10);
}
</script>
