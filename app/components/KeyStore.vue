<template>
  <div class="flex flex-col gap-4">
    <input ref="fileInput" type="file" accept=".jks,.keystore,.p12,.pfx" class="hidden" @change="onFile" />

    <!-- File row: shown once a keystore is loaded -->
    <div
      v-if="phase === 'loaded' || phase === 'done'"
      class="flex items-center gap-3 rounded-2xl bg-stone-50 py-1.5 pl-4 pr-1.5 ring-1 ring-inset ring-stone-200 dark:bg-stone-800 dark:ring-stone-700"
    >
      <AppIcon name="key" class="h-5 w-5 shrink-0 text-stone-400" />
      <span class="flex-1 truncate font-medium">{{ fileName }}</span>
      <button
        type="button"
        class="btn-icon"
        :title="$t('download_keystore')"
        :aria-label="$t('download_keystore')"
        @click="doDownload"
      >
        <AppIcon name="download" class="h-5 w-5" />
      </button>
      <button
        type="button"
        class="btn-icon hover:text-red-600 dark:hover:text-red-400"
        :title="$t('remove_keystore')"
        :aria-label="$t('remove_keystore')"
        @click="remove"
      >
        <AppIcon name="trash" class="h-5 w-5" />
      </button>
    </div>

    <!-- ── DONE ── -->
    <div v-if="phase === 'done'" class="status-ok">
      <AppIcon name="check-circle" class="h-6 w-6 shrink-0" />
      <span>{{ $t('keystore_configured') }}</span>
    </div>

    <!-- ── PICK ── nothing loaded yet, just two entry points -->
    <template v-else-if="phase === 'pick'">
      <p class="text-muted">{{ $t('a_key_store_is_required') }}</p>
      <button type="button" class="btn btn-primary w-full" @click="fileInput?.click()">
        <AppIcon name="upload" class="h-5 w-5" />
        {{ $t('upload_keystore') }}
      </button>
      <button type="button" class="btn btn-secondary w-full" @click="phase = 'create'">
        <AppIcon name="plus" class="h-5 w-5" />
        {{ $t('create_keystore') }}
      </button>
    </template>

    <!-- ── CREATE ── form to generate a new keystore -->
    <form
      v-else-if="phase === 'create'"
      class="flex flex-col gap-4"
      @submit.prevent="canCreate && !creating && doCreate()"
    >
      <p class="alert alert-info">{{ $t('create_keystore_description') }}</p>

      <div>
        <label for="create-password" class="label">{{ $t('keystore_password') }}</label>
        <input
          id="create-password"
          v-model="createForm.password"
          type="password"
          autocomplete="new-password"
          minlength="6"
          class="input"
        />
      </div>
      <div>
        <label for="create-alias" class="label">{{ $t('key_alias') }}</label>
        <input
          id="create-alias"
          v-model="createForm.keyAlias"
          type="text"
          autocapitalize="off"
          autocomplete="off"
          class="input"
        />
      </div>
      <div>
        <label for="create-key-password" class="label">{{ $t('key_password') }}</label>
        <input
          id="create-key-password"
          v-model="createForm.keyPassword"
          type="password"
          autocomplete="new-password"
          minlength="6"
          class="input"
        />
      </div>

      <details class="group rounded-2xl ring-1 ring-inset ring-stone-200 dark:ring-stone-700">
        <summary
          class="flex min-h-12 cursor-pointer select-none list-none items-center justify-between px-4 font-medium text-stone-600 dark:text-stone-300 [&::-webkit-details-marker]:hidden"
        >
          {{ $t('advanced_options') }}
          <AppIcon name="chevron-down" class="h-5 w-5 transition-transform group-open:rotate-180" />
        </summary>
        <div class="flex flex-col gap-4 px-4 pb-4">
          <div>
            <label for="create-cn" class="label">{{ $t('common_name') }}</label>
            <input id="create-cn" v-model="createForm.commonName" type="text" autocomplete="name" class="input" />
          </div>
          <div>
            <label for="create-org" class="label">{{ $t('organization') }}</label>
            <input
              id="create-org"
              v-model="createForm.organization"
              type="text"
              autocomplete="organization"
              class="input"
            />
          </div>
          <div>
            <label for="create-country" class="label">{{ $t('country_code') }}</label>
            <input
              id="create-country"
              v-model="createForm.country"
              type="text"
              maxlength="2"
              autocapitalize="characters"
              autocomplete="country"
              class="input uppercase"
            />
          </div>
        </div>
      </details>

      <p v-if="createError" class="alert alert-error">{{ createError }}</p>

      <button type="submit" :disabled="!canCreate || creating" class="btn btn-primary w-full">
        <AppIcon v-if="creating" name="spinner" class="h-5 w-5" />
        <AppIcon v-else name="download" class="h-5 w-5" />
        {{ creating ? $t('creating_keystore') + '…' : $t('create_and_download_keystore') }}
      </button>
      <button type="button" class="btn btn-ghost w-full" @click="fileInput?.click()">
        <AppIcon name="upload" class="h-5 w-5" />
        {{ $t('upload_keystore') }}
      </button>
    </form>

    <!-- ── LOADED ── keystore present, fill credentials & verify -->
    <form
      v-else-if="phase === 'loaded'"
      class="flex flex-col gap-4"
      @submit.prevent="store.keyStore.password && !verifying && runVerify()"
    >
      <div>
        <label for="ks-password" class="label">{{ $t('keystore_password') }}</label>
        <input
          id="ks-password"
          v-model="store.keyStore.password"
          type="password"
          autocomplete="off"
          class="input"
          @input="resetVerify"
        />
      </div>
      <div>
        <label for="ks-alias" class="label">{{ $t('key_alias') }}</label>
        <input
          id="ks-alias"
          v-model="store.keyStore.keyAlias"
          type="text"
          autocapitalize="off"
          autocomplete="off"
          class="input"
          @input="resetVerify"
        />
      </div>
      <div>
        <label for="ks-key-password" class="label">{{ $t('key_password') }}</label>
        <input
          id="ks-key-password"
          v-model="store.keyStore.keyPassword"
          type="password"
          autocomplete="off"
          class="input"
          @input="resetVerify"
        />
      </div>

      <!-- Inline feedback -->
      <div v-if="verifyError" class="alert alert-error">
        {{ verifyError }}
        <span v-if="verifyAliasHint" class="mt-1 block text-xs"
          >{{ $t('detected_aliases') }}: {{ verifyAliasHint }}</span
        >
      </div>

      <button type="submit" :disabled="!store.keyStore.password || verifying" class="btn btn-primary w-full">
        <AppIcon v-if="verifying" name="spinner" class="h-5 w-5" />
        <AppIcon v-else name="check-circle" class="h-5 w-5" />
        {{ verifying ? $t('verifying') + '…' : $t('verify_keystore') }}
      </button>
    </form>
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
  !!store.keyStore.content && !!store.keyStore.password && !!store.keyStore.keyAlias && !!store.keyStore.keyPassword;

const phase = ref<Phase>(allFieldsFilled() ? 'done' : store.keyStore.content ? 'loaded' : 'pick');

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
  () => createForm.password.length >= 6 && createForm.keyAlias.trim().length > 0 && createForm.keyPassword.length >= 6,
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
    return;
  }

  store.keyStore.content = '';
  store.keyStore.password = '';
  store.keyStore.keyAlias = '';
  store.keyStore.keyPassword = '';
  resetVerify();
  phase.value = 'pick';
}
</script>
