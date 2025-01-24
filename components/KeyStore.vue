<template>
  <div class="flex flex-col gap-2">
    <input type="file" accept=".jks" @change="selectFile" />

    <template v-if="store.keyStore.content">
      <input
        v-model="store.keyStore.password"
        type="password"
        placeholder="KeyStore password"
        class="border border-gray-400 rounded-md px-2 py-1"
      />

      <input
        v-model="store.keyStore.keyAlias"
        type="text"
        placeholder="Key alias"
        class="mt-4 border border-gray-400 rounded-md px-2 py-1"
      />
      <input
        v-model="store.keyStore.keyPassword"
        type="password"
        placeholder="Key password"
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
</script>
