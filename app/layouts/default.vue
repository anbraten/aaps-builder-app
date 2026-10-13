<template>
  <div class="flex min-h-dvh flex-col">
    <header
      class="sticky top-0 z-30 border-b border-stone-200/80 bg-white/85 pt-[env(safe-area-inset-top)] backdrop-blur-sm dark:border-stone-800 dark:bg-stone-900/85"
    >
      <div class="mx-auto flex h-14 max-w-xl items-center gap-3 px-4">
        <NuxtLink to="/" class="flex min-w-0 items-center gap-2 font-bold tracking-tight">
          <span class="text-xl" aria-hidden="true">🏗️</span>
          <span class="truncate text-base sm:text-lg">AndroidAPS Builder</span>
        </NuxtLink>

        <ClientOnly>
          <button class="btn-icon ml-auto" :aria-label="$t('toggle_theme')" :title="$t('toggle_theme')" @click="toggleTheme">
            <AppIcon :name="isDark ? 'sun' : 'moon'" class="h-5 w-5" />
          </button>
          <template #fallback>
            <span class="ml-auto h-11 w-11" />
          </template>
        </ClientOnly>

        <div
          class="flex shrink-0 rounded-full bg-stone-100 p-0.5 text-sm font-semibold dark:bg-stone-800"
          role="group"
          aria-label="Language"
        >
          <button
            v-for="l in locales"
            :key="l.code"
            class="h-9 min-w-11 rounded-full px-3 uppercase transition-colors"
            :class="
              locale === l.code
                ? 'bg-white text-stone-900 shadow-xs dark:bg-stone-600 dark:text-white'
                : 'text-stone-500 dark:text-stone-400'
            "
            :aria-pressed="locale === l.code"
            @click="setLocale(l.code)"
          >
            {{ l.code }}
          </button>
        </div>
      </div>
    </header>

    <main class="mx-auto w-full max-w-xl flex-1 px-4 pt-4 sm:pt-8">
      <slot />
    </main>

    <footer class="px-4 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-6 text-center text-sm text-stone-500">
      <NuxtLink to="/features" class="inline-flex min-h-11 items-center gap-1 rounded-full px-3">
        {{ $t('built_with') }} <span aria-hidden="true">❤️</span>
        <code class="text-xs">{{ shortSha }}</code>
      </NuxtLink>
    </footer>
  </div>
</template>

<script setup>
const { setLocale, locale, locales } = useI18n();
const shortSha = String(useRuntimeConfig().public.sentry.release).slice(0, 7);

// initial theme class is set by an inline script in nuxt.config.ts
const isDark = ref(import.meta.client && document.documentElement.classList.contains('dark'));

function toggleTheme() {
  isDark.value = !isDark.value;
  document.documentElement.classList.toggle('dark', isDark.value);
  try {
    localStorage.setItem('theme', isDark.value ? 'dark' : 'light');
  } catch {}
}
</script>
