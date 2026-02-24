<template>
  <div class="flex flex-col gap-3">
    <!-- ── Done state ── mirrors GitHubLogin "Connected" -->
    <template v-if="isDone">
      <div class="flex items-center justify-center space-x-2 text-green-600">
        <svg class="w-5 h-5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
          <path
            fill-rule="evenodd"
            d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
            clip-rule="evenodd"
          />
        </svg>
        <span class="font-medium">{{ $t('keystore_configured') }}</span>
      </div>
      <p class="text-center text-xs text-gray-500">
        {{ verifyResult?.format?.toUpperCase() }} · {{ $t('key_alias') }}: {{ store.keyStore.keyAlias }}
      </p>
      <div class="flex justify-center gap-4 text-sm">
        <button class="text-blue-600 hover:underline" @click="changeKeyStore">{{ $t('change_keystore') }}</button>
        <button class="text-gray-500 hover:underline" @click="doDownload">{{ $t('download_keystore') }}</button>
      </div>
    </template>

    <!-- ── Setup state ── -->
    <template v-else>
      <p class="text-gray-600">{{ $t('a_key_store_is_required') }}</p>

      <!-- Mode tabs -->
      <div class="flex gap-2">
        <button
          :class="['flex-1 px-3 py-2 rounded-lg border text-sm font-medium transition-colors', mode === 'upload' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-700 border-gray-300 hover:border-blue-400']"
          @click="mode = 'upload'"
        >
          {{ $t('upload_keystore') }}
        </button>
        <button
          :class="['flex-1 px-3 py-2 rounded-lg border text-sm font-medium transition-colors', mode === 'create' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-700 border-gray-300 hover:border-blue-400']"
          @click="mode = 'create'"
        >
          {{ $t('create_keystore') }}
        </button>
      </div>

      <!-- ── Upload / verify ── -->
      <template v-if="mode === 'upload'">
        <button class="px-4 py-2 bg-blue-600 text-white rounded-lg w-full" @click="fileInput?.click()">
          {{ store.keyStore.content ? $t('change_keystore') : $t('upload_keystore') }}
        </button>
        <input ref="fileInput" type="file" accept=".jks,.keystore,.p12,.pfx" class="hidden" @change="onFile" />

        <template v-if="store.keyStore.content">
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
            class="mt-2 border border-gray-400 rounded-md px-2 py-1"
            @input="resetVerify"
          />
          <input
            v-model="store.keyStore.keyPassword"
            type="password"
            :placeholder="$t('key_password')"
            class="border border-gray-400 rounded-md px-2 py-1"
            @input="resetVerify"
          />

          <!-- Error banner -->
          <div v-if="verifyResult && !verifyResult.valid" class="rounded-md px-3 py-2 text-sm bg-red-50 text-red-800 border border-red-300">
            <p class="font-semibold">✗ {{ verifyErrorMsg }}</p>
            <template v-if="verifyResult.keyAliasFound === false">
              <p class="mt-1 text-xs">{{ $t('detected_aliases') }}: {{ verifyResult.aliases.join(', ') || '–' }}</p>
            </template>
          </div>
          <!-- Key-password warning (valid store, but key issue) -->
          <div v-else-if="verifyResult?.valid && verifyResult.keyAliasFound === false" class="rounded-md px-3 py-2 text-sm bg-amber-50 text-amber-800 border border-amber-300">
            <p>⚠ {{ $t('alias_not_found') }}</p>
            <p class="mt-1 text-xs">{{ $t('detected_aliases') }}: {{ verifyResult.aliases.join(', ') || '–' }}</p>
          </div>
          <div v-else-if="verifyResult?.valid && verifyResult.keyPasswordOk === false" class="rounded-md px-3 py-2 text-sm bg-amber-50 text-amber-800 border border-amber-300">
            <p>⚠ {{ $t('wrong_key_password') }}</p>
          </div>

          <button
            :disabled="!store.keyStore.password || verifying"
            class="px-4 py-2 bg-blue-600 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed w-full"
            @click="runVerify"
          >
            {{ verifying ? $t('verifying') + '…' : $t('verify_keystore') }}
          </button>
        </template>
      </template>

      <!-- ── Create ── -->
      <template v-if="mode === 'create'">
        <p class="text-sm text-gray-500">{{ $t('create_keystore_description') }}</p>

        <input
          v-model="createForm.password"
          type="password"
          :placeholder="$t('keystore_password')"
          class="border border-gray-400 rounded-md px-2 py-1"
        />
        <input
          v-model="createForm.passwordConfirm"
          type="password"
          :placeholder="$t('confirm_password')"
          :class="['border rounded-md px-2 py-1', pwMismatch ? 'border-red-500' : 'border-gray-400']"
        />
        <p v-if="pwMismatch" class="text-red-500 text-xs -mt-1">{{ $t('passwords_do_not_match') }}</p>

        <input
          v-model="createForm.keyAlias"
          type="text"
          :placeholder="$t('key_alias')"
          class="mt-2 border border-gray-400 rounded-md px-2 py-1"
        />
        <input
          v-model="createForm.keyPassword"
          type="password"
          :placeholder="$t('key_password')"
          class="border border-gray-400 rounded-md px-2 py-1"
        />

        <details class="text-sm">
          <summary class="cursor-pointer text-gray-500 hover:text-gray-700 select-none">{{ $t('advanced_options') }}</summary>
          <div class="flex flex-col gap-2 mt-2">
            <input v-model="createForm.commonName" type="text" :placeholder="$t('common_name')" class="border border-gray-400 rounded-md px-2 py-1" />
            <input v-model="createForm.organization" type="text" :placeholder="$t('organization')" class="border border-gray-400 rounded-md px-2 py-1" />
            <input v-model="createForm.country" type="text" maxlength="2" :placeholder="$t('country_code')" class="border border-gray-400 rounded-md px-2 py-1" />
          </div>
        </details>

        <p v-if="createError" class="text-red-600 text-sm">{{ createError }}</p>

        <button
          :disabled="!canCreate || creating"
          class="px-4 py-2 bg-blue-600 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed w-full"
          @click="doCreate"
        >
          {{ creating ? $t('creating_keystore') + '…' : $t('create_and_download_keystore') }}
        </button>
      </template>
    </template>
  </div>
</template>

<script setup lang="ts">
import { verifyKeyStore, createKeyStore, downloadKeyStore, type VerifyResult } from '~/composables/useKeyStoreOps';

const emit = defineEmits<{ (event: 'continue'): void }>();

const { t } = useI18n();
const store = useBuilderStore();

// ── Done state ────────────────────────────────────────────────────────────────
const verifyResult = ref<VerifyResult | null>(null);

// A keystore is "done" when it has been verified successfully in this session,
// or was already fully configured from a previous session.
const isDone = computed(() => verifyResult.value?.valid === true);

function changeKeyStore() {
  verifyResult.value = null;
  verifyErrorMsg.value = '';
}

// ── Mode ──────────────────────────────────────────────────────────────────────
const mode = ref<'upload' | 'create'>('upload');

// ── Upload ────────────────────────────────────────────────────────────────────
const fileInput = ref<HTMLInputElement | null>(null);

function onFile(event: Event) {
  const file = (event.target as HTMLInputElement).files?.[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (e) => {
    const raw = e.target?.result?.toString() ?? '';
    store.keyStore.content = raw.replace(/^data:.*?;base64,/i, '');
    resetVerify();
  };
  reader.readAsDataURL(file);
}

// ── Verify ────────────────────────────────────────────────────────────────────
const verifying = ref(false);
const verifyErrorMsg = ref('');

function resetVerify() {
  verifyResult.value = null;
  verifyErrorMsg.value = '';
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
    verifyResult.value = result;
    if (!result.valid) {
      if (result.error === 'wrong_store_password') verifyErrorMsg.value = t('wrong_store_password');
      else if (result.error === 'unsupported_format') verifyErrorMsg.value = t('unsupported_keystore_format');
      else verifyErrorMsg.value = t('invalid_keystore_file');
    } else if (result.keyPasswordOk !== false && result.keyAliasFound !== false) {
      // Fully valid — advance to the next step
      emit('continue');
    }
  } catch {
    verifyResult.value = { valid: false, format: 'unknown', aliases: [] };
    verifyErrorMsg.value = t('verification_failed');
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

const pwMismatch = computed(
  () => createForm.passwordConfirm !== '' && createForm.password !== createForm.passwordConfirm,
);

const canCreate = computed(
  () =>
    createForm.password.length >= 6 &&
    createForm.keyAlias.trim().length > 0 &&
    createForm.keyPassword.length >= 6 &&
    !pwMismatch.value,
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

    // Mark as verified and advance
    verifyResult.value = { valid: true, format: 'pkcs12', aliases: [createForm.keyAlias.trim()], storePasswordOk: true };
    emit('continue');
  } catch (e: any) {
    createError.value = e?.message ?? t('create_keystore_failed');
  } finally {
    creating.value = false;
  }
}
</script>
