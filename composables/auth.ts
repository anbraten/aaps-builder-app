import { useLocalStorage } from '@vueuse/core';
import { defineStore } from 'pinia';
import type { Component } from 'vue';
import GitHubLogin from '~/components/GitHubLogin.vue';
import GoogleDriveLogin from '~/components/GoogleDriveLogin.vue';
import KeyStore from '~/components/KeyStore.vue';
import RepoSelector from '~/components/RepoSelector.vue';
import WorkflowTrigger from '~/components/WorkflowTrigger.vue';

const prefix = 'aaps_builder.';

type Step = {
  name: string;
  title?: string;
  description?: string;
  isDone: Ref<boolean>;
  component?: Component;
};

export const useAuthStore = defineStore('auth', () => {
  const { data: status, refresh: refreshStatus } = useFetch('/api/status');

  const selectedRepo = computed({
    get() {
      if (!import.meta.client) {
        return '';
      }

      return localStorage.getItem(`${prefix}selected_repo`);
    },
    set(value: string | null) {
      if (value === null) {
        localStorage.removeItem(`${prefix}selected_repo`);
      } else {
        localStorage.setItem(`${prefix}selected_repo`, value);
      }
    },
  });

  const keyStore = useLocalStorage(`${prefix}key_store`, {
    content: '',
    password: '',
    keyAlias: '',
    keyPassword: '',
  });

  const keyStoreConfigured = computed(
    () =>
      keyStore.value.content !== '' &&
      keyStore.value.password !== '' &&
      keyStore.value.keyAlias !== '' &&
      keyStore.value.keyPassword !== '',
  );

  const steps: Step[] = [
    {
      name: 'GitHub',
      title: 'Login to GitHub',
      description: "First, let's connect your GitHub account to access your repositories.",
      isDone: computed(() => status.value?.githubToken === true),
      component: GitHubLogin,
    },
    {
      name: 'Repository',
      title: 'Select repository',
      description: 'Choose the Android repository you want to build.',
      isDone: computed(() => selectedRepo.value !== null),
      component: RepoSelector,
    },
    {
      name: 'KeyStore',
      title: 'Setup KeyStore',
      description:
        'A Key Store is required to sign your app. You probably have one already if you have used AndroidAPS before.',
      isDone: keyStoreConfigured,
      component: KeyStore,
    },
    {
      name: 'Cloud Storage',
      title: 'Setup Cloud Storage',
      description: 'Connect your Google Drive to store the build artifacts.',
      isDone: computed(() => status.value?.googleToken === true),
      component: GoogleDriveLogin,
    },
    {
      name: 'Build',
      title: 'Build',
      description: "Everything is ready to go. Let's build your app!",
      isDone: computed(() => false),
      component: WorkflowTrigger,
    },
  ];

  return {
    steps,
    status,
    refreshStatus,
    selectedRepo,
    keyStore,
  };
});
