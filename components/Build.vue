<template>
  <!-- Progress bar -->
  <div class="mb-8">
    <div class="flex justify-between mb-2">
      <button
        v-for="(step, i) in steps"
        :key="i"
        class="text-sm font-medium"
        :class="currentStep >= i ? 'text-blue-600' : 'text-gray-500'"
        @click="currentStep = i"
      >
        {{ i + 1 }}. {{ step }}
      </button>
    </div>
    <div class="h-2 bg-gray-200 rounded-full">
      <div
        class="h-2 bg-blue-600 rounded-full transition-all duration-500"
        :style="{ width: `${currentStep * 33.33}%` }"
      ></div>
    </div>
  </div>

  <!-- Main content -->
  <div class="bg-white rounded-lg shadow-md p-6">
    <TransitionGroup name="fade" mode="out-in">
      <!-- Step 1: GitHub -->
      <div v-if="currentStep === 0" key="github" class="space-y-4">
        <h2 class="text-lg font-semibold">Connect to GitHub</h2>
        <p class="text-gray-600 text-sm mb-4">First, let's connect your GitHub account to access your repositories.</p>
        <GitHubLogin @success="nextStep" />
      </div>

      <!-- Step 2: Repository -->
      <div v-if="currentStep === 1" key="repo" class="space-y-4">
        <h2 class="text-lg font-semibold">Select Repository</h2>
        <p class="text-gray-600 text-sm mb-4">Choose the Android repository you want to build.</p>
        <RepoSelector @selected="nextStep" />
        <button @click="prevStep" class="mt-4 text-sm text-gray-600 hover:text-gray-800">← Back</button>
      </div>

      <!-- Step 3: Google Drive -->
      <div v-if="currentStep === 2" key="google" class="space-y-4">
        <h2 class="text-lg font-semibold">Connect Google Drive</h2>
        <p class="text-gray-600 text-sm mb-4">Connect your Google Drive to store the build artifacts.</p>
        <GoogleDriveLogin @success="nextStep" />
        <button @click="prevStep" class="mt-4 text-sm text-gray-600 hover:text-gray-800">← Back</button>
      </div>

      <!-- Step 4: Build -->
      <div v-if="currentStep === 3" key="build" class="space-y-4">
        <h2 class="text-lg font-semibold">Start Build</h2>
        <p class="text-gray-600 text-sm mb-4">Everything is ready to go. Let's build your app!</p>
        <WorkflowTrigger />
        <button @click="prevStep" class="flex mt-4 text-sm text-gray-600 hover:text-gray-800 justify-center">
          ← Back
        </button>
      </div>
    </TransitionGroup>
  </div>
</template>

<script setup lang="ts">
import { useStorage } from '@vueuse/core';

const currentStep = useStorage(`aaps_builder.current_step`, 0);

const steps = ref([
  'GitHub',
  'Repository',
  // TODO: allow to upload key-store and credentials
  'Cloud Storage',
  'Build',
]);

function nextStep() {
  if (currentStep.value < steps.value.length - 1) {
    currentStep.value++;
  }
}

const prevStep = () => {
  if (currentStep.value > 0) {
    currentStep.value--;
  }
};
</script>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
