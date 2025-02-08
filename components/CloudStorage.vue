<template>
  <div>
    <p class="text-gray-600 mb-4">{{ $t('select_the_cloud_storage_where') }}</p>

    <div class="relative">
      <select v-model="store.selectedCloudStorage" class="w-full bg-white border border-gray-300 rounded-lg px-4 py-2">
        <option value="google-drive">{{ $t('google_drive') }}</option>
        <option value="dropbox">{{ $t('dropbox') }}</option>
        <option value="github-artifact">{{ $t('github_artifact') }}</option>
      </select>
    </div>

    <div class="mt-4">
      <GoogleDriveLogin v-if="store.selectedCloudStorage === 'google-drive'" />
      <DropboxLogin v-if="store.selectedCloudStorage === 'dropbox'" />
      <GitHubArtifact v-if="store.selectedCloudStorage === 'github-artifact'" />
    </div>
  </div>
</template>

<script setup lang="ts">
import GoogleDriveLogin from './cloud-storage/GoogleDriveLogin.vue';
import DropboxLogin from './cloud-storage/DropboxLogin.vue';
import GitHubArtifact from './cloud-storage/GitHubArtifact.vue';

const store = useBuilderStore();
</script>
