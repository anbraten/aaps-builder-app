<template>
  <div class="min-h-screen bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
    <div class="max-w-md mx-auto">
      <h1 class="text-2xl font-bold text-center mb-8">Build AAPS</h1>

      <ClientOnly>
        <Build />
      </ClientOnly>
    </div>
  </div>
</template>

<script setup lang="ts"></script>
