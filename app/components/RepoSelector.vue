<template>
  <div class="space-y-4">
    <i18n-t keypath="to_build_the_aaps_app" tag="p" class="text-muted leading-relaxed">
      <a :href="`https://github.com/${builderRepo}`" target="_blank" class="link">{{ builderRepo }}</a>
    </i18n-t>

    <button type="button" class="btn btn-secondary w-full" :disabled="loading" @click="checkForExistingFork">
      <AppIcon v-if="loading" name="spinner" class="h-5 w-5" />
      <AppIcon v-else name="fork" class="h-5 w-5" />
      <span>{{ loading ? $t('loading_repositories') : $t('check_for_existing_fork') }}</span>
    </button>

    <div v-if="!hasForkedRepo && checkedForForks" class="alert alert-warning space-y-3">
      <i18n-t keypath="could_not_find_a_fork" tag="p">
        <span class="font-semibold">{{ builderRepo }}</span>
      </i18n-t>

      <a :href="`https://github.com/${builderRepo}/fork`" class="btn btn-success w-full" target="_blank">
        <AppIcon name="fork" class="h-5 w-5" />
        {{ $t('fork_now') }}
        <AppIcon name="external" class="h-4 w-4 opacity-80" />
      </a>

      <p>{{ $t('or_select_it_from_the') }}</p>
    </div>

    <div v-if="checkedForForks || store.selectedRepo">
      <label for="repo-select" class="label">{{ $t('select_the_forked_repository') }}</label>
      <div class="relative">
        <select
          id="repo-select"
          :value="store.selectedRepo"
          class="input appearance-none truncate pr-11"
          :class="{ 'ring-2 ring-emerald-500 dark:ring-emerald-500': store.selectedRepo }"
          :disabled="loading"
          @change="handleRepoChange"
        >
          <option value="">{{ $t('select_a_repository') }}</option>
          <option v-for="repo in repoOptions" :key="repo.full_name" :value="repo.full_name">
            {{ repo.full_name }}
            {{ repo.full_name.endsWith(`/${builderRepoName}`) ? `(${$t('this_one_seems_to_be_it')})` : '' }}
          </option>
        </select>
        <div class="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3.5 text-stone-400">
          <AppIcon name="chevron-down" class="h-5 w-5" />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Repository } from '~/types';

const store = useBuilderStore();
const repos = ref<Repository[]>([]);
const loading = ref(false);
const checkedForForks = ref(false);

defineEmits<{
  (event: 'continue'): void;
}>();

const builderRepo = 'anbraten/aaps-builder';
const builderRepoName = builderRepo.split('/')[1];
const hasForkedRepo = computed(() => repos.value.some((r) => r.full_name.endsWith(`/${builderRepoName}`)));

// keep the previously selected repo in the list, even before the repos are loaded
const repoOptions = computed(() => {
  if (!store.selectedRepo || repos.value.some((r) => r.full_name === store.selectedRepo)) {
    return repos.value;
  }
  return [...repos.value, { full_name: store.selectedRepo }];
});

async function fetchRepos() {
  if (!store.status?.githubToken) return;

  loading.value = true;
  try {
    repos.value = await $fetch('/api/github/repos');
  } catch (error) {
    if (await store.handleGithubAuthError(error)) {
      return;
    }
    console.error('Error fetching repos:', error);
  } finally {
    loading.value = false;
  }
}

async function checkForExistingFork() {
  await fetchRepos();

  store.selectedRepo = repos.value.find((r) => r.full_name.endsWith(`/${builderRepoName}`))?.full_name || '';
  checkedForForks.value = true;
}

function handleRepoChange(event: Event) {
  const target = event.target as HTMLSelectElement;
  const repo = repos.value.find((r) => r.full_name === target.value);
  store.selectedRepo = repo?.full_name || '';
}

onMounted(() => {
  if (store.status?.githubToken && !store.selectedRepo) {
    checkForExistingFork();
  }
});
</script>
