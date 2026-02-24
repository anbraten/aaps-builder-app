<template>
  <div class="min-h-screen bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
    <div class="max-w-md mx-auto">
      <div class="flex gap-2 items-center mb-8">
        <router-link to="/">
          <h1 class="text-2xl font-bold text-center">🏗️ AndroidAPS Builder</h1>
        </router-link>

        <div class="ml-auto bg-gray-300 rounded-md">
          <button
            v-for="l in locales"
            :key="l.code"
            class="rounded-md px-2 py-1"
            :class="{
              'bg-blue-600': locale === l.code,
            }"
            @click="setLocale(l.code)"
          >
            {{ l.code === 'en' ? '🇬🇧' : '🇩🇪' }}
          </button>
        </div>
      </div>

      <slot />
    </div>
  </div>
</template>

<script setup>
const { setLocale, locale, locales } = useI18n();
</script>
