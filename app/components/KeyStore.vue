<template>
  <div class="flex flex-col gap-3">

    <!-- ── DONE ── -->
    <template v-if="phase === 'done'">
      <!-- File row: name + download + remove -->
      <div class="flex items-center gap-2 rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-sm">
        <svg class="w-4 h-4 text-gray-400 shrink-0" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        <span class="flex-1 truncate text-gray-700">{{ fileName }}</span>
        <button class="text-gray-400 hover:text-blue-600" :title="$t('download_keystore')" @click="doDownload">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
        </button>
        <button class="text-gray-400 hover:text-red-500" :title="$t('remove_keystore')" @click="remove">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      </div>
      <div class="flex items-center justify-center gap-2 text-green-600">
        <svg class="w-5 h-5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
          <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
        </svg>
        <span class="font-medium">{{ $t('keystore_configured') }}</span>
      </div>
    </template>

    <!-- ── PICK ── nothing loaded yet, just two entry points -->
    <template v-else-if="phase === 'pick'">
      <p class="text-gray-600">{{ $t('a_key_store_is_required') }}</p>
      <button class="px-4 py-2 bg-blue-600 text-white rounded-lg w-full" @click="fileInput?.click()">
        {{ $t('upload_keystore') }}
      </button>
      <input ref="fileInput" type="file" accept=".jks,.keystore,.p12,.pfx" class="hidden" @change="onFile" />
      <button class="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg w-full hover:border-blue-400 hover:text-blue-600" @click="phase = 'create'">
        {{ $t('create_keystore') }}
      </button>
    </template>

    <!-- ── CREATE ── form to generate a new keystore -->
    <template v-else-if="phase === 'create'">
      <p class="text-sm text-gray-500">{{ $t('create_keystore_description') }}</p>

      <input v-model="createForm.password" type="password" :placeholder="$t('keystore_password')" class="border border-gray-400 rounded-md px-2 py-1" />
      <input v-model="createForm.keyAlias" type="text" :placeholder="$t('key_alias')" class="mt-1 border border-gray-400 rounded-md px-2 py-1" />
      <input v-model="createForm.keyPassword" type="password" :placeholder="$t('key_password')" class="border border-gray-400 rounded-md px-2 py-1" />

      <details class="text-sm">
        <summary class="cursor-pointer text-gray-500 hover:text-gray-700 select-none">{{ $t('advanced_options') }}</summary>
        <div class="flex flex-col gap-2 mt-2">
          <input v-model="createForm.commonName" type="text" :placeholder="$t('common_name')" class="border border-gray-400 rounded-md px-2 py-1" />
          <input v-model="createForm.organization" type="text" :placeholder="$t('organization')" class="border border-gray-400 rounded-md px-2 py-1" />
          <input v-model="createForm.country" type="text" maxlength="2" :placeholder="$t('country_code')" class="border border-gray-400 rounded-md px-2 py-1" />
        </div>
      </details>

      <p v-if="createError" class="text-red-600 text-sm">{{ createError }}</p>

      <button :disabled="!canCreate || creating" class="px-4 py-2 bg-blue-600 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed w-full" @click="doCreate">
        {{ creating ? $t('creating_keystore') + '…' : $t('create_and_download_keystore') }}
      </button>
    </template>

    <!-- ── LOADED ── keystore present, fill credentials & verify -->
    <template v-else-if="phase === 'loaded'">
      <!-- File row: name + download + remove -->
      <div class="flex items-center gap-2 rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-sm">
        <svg class="w-4 h-4 text-gray-400 shrink-0" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        <span class="flex-1 truncate text-gray-700">{{ fileName }}</span>
        <button class="text-gray-400 hover:text-blue-600" :title="$t('download_keystore')" @click="doDownload">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
        </button>
        <button class="text-gray-400 hover:text-red-500" :title="$t('remove_keystore')" @click="remove">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
    </div>

      <input
        v-model="store.keyStore.password"
        type="password"
        :placeholder="$t('keystore_password')"
        class="border border-gray-400 rounded-md px-2 py-1"
        @input="resetVerify"
      />
      <input
        v-model="store.keyStore.keyAlias"
        type="text"
        :placeholder="$t('key_alias')"
        class="border border-gray-400 rounded-md px-2 py-1"
        @input="resetVerify"
      />
      <input
        v-model="store.keyStore.keyPassword"
        type="password"
        :placeholder="$t('key_password')"
        class="border border-gray-400 rounded-md px-2 py-1"
        @input="resetVerify"
      />

      <!-- Inline feedback -->
      <div v-if="verifyError" class="rounded-md px-3 py-2 text-sm bg-red-50 text-red-800 border border-red-300">
        {{ verifyError }}
        <span v-if="verifyAliasHint" class="block mt-1 text-xs">{{ $t('detected_aliases') }}: {{ verifyAliasHint }}</span>
      </div>

      <button
        :disabled="!store.keyStore.password || verifying"
        class="px-4 py-2 bg-blue-600 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed w-full"
        @click="runVerify"
      >
        {{ verifying ? $t('verifying') + '…' : $t('verify_keystore') }}
      </button>
    </template>

  </div>
</template>

<script setup lang="ts">
import { verifyKeyStore, createKeyStore, downloadKeyStore, type VerifyResult } from '~/composables/useKeyStoreOps';

const emit = defineEmits<{ (event: 'continue'): void }>();

const { t } = useI18n();
const store = useBuilderStore();

// ── Phase ─────────────────────────────────────────────────────────────────────
type Phase = 'pick' | 'create' | 'loaded' | 'done';

const allFieldsFilled = () =>
  !!store.keyStore.content &&
  !!store.keyStore.password &&
  !!store.keyStore.keyAlias &&
  !!store.keyStore.keyPassword;

const phase = ref<Phase>(
  allFieldsFilled() ? 'done' : store.keyStore.content ? 'loaded' : 'pick',
);

// ── Upload ────────────────────────────────────────────────────────────────────
const fileInput = ref<HTMLInputElement | null>(null);
const fileName = 'keystore.jks'; // Store doesn't track the original filename; show a generic label.

function onFile(event: Event) {
  const file = (event.target as HTMLInputElement).files?.[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (e) => {
    store.keyStore.content = (e.target?.result?.toString() ?? '').replace(/^data:.*?;base64,/i, '');
    resetVerify();
    phase.value = 'loaded';
  };
  reader.readAsDataURL(file);
}

// ── Verify ────────────────────────────────────────────────────────────────────
const verifying = ref(false);
const verifyError = ref('');
const verifyAliasHint = ref('');

function resetVerify() {
  verifyError.value = '';
  verifyAliasHint.value = '';
}

async function runVerify() {
  verifying.value = true;
  resetVerify();
  try {
    const result = await verifyKeyStore(
      store.keyStore.content,
      store.keyStore.password,
      store.keyStore.keyAlias || undefined,
      store.keyStore.keyPassword || undefined,
    );

    if (!result.valid) {
      if (result.error === 'wrong_store_password') verifyError.value = t('wrong_store_password');
      else if (result.error === 'unsupported_format') verifyError.value = t('unsupported_keystore_format');
      else verifyError.value = t('invalid_keystore_file');
      return;
    }

    if (result.keyAliasFound === false) {
      verifyError.value = t('alias_not_found');
      verifyAliasHint.value = result.aliases.join(', ') || '–';
      return;
    }

    if (result.keyPasswordOk === false) {
      verifyError.value = t('wrong_key_password');
      return;
    }

    // Success
    phase.value = 'done';
    emit('continue');
  } catch {
    verifyError.value = t('verification_failed');
  } finally {
    verifying.value = false;
  }
}

function doDownload() {
  if (store.keyStore.content) downloadKeyStore(store.keyStore.content);
}

// ── Create ────────────────────────────────────────────────────────────────────
const createForm = reactive({
  password: '',
  passwordConfirm: '',
  keyAlias: 'key0',
  keyPassword: '',
  commonName: '',
  organization: '',
  country: '',
});

const canCreate = computed(
  () =>
    createForm.password.length >= 6 &&
    createForm.keyAlias.trim().length > 0 &&
    createForm.keyPassword.length >= 6
);

const creating = ref(false);
const createError = ref('');

async function doCreate() {
  creating.value = true;
  createError.value = '';
  try {
    const b64 = await createKeyStore({
      storePassword: createForm.password,
      keyAlias: createForm.keyAlias.trim(),
      keyPassword: createForm.keyPassword,
      commonName: createForm.commonName || undefined,
      organization: createForm.organization || undefined,
      country: createForm.country || undefined,
    });

    store.keyStore.content = b64;
    store.keyStore.password = createForm.password;
    store.keyStore.keyAlias = createForm.keyAlias.trim();
    store.keyStore.keyPassword = createForm.keyPassword;

    downloadKeyStore(b64);

    phase.value = 'done';
    emit('continue');
  } catch (e: any) {
    createError.value = e?.message ?? t('create_keystore_failed');
  } finally {
    creating.value = false;
  }
}

function remove() {
  if (!confirm(t('confirm_remove'))) {
    return
  }

  store.keyStore.content = '';
  store.keyStore.password = '';
  store.keyStore.keyAlias = '';
  store.keyStore.keyPassword = '';
  resetVerify();
  phase.value = 'pick';
}
</script>
