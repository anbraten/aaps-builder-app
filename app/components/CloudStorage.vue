<template>
  <div class="space-y-4">
    <p class="text-muted">{{ $t('select_the_cloud_storage_where') }}</p>

    <div role="radiogroup" :aria-label="$t('cloud_storage')" class="space-y-2">
      <button
        v-for="option in options"
        :key="option.value"
        type="button"
        role="radio"
        :aria-checked="store.selectedCloudStorage === option.value"
        class="choice"
        :class="{ 'choice-active': store.selectedCloudStorage === option.value }"
        @click="store.selectedCloudStorage = option.value"
      >
        <span class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl" :class="option.iconClass">
          <AppIcon :name="option.icon" class="h-5 w-5" />
        </span>
        <span class="flex-1 font-semibold">{{ option.label }}</span>
        <span
          class="flex h-6 w-6 shrink-0 items-center justify-center rounded-full ring-2 ring-inset"
          :class="
            store.selectedCloudStorage === option.value
              ? 'bg-primary-600 text-white ring-primary-600'
              : 'ring-stone-300 dark:ring-stone-600'
          "
        >
          <AppIcon v-if="store.selectedCloudStorage === option.value" name="check" class="h-4 w-4" />
        </span>
      </button>
    </div>

    <GoogleDriveLogin v-if="store.selectedCloudStorage === 'google-drive'" />
    <DropboxLogin v-if="store.selectedCloudStorage === 'dropbox'" />
    <GitHubArtifact v-if="store.selectedCloudStorage === 'github-artifact'" />
  </div>
</template>

<script setup lang="ts">
import type { IconName } from './AppIcon.vue';
import GoogleDriveLogin from './cloud-storage/GoogleDriveLogin.vue';
import DropboxLogin from './cloud-storage/DropboxLogin.vue';
import GitHubArtifact from './cloud-storage/GitHubArtifact.vue';

const store = useBuilderStore();
const { t } = useI18n();

const options = computed<
  { value: 'google-drive' | 'dropbox' | 'github-artifact'; label: string; icon: IconName; iconClass: string }[]
>(() => [
  {
    value: 'google-drive',
    label: t('google_drive'),
    icon: 'google',
    iconClass: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300',
  },
  {
    value: 'dropbox',
    label: t('dropbox'),
    icon: 'dropbox',
    iconClass: 'bg-primary-100 text-primary-700 dark:bg-primary-900/50 dark:text-primary-300',
  },
  {
    value: 'github-artifact',
    label: t('github_artifact'),
    icon: 'github',
    iconClass: 'bg-stone-200 text-stone-800 dark:bg-stone-700 dark:text-stone-100',
  },
]);
</script>
