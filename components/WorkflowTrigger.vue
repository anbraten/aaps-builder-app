<template>
  <div>
    <p v-if="!completedSteps" class="mt-4 p-3 rounded-lg bg-red-100 text-red-700 mb-4">
      You need to complete all steps before building the app.
    </p>
    <p v-else class="text-gray-600 mb-4">Everything is ready to go. Let's build your app!</p>

    <p class="text-gray-600 mb-4">
      Using
      <a :href="`https://github.com/${store.selectedRepo}`" target="_blank" class="underline font-bold">{{
        store.selectedRepo
      }}</a>
      to build
      <a :href="`https://github.com/nightscout/AndroidAPS`" target="_blank" class="underline font-bold"
        >nightscout/AndroidAPS</a
      >
      version <span class="font-bold">{{ appVersion?.version }}</span
      >. The app will be saved to <span class="font-bold">{{ cloudStorage }}</span> as
      <span class="font-bold">AndroidAPS-{{ appVersion?.version }}.apk</span>.
    </p>

    <button
      v-if="completedSteps && status !== 'done'"
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
      class="mt-4 p-3 rounded-lg"
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
const store = useBuilderStore();
const status = ref<'starting' | 'building' | 'done' | 'error'>();

const cloudStorage = computed(() => {
  switch (store.selectedCloudStorage) {
    case 'google-drive':
      return 'Google Drive';
    case 'dropbox':
      return 'Dropbox';
    case 'github-artifact':
      return 'GitHub Artifact';
    default:
      return null;
  }
});

const statusMessage = computed(() => {
  if (status.value === 'done')
    return `Your app should be ready soon! It should be in your ${cloudStorage.value} in a few minutes.`;
  if (status.value === 'error') return 'Error building the app. Please try again.';

  return null;
});

const { data: appVersion } = await useFetch('/api/github/app-version');

const completedSteps = computed(() => store.steps.filter((step) => step.isDone).length === store.steps.length - 1);

// TODO: check build status and notify user
// const checkBuildInterval = ref<number>();
// async function startCheckingBuildStatus() {
//   checkBuildInterval.value = window.setInterval(async () => {
//     const response = await $fetch<{
//       status: 'building' | 'done' | 'error';
//     }>('/api/github/workflow', {
//       method: 'GET',
//       query: {
//         repoFullName: store.selectedRepo,
//         // TODO: pass workflow id or sth
//       },
//     });

//     if (response.status === 'done' || response.status === 'error') {
//       status.value = response.status;
//       clearInterval(checkBuildInterval.value);
//     }
//   }, 1000 * 10);
// }

// function stopCheckingBuildStatus() {
//   if (checkBuildInterval.value !== undefined) {
//     clearInterval(checkBuildInterval.value);
//   }
// }

// onBeforeUnmount(() => {
//   stopCheckingBuildStatus();
// });

async function triggerWorkflow() {
  // stopCheckingBuildStatus();

  status.value = 'starting';

  try {
    await $fetch('/api/github/workflow', {
      method: 'POST',
      body: {
        // github and cloud storage tokens are provided as cookies
        repoFullName: store.selectedRepo,
        // appVersion: appVersion?.version, // TODO: pass app version
        keyStore: store.keyStore,
        cloudStorage: store.selectedCloudStorage,
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
