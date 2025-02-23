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
  const { t } = useI18n();

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
      name: t('github'),
      title: t('login_to_github'),
      isDone: computed(() => status.value?.githubToken === true),
      component: GitHubLogin,
    },
    {
      name: t('repository'),
      title: t('select_a_repository'),
      isDone: computed(() => selectedRepo.value !== '' && selectedRepo.value !== null),
      component: RepoSelector,
    },
    {
      name: t('key_store'),
      title: t('setup_a_key_store'),
      isDone: keyStoreConfigured,
      component: KeyStore,
    },
    {
      name: t('cloud_storage'),
      title: t('select_a_cloud_storage'),
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
      name: t('build'),
      title: t('build'),
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
