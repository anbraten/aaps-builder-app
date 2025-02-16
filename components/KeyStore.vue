<template>
  <div class="flex flex-col gap-2">
    <p class="text-gray-600 mb-4">{{ $t('a_key_store_is_required') }}</p>

    <button class="px-4 py-2 bg-blue-600 text-white rounded-lg mx-auto w-full" @click="uploadKeyStore">
      {{ store.keyStore.content ? $t('change_keystore') : $t('upload_keystore') }}
    </button>
    <input ref="keyStoreFileInput" type="file" accept=".jks" class="hidden" @change="selectFile" />

    <template v-if="store.keyStore.content">
      <input
        v-model="store.keyStore.password"
        type="password"
        :placeholder="$t('keystore_password')"
        class="border border-gray-400 rounded-md px-2 py-1"
      />

      <input
        v-model="store.keyStore.keyAlias"
        type="text"
        :placeholder="$t('key_alias')"
        class="mt-4 border border-gray-400 rounded-md px-2 py-1"
      />
      <input
        v-model="store.keyStore.keyPassword"
        type="password"
        :placeholder="$t('key_password')"
        class="border border-gray-400 rounded-md px-2 py-1"
      />
    </template>
  </div>
</template>

<script setup lang="ts">
defineEmits<{
  (event: 'continue'): void;
}>();

const store = useBuilderStore();

async function selectFile(event: Event) {
  const target = event.target as HTMLInputElement;
  const file = target.files?.[0];
  if (!file) {
    console.error('No file selected');
    return;
  }

  const reader = new FileReader();
  reader.onload = (e) => {
    if (e.target?.result) {
      store.keyStore.content = e.target.result.toString().replace(/^data:application\/.*?;base64,/i, '');
    }
  };

  // Read the file as a Data URL (Base64 encoded)
  reader.readAsDataURL(file);
}

const keyStoreFileInput = ref<HTMLInputElement | null>(null);
async function uploadKeyStore() {
  if (!keyStoreFileInput.value) {
    throw new Error('keyStoreFileInput is not defined');
  }

  keyStoreFileInput.value.click();
}
</script>
