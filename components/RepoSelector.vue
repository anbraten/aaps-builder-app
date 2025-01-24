<template>
  <div>
    <div class="relative">
      <select
        :value="authStore.selectedRepo"
        @change="handleRepoChange"
        class="w-full p-2 border rounded-lg appearance-none bg-white pr-10 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        :disabled="loading"
      >
        <option value="">Select a repository</option>
        <option v-for="repo in repos" :key="repo.id" :value="repo.full_name">
          {{ repo.full_name }}
        </option>
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

    <button
      v-if="authStore.selectedRepo && !loading"
      @click="$emit('selected')"
      class="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors mt-4"
    >
      Continue →
    </button>
    <div v-if="loading" class="mt-2 text-sm text-gray-600 flex items-center justify-center">
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
  </div>
</template>

<script setup lang="ts">
import type { Repository } from '~/types';

const authStore = useAuthStore();
const repos = ref<Repository[]>([]);
const loading = ref(false);

defineEmits<{
  (event: 'selected'): void;
}>();

const fetchRepos = async () => {
  if (!authStore.status?.githubToken) return;

  loading.value = true;
  try {
    repos.value = await $fetch('/api/github/repos');
  } catch (error) {
    console.error('Error fetching repos:', error);
  } finally {
    loading.value = false;
  }
};

function handleRepoChange(event: Event) {
  const target = event.target as HTMLSelectElement;
  console.log('change', target.value);
  const repo = repos.value.find((r) => r.full_name === target.value);
  authStore.selectedRepo = repo?.full_name || null;
}

watchEffect(() => {
  if (authStore.status?.githubToken) {
    fetchRepos();
  }
});
</script>
