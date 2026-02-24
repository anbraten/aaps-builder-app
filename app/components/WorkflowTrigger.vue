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
          'border-green-300 bg-green-200': flavor === 'app',
        }"
        @click="status === 'todo' && (flavor = 'app')"
      >
        📱 {{ $t('app') }}
      </div>
      <div
        class="p-4 border-2 rounded-md"
        :class="{
          'cursor-pointer': status === 'todo',
          'border-green-300 bg-green-200': flavor === 'wear',
        }"
        @click="status === 'todo' && (flavor = 'wear')"
      >
        ⌚ {{ $t('wear') }}
      </div>
    </div>

    <div v-if="error" class="mt-4 p-3 rounded-lg bg-red-100 text-red-700 gap-2 flex flex-col">
      <p class="mx-auto mb-2 font-bold">{{ $t('error_occurred') }}</p>

      <template v-if="error?.includes('Please update your fork')">
        <i18n-t keypath="please_update_your_fork" tag="p">
          <a :href="`https://github.com/${store.selectedRepo}`" target="_blank" class="text-blue-500 underline">{{
            $t('here')
          }}</a>
        </i18n-t>

        <img src="/sync-fork.png" alt="Update your fork" class="mt-4 mx-auto" />
      </template>
      <template v-else-if="error?.includes('Workflow not found')">
        <i18n-t keypath="is_your_fork_of_aaps_builder" tag="p">
          <a :href="`https://github.com/${store.selectedRepo}`" target="_blank" class="underline font-bold">{{
            store.selectedRepo
          }}</a>
        </i18n-t>
      </template>
      <template v-else-if="error?.includes('actions disabled')">
        <p>{{ $t('in_some_cases_github_requires') }}</p>
        <i18n-t keypath="check_for_the_enable_button" tag="p">
          <a
            :href="`https://github.com/${store.selectedRepo}/actions`"
            target="_blank"
            class="text-blue-500 underline"
            >{{ $t('here') }}</a
          >
        </i18n-t>
        <img src="/workflow-not-found.png" alt="Enable workflow on GitHub Screenshot" class="mt-4 mx-auto" />
      </template>
      <template v-else-if="error?.includes('No queued or running workflow found')">
        <p>
          Strange, we have triggered the workflow, but it seems not to be queued or running. Please check if you have
          enabled GitHub Actions for your fork
          <a
            :href="`https://github.com/${store.selectedRepo}/actions`"
            target="_blank"
            class="text-blue-500 underline"
            >{{ $t('here') }}</a
          >.
        </p>
        <img src="/workflow-not-found.png" alt="Enable workflow on GitHub Screenshot" class="mt-4 mx-auto" />
        <p>If you have already enabled them, please try again or ask some expert for help.</p>
      </template>
      <template v-else-if="error?.includes('Workflow execution failed')">
        The workflow execution failed. Please check the logs on GitHub for more details or ask some expert.
      </template>
      <template v-else>
        <p class="whitespace-pre-wrap my-4">:::{{ '\n' }}{{ error }}{{ '\n' }}:::</p>
      </template>
    </div>

    <button
      v-if="completedSteps && status !== 'done'"
      :disabled="status === 'building'"
      class="w-full text-white px-4 mt-4 py-2 rounded-lg transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
      :class="{
        'bg-green-500 hover:bg-green-600': error === undefined,
        'bg-red-500 hover:bg-red-600': error !== undefined,
      }"
      @click="startBuild"
    >
      <svg
        v-if="status === 'building'"
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
      <span v-if="error !== undefined">{{ $t('try_again') }}</span>
      <span v-else-if="activeBuildStep !== undefined">{{ buildSteps[activeBuildStep].title }} ...</span>
      <span v-else>{{ flavor === 'wear' ? $t('start_build_wear') : $t('start_build_app') }}</span>
    </button>

    <template v-if="activeBuildStep && buildSteps[activeBuildStep].title === t('waiting_for_workflow')">
      <p class="mt-4">
        Yeah 🎉, the workflow has been triggered and is now running. The app is being built now. This can take a few
        minutes. You could check your {{ cloudStorage }} meanwhile to see if the app is already there.
      </p>
    </template>

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
    title: t('checking_fork_repository'),
    run: checkForkVersion,
  },
  {
    title: t('starting_workflow'),
    run: triggerWorkflow,
  },
  {
    title: t('waiting_for_workflow'),
    run: checkBuildStatus,
  },
];
const activeBuildStep = ref<number>();

async function checkForkVersion() {
  const response = await $fetch('/api/github/check-fork', {
    method: 'POST',
    body: {
      repoFullName: store.selectedRepo,
    },
  });

  if (!response.isUpToDate) {
    throw new Error('Please update your fork');
  }
}

const workflowRunId = ref<number>();
async function triggerWorkflow() {
  const response = await $fetch('/api/github/workflow', {
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
  workflowRunId.value = response.workflowRunId;
  void confetti({
    particleCount: 100,
    spread: 70,
    origin: { y: 1.1 },
    startVelocity: 90,
    zIndex: 2000,
    ticks: 400,
  });
}

const checkBuildTimeoutId = ref<number>();
async function checkBuildStatus() {
  await new Promise<void>((resolve, reject) => {
    checkBuildTimeoutId.value = window.setInterval(async () => {
      const response = await $fetch('/api/github/check-run-status', {
        method: 'GET',
        query: {
          repoFullName: store.selectedRepo,
          runId: workflowRunId.value,
        },
      });

      if (response.status === 'in_progress') {
        return;
      }

      if (response.status === 'success') {
        clearInterval(checkBuildTimeoutId.value);
        resolve();
        return;
      }

      if (response.status === 'failed') {
        clearInterval(checkBuildTimeoutId.value);
        reject(new Error('Workflow execution failed. Logs: ')); // TODO: add link to logs
        return;
      }
    }, 1000 * 10);
  });
}

onBeforeUnmount(() => {
  if (checkBuildTimeoutId.value !== undefined) {
    window.clearTimeout(checkBuildTimeoutId.value);
  }
});

function track(event: string, data: any) {
  const umami = (window as any)?.umami;
  umami?.track(event, data);
}

async function startBuild() {
  error.value = undefined;
  activeBuildStep.value = undefined;
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
      console.error('Error running build step:', e, JSON.stringify(e));
      const eStr = (e as any)?.message || e;
      error.value = eStr;
      status.value = 'todo';
      activeBuildStep.value = undefined;
      return;
    }
  }

  status.value = 'done';
  activeBuildStep.value = undefined;
}
</script>
