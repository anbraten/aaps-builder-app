import { useLocalStorage } from '@vueuse/core';
import { defineStore } from 'pinia';
import type { Repository } from '~/types';

const prefix = 'aaps_builder.';

export const useAuthStore = defineStore('auth', () => {
  const githubToken = useCookie<string | null>(`github_token`);
  const googleToken = useCookie<string | null>(`google_token`);

  const selectedRepo = computed({
    get() {
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

  return {
    githubToken,
    googleToken,
    selectedRepo,
  };
});
