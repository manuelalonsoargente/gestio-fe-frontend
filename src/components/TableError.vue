<script setup lang="ts">
import Button from 'primevue/button'

defineProps<{ message: string }>()
defineEmits<{ retry: [] }>()
</script>

<template>
  <div class="flex flex-col items-center gap-3 rounded-2xl border border-red-200 bg-red-50 p-6 text-center">
    <i class="pi pi-exclamation-triangle text-2xl text-red-500" />
    <p class="text-sm text-red-700">{{ message }}</p>
    <Button severity="danger" outlined @click="$emit('retry')">
      <i class="pi pi-refresh" />
      <span>Torna-ho a provar</span>
    </Button>
  </div>
</template>
