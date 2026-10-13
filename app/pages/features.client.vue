<template>
  <div class="space-y-4">
    <section class="card">
      <h2 class="mb-2 text-xl font-bold tracking-tight">{{ $t('feature_flags') }}</h2>

      <ul class="divide-y divide-stone-200 dark:divide-stone-800">
        <li v-for="flag in flags" :key="flag.name">
          <label class="flex min-h-14 cursor-pointer items-center justify-between gap-4 py-2">
            <span class="font-medium">{{ flag.label }}</span>
            <button
              type="button"
              role="switch"
              :aria-checked="store.featureFlags[flag.name]"
              class="relative inline-flex h-8 w-14 shrink-0 items-center rounded-full transition-colors focus:outline-hidden focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2"
              :class="store.featureFlags[flag.name] ? 'bg-emerald-600' : 'bg-stone-300 dark:bg-stone-700'"
              @click="store.featureFlags[flag.name] = !store.featureFlags[flag.name]"
            >
              <span
                class="inline-block h-6 w-6 rounded-full bg-white shadow-sm transition-transform"
                :class="store.featureFlags[flag.name] ? 'translate-x-7' : 'translate-x-1'"
              />
            </button>
          </label>
        </li>
      </ul>
    </section>

    <a :href="repoUrl" target="_blank" class="btn btn-secondary w-full">
      <AppIcon name="github" class="h-5 w-5" />
      {{ $t('view_on_github') }}
      <AppIcon name="external" class="h-4 w-4 opacity-70" />
    </a>
  </div>
</template>

<script setup lang="ts">
const store = useBuilderStore();
const { t } = useI18n();

const repoUrl = 'https://github.com/anbraten/aaps-builder-app';

const flags = computed<{ name: FeatureFlag; label: string }[]>(() => [
  { name: 'aaps_version', label: t('feature_aaps_version') },
]);
</script>
