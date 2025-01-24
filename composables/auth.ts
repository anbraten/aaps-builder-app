import { defineStore } from 'pinia';

const prefix = 'aaps_builder.';

export const useAuthStore = defineStore('auth', () => {
  const { data: status, refresh: refreshStatus } = useFetch('/api/status');

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
    status,
    refreshStatus,
    selectedRepo,
  };
});
