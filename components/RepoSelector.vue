<template>
  <div class="flex flex-col">
    <p class="text-gray-600">
      To build the AAPS app you have to fork (create your own copy) of the
      <a :href="`https://github.com/${builderRepo}`" target="_blank" class="underline">{{ builderRepo }}</a>
      GitHub repository. This fork will be used to build the app with your own configuration.
    </p>

    <button @click="checkForExistingFork" class="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg mx-auto">
      Check for existing fork
    </button>

    <div v-if="loading" class="mt-2 text-gray-600 flex items-center justify-center">
      <svg class="animate-spin h-4 w-4 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
        <path
          class="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
        ></path>
      </svg>
      Loading repositories...
    </div>

    <div v-if="!forkedRepoMatch && checkedForForks" class="p-3 rounded-lg bg-orange-100 text-orange-700 mt-4">
      Could not find a fork automatically. Have you forked the {{ builderRepo }} repository already? If not click
      <a :href="`https://github.com/${builderRepo}/fork`" class="underline" target="_blank">here</a> to fork it now.
      After that check for existing forks again.
    </div>

    <template v-if="checkedForForks">
      <p class="text-gray-600 mt-4">Select the forked repository:</p>
      <div class="relative">
        <select
          :value="store.selectedRepo"
          @change="handleRepoChange"
          class="w-full p-2 border rounded-lg appearance-none bg-white pr-10 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          :disabled="loading"
        >
          <option value="">Select a repository</option>
          <option v-for="repo in repos" :key="repo.id" :value="repo.full_name">
            {{ repo.full_name }} {{ repo.full_name.endsWith(`/${builderRepoName}`) ? '(This one seems to be it)' : '' }}
          </option>
          <!-- <option v-if="repos.length === 0 && store.selectedRepo" :value="store.selectedRepo">
          {{ store.selectedRepo }} (This one seems to be it)
        </option> -->
        </select>
        <div class="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
          <svg class="w-5 h-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
            <path
              fill-rule="evenodd"
              d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
              clip-rule="evenodd"
            />
          </svg>
        </div>
      </div>
    </template>
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
const forkedRepoMatch = computed(() => store.selectedRepo.endsWith(`/${builderRepoName}`));

async function fetchRepos() {
  if (!store.status?.githubToken) return;

  loading.value = true;
  try {
    repos.value = await $fetch('/api/github/repos');
  } catch (error) {
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
  console.log('change', target.value);
  const repo = repos.value.find((r) => r.full_name === target.value);
  store.selectedRepo = repo?.full_name || '';
}

onMounted(() => {
  if (store.status?.githubToken && !store.selectedRepo) {
    checkForExistingFork();
  }
});
</script>
