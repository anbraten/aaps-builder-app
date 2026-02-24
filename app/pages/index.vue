<template>
  <div class="bg-white rounded-lg shadow-md p-6">
    <i18n-t keypath="this_app_helps_you_to_build" tag="p">
      <a href="https://androidaps.readthedocs.io/en/latest/" target="_blank" class="underline">AndroidAPS (AAPS)</a>
    </i18n-t>

    <p class="text-red-500 my-2">{{ $t('please_make_sure_that_you') }}</p>
    <i18n-t keypath="the_is_a_great_place_to" tag="p">
      <a href="https://wiki.aaps.app/" target="_blank" class="underline">{{ $t('documentation') }}</a>
    </i18n-t>

    <div class="mt-4 mb-2">
      <input v-model="confirmed" type="checkbox" id="agree" />
      <label for="agree" class="ml-2">
        {{ $t('i_have_read_the_aaps') }}
      </label>
    </div>

    <router-link
      :to="confirmed ? '/build' : ''"
      class="w-full text-white px-4 py-2 rounded-lg transition-colors flex items-center justify-center space-x-2"
      :class="{
        'bg-green-500 hover:bg-green-600': confirmed,
        'bg-gray-400 cursor-not-allowed': !confirmed,
      }"
    >
      <span>{{ $t('start_build') }}</span>
    </router-link>
  </div>
</template>

<script setup lang="ts">
const confirmed = ref(false);
</script>
