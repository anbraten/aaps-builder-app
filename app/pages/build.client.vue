<template>
  <div class="space-y-4">
    <!-- Stepper -->
    <nav :aria-label="$t('build')">
      <ol class="flex items-start">
        <li v-for="(step, i) in store.steps" :key="i" class="relative flex flex-1 flex-col items-center">
          <!-- connector line to the previous step -->
          <div
            v-if="i > 0"
            class="absolute right-1/2 top-5 h-0.5 w-full -translate-y-1/2"
            :class="i <= currentStepId ? 'bg-primary-600' : 'bg-stone-300 dark:bg-stone-700'"
            aria-hidden="true"
          />
          <button
            type="button"
            class="relative z-10 flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold ring-4 ring-stone-100 transition-colors dark:ring-stone-950"
            :class="stepClass(step, i)"
            :aria-current="i === currentStepId ? 'step' : undefined"
            :aria-label="`${i + 1}. ${step.name}`"
            @click="currentStepId = i"
          >
            <AppIcon v-if="step.isDone && i !== currentStepId" name="check" class="h-5 w-5" />
            <span v-else>{{ i + 1 }}</span>
          </button>
          <span
            class="mt-1.5 hidden px-1 text-center text-xs font-medium leading-tight sm:block"
            :class="i === currentStepId ? 'text-primary-600 dark:text-primary-400' : 'text-stone-500'"
          >
            {{ step.name }}
          </span>
        </li>
      </ol>
    </nav>

    <!-- Main content -->
    <Transition name="fade" mode="out-in">
      <section v-if="currentStep" :key="currentStepId" class="card">
        <p class="text-sm font-semibold text-primary-600 dark:text-primary-400">
          {{ currentStepId + 1 }} / {{ store.steps.length }} · {{ currentStep.name }}
        </p>
        <h2 class="mb-4 mt-1 text-xl font-bold tracking-tight">{{ currentStep.title }}</h2>
        <component :is="currentStep.component" @continue="nextStep" />
      </section>
    </Transition>

    <!-- Bottom navigation, sticks to the bottom of the screen within thumb reach -->
    <div
      class="sticky bottom-0 z-20 -mx-4 bg-linear-to-t from-stone-100 from-60% px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-6 dark:from-stone-950"
    >
      <div class="flex gap-3">
        <button type="button" class="btn btn-secondary px-4" @click="prevStep">
          <AppIcon name="chevron-left" class="h-5 w-5" />
          <span>{{ $t('back') }}</span>
        </button>
        <button
          v-if="!isLastStep"
          type="button"
          class="btn btn-primary flex-1"
          :disabled="!currentStep?.isDone"
          @click="nextStep"
        >
          <span>{{ $t('continue') }}</span>
          <AppIcon name="chevron-right" class="h-5 w-5" />
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const store = useBuilderStore();
const router = useRouter();

// wait for the store to be initialized
await store.refreshStatus();

const currentStepId = ref(store.steps.findIndex((step) => step.isDone === false));

// the GitHub session got lost (expired / revoked), send the user back to the login step
watch(
  () => store.status?.githubToken,
  (hasToken) => {
    if (hasToken === false) {
      currentStepId.value = 0;
    }
  },
);

const currentStep = computed(() => store.steps[currentStepId.value]);
const isLastStep = computed(() => currentStepId.value === store.steps.length - 1);

function stepClass(step: { isDone: boolean }, i: number) {
  if (i === currentStepId.value) {
    return 'bg-primary-600 text-white shadow-md shadow-primary-500/30';
  }
  if (step.isDone) {
    return 'bg-emerald-600 text-white';
  }
  return 'bg-white text-stone-500 ring-1 ring-inset ring-stone-300 dark:bg-stone-800 dark:text-stone-400';
}

function scrollToTop() {
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function nextStep() {
  if (currentStepId.value < store.steps.length - 1) {
    currentStepId.value++;
    scrollToTop();
  }
}

function prevStep() {
  if (currentStepId.value > 0) {
    currentStepId.value--;
    scrollToTop();
  } else {
    router.push('/');
  }
}
</script>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition:
    opacity 0.2s ease,
    transform 0.2s ease;
}

.fade-enter-from {
  opacity: 0;
  transform: translateY(6px);
}

.fade-leave-to {
  opacity: 0;
}
</style>
