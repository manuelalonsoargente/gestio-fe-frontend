<script setup lang="ts">
withDefaults(
  defineProps<{
    message?: string
    icon?: string
    hint?: string
  }>(),
  {
    message: 'No hi ha dades.',
    icon: 'pi pi-inbox',
    hint: undefined,
  },
)
</script>

<template>
  <div class="flex flex-col items-center gap-3 py-8 text-slate-500">
    <div class="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100">
      <i :class="[icon, 'text-xl text-slate-400']" />
    </div>
    <div class="text-center">
      <p class="text-sm font-medium text-slate-600">{{ message }}</p>
      <p v-if="hint" class="mt-0.5 text-xs text-slate-400">{{ hint }}</p>
    </div>
  </div>
</template>
