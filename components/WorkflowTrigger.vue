<template>
  <div>
    <p v-if="!completedSteps" class="mt-4 p-3 rounded-lg bg-red-100 text-red-700 mb-4">
      {{ $t('you_need_to_complete_all_steps') }}
    </p>
    <i18n-t v-else keypath="everything_is_ready_to_go" class="text-gray-600 mb-4" tag="p">
      <a :href="`https://github.com/nightscout/AndroidAPS`" target="_blank" class="underline font-bold"
        >nightscout/AndroidAPS</a
      >
      <span class="font-bold">{{ appVersion?.version }}</span>
      <a :href="`https://github.com/${store.selectedRepo}`" target="_blank" class="underline font-bold">{{
        store.selectedRepo
      }}</a>
    </i18n-t>

    <div class="flex gap-2 mb-3 justify-center">
      <div
        class="p-4 border-2 rounded-md"
        :class="{
          'cursor-pointer': status === 'todo',
          'border-gray-300 bg-gray-200': flavor === 'app',
        }"
        @click="status === 'todo' && (flavor = 'app')"
      >
        📱 App
      </div>
      <div
        class="p-4 border-2 rounded-md"
        :class="{
          'cursor-pointer': status === 'todo',
          'border-gray-300 bg-gray-200': flavor === 'wear',
        }"
        @click="status === 'todo' && (flavor = 'wear')"
      >
        ⌚ Wear
      </div>
    </div>

    <button
      v-if="completedSteps && status !== 'done'"
      :disabled="status === 'starting' || status === 'building'"
      class="w-full bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
      @click="startBuild"
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
      <span>{{
        activeBuildStep !== undefined
          ? `${buildSteps[activeBuildStep].title} ...`
          : flavor === 'wear'
            ? $t('start_build_wear')
            : $t('start_build_app')
      }}</span>
    </button>

    <div v-if="error" class="mt-4 p-3 rounded-lg bg-red-100 text-red-700 gap-2">
      <p>{{ $t('error_building_the_app') }}</p>
      <p class="whitespace-pre my-4">:::{{ `\n${error}\n` }}:::</p>

      <p>{{ $t('in_some_cases_github_requires') }}</p>
      <p>
        Check for the enable button
        <a :href="`https://github.com/${store.selectedRepo}/actions`" target="_blank" class="text-blue-500 underline"
          >here</a
        >.
      </p>
      <img src="/workflow-not-found.png" alt="Enable workflow on GitHub Screenshot" class="mt-4 mx-auto" />
    </div>

    <template v-if="status === 'done'">
      <div class="mt-4 p-3 rounded-lg bg-green-100 text-green-700">
        <i18n-t keypath="your_app_should_be_ready" class="text-gray-600 mb-4" tag="p">
          <span class="font-bold">AndroidAPS{{ flavor === 'wear' ? '-wear' : '' }}-{{ appVersion?.version }}.apk</span>
          <span class="font-bold">{{ cloudStorage }}</span>
        </i18n-t>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import confetti from 'canvas-confetti';

const store = useBuilderStore();
const { t } = useI18n();
const status = ref<'todo' | 'building' | 'done'>('todo');
const error = ref<string>();
const flavor = ref<'app' | 'wear'>('app');

const cloudStorage = computed(() => {
  switch (store.selectedCloudStorage) {
    case 'google-drive':
      return t('google_drive');
    case 'dropbox':
      return t('dropbox');
    case 'github-artifact':
      return t('github_artifact');
    default:
      return null;
  }
});

const { data: appVersion } = await useFetch('/api/github/app-version');

const completedSteps = computed(() => store.steps.filter((step) => step.isDone).length === store.steps.length - 1);

type BuildStep = {
  title: string;
  run: () => Promise<void>;
};

const buildSteps: BuildStep[] = [
  {
    title: 'Checking fork repository is up to date',
    run: async () => {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      // throw new Error('Please update your fork');
    },
  },
  {
    title: 'Starting workflow',
    run: triggerWorkflow,
  },
  {
    title: 'Waiting for workflow to finish',
    run: async () => {
      await new Promise((resolve) => setTimeout(resolve, 3 * 1000)); // wait some time
      // TODO: implement checking build status
    },
  },
];
const activeBuildStep = ref<number>();

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
  await $fetch('/api/github/workflow', {
    method: 'POST',
    body: {
      // github and cloud storage tokens are provided as cookies
      repoFullName: store.selectedRepo,
      // appVersion: appVersion?.version, // TODO: pass app version
      keyStore: store.keyStore,
      cloudStorage: store.selectedCloudStorage,
      flavor: flavor.value,
    },
  });
}

function track(event: string, data: any) {
  const umami = (window as any)?.umami;
  umami.track(event, data);
}

async function startBuild() {
  error.value = undefined;
  status.value = 'building';

  track('trigger-workflow', {
    cloudStorage: store.selectedCloudStorage,
    appVersion: appVersion.value,
    flavor: flavor.value,
  });

  for await (const [index, step] of buildSteps.entries()) {
    activeBuildStep.value = index;
    try {
      await step.run();
    } catch (e) {
      const eStr = (error as any)?.message || error;
      track('trigger-workflow-error', {
        cloudStorage: store.selectedCloudStorage,
        appVersion: appVersion.value,
        error: eStr,
      });
      console.error('Error running build step:', e);
      error.value = `Error running build step: ${eStr}`;
      return;
    }
  }
  void confetti({ particleCount: 100, spread: 70, origin: { y: 1.1 }, startVelocity: 90, zIndex: 2000, ticks: 400 });
  status.value = 'done';
}
</script>
