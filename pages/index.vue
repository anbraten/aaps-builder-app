<template>
  <div class="min-h-screen bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
    <div class="max-w-md mx-auto">
      <router-link to="/">
        <h1 class="text-2xl font-bold text-center mb-8">Build AndroidAPS</h1>
      </router-link>

      <div class="bg-white rounded-lg shadow-md p-6">
        <p>
          This app helps you to build
          <a href="https://androidaps.readthedocs.io/en/latest/" target="_blank" class="underline">AndroidAPS (AAPS)</a>
          using Github Workflows. It basically uses a computer in the internet to build the app. This creates the same
          APK file you would get on your local machine when using Android Studio.
        </p>

        <p class="text-red-500 my-2">
          Please make sure that YOU understand how AAPS works and what it does before building and using it!
        </p>
        <p>
          The <a href="https://wiki.aaps.app/" target="_blank" class="underline">documentation</a> is a great place to
          start learning about AAPS.
        </p>

        <div class="mt-4 mb-2">
          <input v-model="confirmed" type="checkbox" id="agree" />
          <label for="agree" class="ml-2">
            I have read the AAPS documentation and understand that I am doing everything at my own risk. Basically for
            educational purposes only.
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
          <span>Start Build</span>
        </router-link>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const confirmed = ref(false);
</script>
