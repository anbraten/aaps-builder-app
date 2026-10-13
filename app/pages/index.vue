<template>
  <div class="space-y-4">
    <section class="card space-y-4">
      <div
        class="flex h-12 w-12 items-center justify-center rounded-2xl bg-linear-to-br from-primary-500 to-pink-500 text-white shadow-md shadow-primary-500/30"
      >
        <AppIcon name="rocket" class="h-6 w-6" />
      </div>

      <h2 class="text-2xl font-bold tracking-tight">{{ $t('start_build') }}</h2>

      <i18n-t keypath="this_app_helps_you_to_build" tag="p" class="text-muted leading-relaxed">
        <a href="https://androidaps.readthedocs.io/en/latest/" target="_blank" class="link">AndroidAPS (AAPS)</a>
      </i18n-t>

      <div class="alert alert-warning flex gap-3">
        <AppIcon name="warning" class="mt-0.5 h-5 w-5 shrink-0" />
        <div class="space-y-1">
          <p class="font-semibold">{{ $t('please_make_sure_that_you') }}</p>
          <i18n-t keypath="the_is_a_great_place_to" tag="p">
            <a href="https://wiki.aaps.app/" target="_blank" class="font-semibold underline">{{
              $t('documentation')
            }}</a>
          </i18n-t>
        </div>
      </div>

      <label
        for="agree"
        class="flex cursor-pointer items-start gap-3 rounded-2xl p-3 ring-1 ring-inset transition"
        :class="
          confirmed
            ? 'bg-primary-50 ring-primary-600 dark:bg-primary-950/50 dark:ring-primary-500'
            : 'ring-stone-300 dark:ring-stone-700'
        "
      >
        <input
          id="agree"
          v-model="confirmed"
          type="checkbox"
          class="mt-0.5 h-6 w-6 shrink-0 cursor-pointer rounded-sm accent-primary-600"
        />
        <span class="text-sm leading-relaxed">{{ $t('i_have_read_the_aaps') }}</span>
      </label>
    </section>

    <div
      class="sticky bottom-0 z-20 -mx-4 bg-linear-to-t from-stone-100 from-60% px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-6 dark:from-stone-950"
    >
      <NuxtLink v-if="confirmed" to="/build" class="btn btn-success w-full">
        {{ $t('start_build') }}
        <AppIcon name="chevron-right" class="h-5 w-5" />
      </NuxtLink>
      <button v-else type="button" disabled class="btn btn-success w-full">
        {{ $t('start_build') }}
        <AppIcon name="chevron-right" class="h-5 w-5" />
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
const confirmed = ref(false);
</script>
