<template>
  <div class="space-y-4">
    <p v-if="!completedSteps" class="alert alert-error">
      {{ $t('you_need_to_complete_all_steps') }}
    </p>

    <!-- Summary of what will be built -->
    <dl
      v-else
      class="divide-y divide-stone-200 overflow-hidden rounded-2xl text-sm ring-1 ring-inset ring-stone-200 dark:divide-stone-700 dark:ring-stone-700"
    >
      <div class="flex items-center justify-between gap-4 px-4 py-3">
        <dt class="text-muted shrink-0">AndroidAPS</dt>
        <dd class="min-w-0 truncate text-right font-semibold">
          <a href="https://github.com/nightscout/AndroidAPS" target="_blank" class="hover:underline">{{
            appVersion?.version
          }}</a>
        </dd>
      </div>
      <div class="flex items-center justify-between gap-4 px-4 py-3">
        <dt class="text-muted shrink-0">{{ $t('repository') }}</dt>
        <dd class="min-w-0 truncate text-right font-semibold">
          <a :href="`https://github.com/${store.selectedRepo}`" target="_blank" class="hover:underline">{{
            store.selectedRepo
          }}</a>
        </dd>
      </div>
      <div class="flex items-center justify-between gap-4 px-4 py-3">
        <dt class="text-muted shrink-0">{{ $t('cloud_storage') }}</dt>
        <dd class="min-w-0 truncate text-right font-semibold">{{ cloudStorage }}</dd>
      </div>
    </dl>

    <div v-if="store.featureFlags.aaps_version">
      <label for="aaps-ref" class="label">{{ $t('aaps_version') }}</label>
      <div class="flex gap-2">
        <input
          id="aaps-ref"
          v-model.trim="store.aapsRef"
          :disabled="status !== 'todo'"
          type="text"
          placeholder="master"
          autocapitalize="off"
          autocomplete="off"
          spellcheck="false"
          class="input"
          @keydown.enter="reloadVersion"
        />
        <button
          type="button"
          :disabled="status !== 'todo' || versionStatus === 'pending'"
          class="btn btn-secondary aspect-square shrink-0 !px-0"
          :title="$t('reload_version')"
          :aria-label="$t('reload_version')"
          @click="reloadVersion"
        >
          <AppIcon name="refresh" class="h-5 w-5" :class="{ 'animate-spin': versionStatus === 'pending' }" />
        </button>
      </div>
      <p v-if="!appVersion?.version && versionStatus !== 'pending'" class="mt-1 text-sm text-red-600">
        {{ $t('version_not_found') }}
      </p>
      <p class="hint">{{ $t('aaps_version_hint') }}</p>
    </div>

    <!-- Flavor -->
    <div role="radiogroup" class="grid grid-cols-2 gap-3">
      <button
        v-for="f in flavors"
        :key="f.value"
        type="button"
        role="radio"
        :aria-checked="flavor === f.value"
        :disabled="status !== 'todo'"
        class="choice flex-col justify-center py-4 text-center disabled:cursor-not-allowed disabled:opacity-60"
        :class="{ 'choice-active': flavor === f.value }"
        @click="flavor = f.value"
      >
        <AppIcon
          :name="f.icon"
          class="h-7 w-7"
          :class="flavor === f.value ? 'text-primary-600 dark:text-primary-400' : 'text-stone-400'"
        />
        <span class="font-semibold">{{ f.label }}</span>
      </button>
    </div>

    <!-- Build progress -->
    <ol v-if="status !== 'todo'" class="space-y-3 rounded-2xl bg-stone-50 p-4 dark:bg-stone-800/60">
      <li v-for="(step, index) in buildSteps" :key="index" class="flex items-center gap-3 text-sm">
        <span class="flex h-6 w-6 shrink-0 items-center justify-center">
          <AppIcon
            v-if="status === 'done' || (activeBuildStep !== undefined && index < activeBuildStep)"
            name="check-circle"
            class="h-6 w-6 text-emerald-600 dark:text-emerald-400"
          />
          <AppIcon v-else-if="index === activeBuildStep" name="spinner" class="h-5 w-5 text-primary-600" />
          <span v-else class="h-3 w-3 rounded-full bg-stone-300 dark:bg-stone-600" />
        </span>
        <span :class="index === activeBuildStep ? 'font-semibold' : 'text-muted'">{{ step.title }}</span>
      </li>
    </ol>

    <div v-if="error" class="alert alert-error space-y-3">
      <p class="flex items-center gap-2 font-bold">
        <AppIcon name="warning" class="h-5 w-5 shrink-0" />
        {{ $t('error_occurred') }}
      </p>

      <template v-if="error?.includes('GitHub session expired')">
        <p>{{ $t('github_session_expired') }}</p>
      </template>
      <template v-else-if="error?.includes('Please update your fork')">
        <i18n-t keypath="please_update_your_fork" tag="p">
          <a :href="`https://github.com/${store.selectedRepo}`" target="_blank" class="font-semibold underline">{{
            $t('here')
          }}</a>
        </i18n-t>

        <img src="/sync-fork.png" alt="Update your fork" class="w-full rounded-xl ring-1 ring-red-200" />
      </template>
      <template v-else-if="error?.includes('GitHub Actions disabled')">
        <p>{{ $t('in_some_cases_github_requires') }}</p>
        <i18n-t keypath="check_for_the_enable_button" tag="p">
          <a
            :href="`https://github.com/${store.selectedRepo}/actions`"
            target="_blank"
            class="font-semibold underline"
            >{{ $t('here') }}</a
          >
        </i18n-t>
        <img
          src="/workflow-not-found.png"
          alt="Enable workflow on GitHub Screenshot"
          class="w-full rounded-xl ring-1 ring-red-200"
        />
      </template>
      <template v-else-if="error?.includes('Repo or Workflow not found')">
        <i18n-t keypath="is_your_fork_of_aaps_builder" tag="p">
          <a :href="`https://github.com/${store.selectedRepo}`" target="_blank" class="font-bold underline">{{
            store.selectedRepo
          }}</a>
        </i18n-t>
      </template>
      <template v-else-if="error?.includes('No queued or running workflow found')">
        <i18n-t keypath="no_running_workflow_found" tag="p">
          <a
            :href="`https://github.com/${store.selectedRepo}/actions`"
            target="_blank"
            class="font-semibold underline"
            >{{ $t('here') }}</a
          >
        </i18n-t>
        <img
          src="/workflow-not-found.png"
          alt="Enable workflow on GitHub Screenshot"
          class="w-full rounded-xl ring-1 ring-red-200"
        />
        <p>{{ $t('no_running_workflow_found_retry') }}</p>
      </template>
      <template v-else-if="error?.includes('rate limit')">
        <p>{{ $t('github_rate_limit') }}</p>
      </template>
      <template v-else-if="error?.includes('Workflow execution failed')">
        <p>{{ $t('workflow_execution_failed') }}</p>
        <p class="text-sm">{{ error }}</p>
        <a v-if="logsUrl" :href="logsUrl" target="_blank" class="font-semibold underline">{{ $t('view_logs') }}</a>
      </template>
      <template v-else>
        <pre
          class="overflow-x-auto whitespace-pre-wrap break-words rounded-xl bg-red-100/70 p-3 text-xs dark:bg-red-950/60"
          >{{ error }}</pre>
      </template>
    </div>

    <p
      v-if="activeBuildStep !== undefined && buildSteps[activeBuildStep]?.title === t('waiting_for_workflow')"
      class="alert alert-info"
    >
      {{ $t('workflow_is_running', [cloudStorage]) }}
    </p>

    <div v-if="status === 'done'" class="alert alert-success flex gap-3">
      <AppIcon name="check-circle" class="h-6 w-6 shrink-0" />
      <i18n-t keypath="your_app_should_be_ready" tag="p">
        <span class="font-bold">AndroidAPS{{ flavor === 'wear' ? '-wear' : '' }}-{{ appVersion?.version }}.apk</span>
        <span class="font-bold">{{ cloudStorage }}</span>
      </i18n-t>
    </div>

    <button
      v-if="completedSteps && status !== 'done'"
      type="button"
      :disabled="status === 'building'"
      class="btn w-full"
      :class="error === undefined ? 'btn-success' : 'btn-danger'"
      @click="startBuild"
    >
      <AppIcon v-if="status === 'building'" name="spinner" class="h-5 w-5" />
      <AppIcon v-else-if="error === undefined" name="rocket" class="h-5 w-5" />
      <span v-if="error !== undefined">{{ $t('try_again') }}</span>
      <span v-else-if="activeBuildStep !== undefined">{{ buildSteps[activeBuildStep]?.title }} …</span>
      <span v-else>{{ flavor === 'wear' ? $t('start_build_wear') : $t('start_build_app') }}</span>
    </button>
  </div>
</template>

<script setup lang="ts">
import confetti from 'canvas-confetti';

const store = useBuilderStore();
const { t } = useI18n();
const status = ref<'todo' | 'building' | 'done'>('todo');
const error = ref<string>();
const flavor = ref<'app' | 'wear'>('app');

const flavors = computed(() => [
  { value: 'app' as const, label: t('app'), icon: 'phone' as const },
  { value: 'wear' as const, label: t('wear'), icon: 'watch' as const },
]);

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

// the ref the shown version belongs to, only updated on demand (reload button / enter)
const loadedRef = ref(store.featureFlags.aaps_version ? store.aapsRef : '');
const {
  data: appVersion,
  status: versionStatus,
  refresh: refreshVersion,
} = await useFetch('/api/github/app-version', {
  query: computed(() => ({ ref: loadedRef.value || undefined })),
});

async function reloadVersion() {
  const ref = store.aapsRef;
  if (ref === loadedRef.value) {
    await refreshVersion();
  } else {
    loadedRef.value = ref;
  }
}

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
      aapsRef: store.featureFlags.aaps_version ? store.aapsRef : undefined,
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

const logsUrl = ref<string>();
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
        logsUrl.value = response.logsUrl;
        reject(new Error(`Workflow execution failed: ${response.failedStep ?? response.run.conclusion}`));
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
  logsUrl.value = undefined;
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
      if (await store.handleGithubAuthError(e)) {
        error.value = 'GitHub session expired';
        status.value = 'todo';
        activeBuildStep.value = undefined;
        return;
      }
      console.error('Error running build step:', e, JSON.stringify(e));
      // the server's message is only part of the response body (statusText is empty on http2)
      const eStr = (e as any)?.data?.statusMessage || (e as any)?.message || e;
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
