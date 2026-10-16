<script setup lang="ts">
withDefaults(
  defineProps<{
    message?: string
    icon?: string
  }>(),
  {
    message: 'No hi ha dades.',
    icon: 'pi pi-inbox',
  },
)
</script>

<template>
  <div class="flex flex-col items-center gap-2 py-6 text-slate-500">
    <i :class="[icon, 'text-3xl text-slate-300']" />
    <span>{{ message }}</span>
  </div>
</template>
