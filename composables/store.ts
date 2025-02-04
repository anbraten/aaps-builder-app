import { useLocalStorage } from '@vueuse/core';
import { defineStore } from 'pinia';
import type { Component } from 'vue';
import CloudStorage from '~/components/CloudStorage.vue';
import GitHubLogin from '~/components/GitHubLogin.vue';
import KeyStore from '~/components/KeyStore.vue';
import RepoSelector from '~/components/RepoSelector.vue';
import WorkflowTrigger from '~/components/WorkflowTrigger.vue';

const prefix = 'aaps_builder.';

type Step = {
  name: string;
  title?: string;
  isDone: Ref<boolean>;
  component?: Component;
};

export const useBuilderStore = defineStore('aaps_builder', () => {
  const { data: status, refresh: refreshStatus } = useFetch('/api/status');

  const selectedRepo = useLocalStorage(`${prefix}selected_repo`, '');

  const keyStore = useLocalStorage(`${prefix}key_store`, {
    content: '',
    password: '',
    keyAlias: '',
    keyPassword: '',
  });

  const selectedCloudStorage = useLocalStorage<'google-drive' | 'dropbox' | 'github-artifact' | ''>(
    `${prefix}selected_cloud_storage`,
    '',
  );

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
      isDone: computed(() => status.value?.githubToken === true),
      component: GitHubLogin,
    },
    {
      name: 'Repository',
      title: 'Select a repository',
      isDone: computed(() => selectedRepo.value !== '' && selectedRepo.value !== null),
      component: RepoSelector,
    },
    {
      name: 'KeyStore',
      title: 'Setup a KeyStore',
      isDone: keyStoreConfigured,
      component: KeyStore,
    },
    {
      name: 'Cloud Storage',
      title: 'Setup a Cloud Storage',
      isDone: computed(() => {
        if (selectedCloudStorage.value === 'google-drive') {
          return status.value?.googleToken === true;
        }

        if (selectedCloudStorage.value === 'dropbox') {
          return status.value?.dropboxToken === true;
        }

        return selectedCloudStorage.value !== '';
      }),
      component: CloudStorage,
    },
    {
      name: 'Build',
      title: 'Build',
      isDone: computed(() => false),
      component: WorkflowTrigger,
    },
  ];

  return {
    steps,
    status,
    refreshStatus,
    selectedRepo,
    selectedCloudStorage,
    keyStore,
  };
});
