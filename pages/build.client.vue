<template>
  <div class="min-h-screen bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
    <div class="max-w-xl mx-auto">
      <router-link to="/">
        <h1 class="text-2xl font-bold text-center mb-8">Build AndroidAPS</h1>
      </router-link>

      <!-- Progress bar -->
      <div class="mb-8">
        <div class="flex justify-between gap-2 mb-2">
          <div
            v-for="(step, i) in store.steps"
            :key="i"
            :style="{
              width: `${100 / store.steps.length}%`,
            }"
            class="flex justify-center"
          >
            <button
              class="text-sm font-medium flex flex-col items-center"
              :class="currentStepId >= i ? 'text-blue-600' : 'text-gray-500'"
              @click="currentStepId = i"
            >
              <span>{{ i + 1 }}. {{ step.name }}</span>
              <div v-if="step.isDone" class="text-green-600 ml-1">
                <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fill-rule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clip-rule="evenodd"
                  />
                </svg>
              </div>
            </button>
          </div>
        </div>
        <div class="h-2 bg-gray-200 rounded-full">
          <div
            class="h-2 bg-blue-600 rounded-full transition-all duration-500"
            :style="{ width: `${Math.min((currentStepId + 0.5) * (100 / store.steps.length), 100)}%` }"
          ></div>
        </div>
      </div>

      <!-- Main content -->
      <div class="bg-white rounded-lg shadow-md p-6">
        <TransitionGroup name="fade" mode="out-in">
          <div v-if="currentStep" class="space-y-4">
            <h2 class="text-lg font-semibold">{{ currentStep.title }}</h2>
            <p class="text-gray-600 text-sm mb-4">{{ currentStep.description }}</p>
            <component :is="currentStep.component" @continue="nextStep" />

            <div class="flex w-full justify-between gap-2">
              <button @click="prevStep" class="mt-4 text-sm text-gray-600 hover:text-gray-800">← Back</button>
              <button
                v-if="currentStep.isDone"
                @click="nextStep"
                class="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors mt-4"
              >
                Continue →
              </button>
            </div>
          </div>
        </TransitionGroup>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const store = useBuilderStore();

const currentStepId = ref(store.steps.findIndex((step) => step.isDone === false));

const currentStep = computed(() => store.steps[currentStepId.value]);

function nextStep() {
  if (currentStepId.value < store.steps.length - 1) {
    // currentStepId.value = store.steps.findIndex((step) => step.isDone === false);
    currentStepId.value++;
  }
}

function prevStep() {
  if (currentStepId.value > 0) {
    currentStepId.value--;
  }
}
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
