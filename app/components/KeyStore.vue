<template>
  <div class="flex flex-col gap-3">
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

        <div class="flex gap-2 mt-1">
          <button
            :disabled="!store.keyStore.password || verifying"
            class="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
            @click="runVerify"
          >
            {{ verifying ? $t('verifying') + '…' : $t('verify_keystore') }}
          </button>
          <button
            class="px-4 py-2 bg-gray-100 border border-gray-300 rounded-lg hover:bg-gray-200"
            :title="$t('download_keystore')"
            @click="doDownload"
          >
            ⬇
          </button>
        </div>

        <!-- Verification result -->
        <div v-if="verifyResult" :class="['rounded-md px-3 py-2 text-sm', verifyResult.valid ? 'bg-green-50 text-green-800 border border-green-300' : 'bg-red-50 text-red-800 border border-red-300']">
          <template v-if="verifyResult.valid">
            <p class="font-semibold">✓ {{ $t('keystore_valid') }}
              <span class="font-normal text-xs ml-1">({{ verifyResult.format?.toUpperCase() }})</span>
            </p>
            <p v-if="verifyResult.aliases?.length" class="mt-1 text-xs">
              {{ $t('detected_aliases') }}: {{ verifyResult.aliases.join(', ') }}
            </p>
            <template v-if="store.keyStore.keyAlias">
              <p v-if="verifyResult.keyAliasFound === false" class="mt-1">⚠ {{ $t('alias_not_found') }}</p>
              <template v-else-if="verifyResult.keyAliasFound">
                <p v-if="verifyResult.keyPasswordCheckUnsupported" class="mt-1 text-xs text-gray-500">
                  ⓘ {{ $t('key_password_check_unsupported_jks') }}
                </p>
                <p v-else-if="verifyResult.keyPasswordOk === false" class="mt-1">⚠ {{ $t('wrong_key_password') }}</p>
                <p v-else-if="verifyResult.keyPasswordOk === true" class="mt-1">✓ {{ $t('key_password_valid') }}</p>
              </template>
            </template>
          </template>
          <template v-else>
            <p class="font-semibold">✗ {{ verifyErrorMsg }}</p>
          </template>
        </div>
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
        class="px-4 py-2 bg-blue-600 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
        @click="doCreate"
      >
        {{ creating ? $t('creating_keystore') + '…' : $t('create_and_download_keystore') }}
      </button>
    </template>
  </div>
</template>

<script setup lang="ts">
import { verifyKeyStore, createKeyStore, downloadKeyStore, type VerifyResult } from '~/composables/useKeyStoreOps';

defineEmits<{ (event: 'continue'): void }>();

const { t } = useI18n();
const store = useBuilderStore();

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
const verifyResult = ref<VerifyResult | null>(null);
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

    // Persist in store and offer download
    store.keyStore.content = b64;
    store.keyStore.password = createForm.password;
    store.keyStore.keyAlias = createForm.keyAlias.trim();
    store.keyStore.keyPassword = createForm.keyPassword;

    downloadKeyStore(b64);
    mode.value = 'upload';
  } catch (e: any) {
    createError.value = e?.message ?? t('create_keystore_failed');
  } finally {
    creating.value = false;
  }
}
</script>
