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
      isDone: computed(() => status.value?.googleToken === true),
      component: GoogleDriveLogin,
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
    keyStore,
  };
});
