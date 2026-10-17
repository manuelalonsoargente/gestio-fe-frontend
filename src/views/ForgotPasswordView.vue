<script setup lang="ts">
import Button from 'primevue/button'
import InputText from 'primevue/inputtext'
import { ref } from 'vue'
import { requestPasswordReset } from '../api/auth'
import { errorMessage, validationErrors } from '../api/http'

const email = ref('')
const loading = ref(false)
const error = ref('')
const success = ref('')
const fieldErrors = ref<Record<string, string[]>>({})

async function handleSubmit() {
  error.value = ''
  success.value = ''
  fieldErrors.value = {}

  if (!email.value) {
    error.value = 'Cal indicar el correu electrònic.'
    return
  }

  loading.value = true
  try {
    success.value = await requestPasswordReset(email.value)
  } catch (e) {
    error.value = errorMessage(e)
    fieldErrors.value = validationErrors(e)
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="relative flex min-h-screen items-center justify-center overflow-hidden bg-canvas p-4">
    <div aria-hidden="true" class="pointer-events-none absolute -top-32 -left-32 h-96 w-96 rounded-full bg-brand-200/40 blur-3xl" />
    <div aria-hidden="true" class="pointer-events-none absolute -right-32 -bottom-32 h-96 w-96 rounded-full bg-brand-100/60 blur-3xl" />
    <div class="relative w-full max-w-md">
      <div class="mb-6 flex flex-col items-center gap-2">
        <img src="/logo-fp.png" alt="IES Mestre Ramon Esteve" class="h-24 w-auto" />
        <h1 class="text-xl font-semibold text-brand-700">Has oblidat la contrasenya?</h1>
        <p class="text-sm text-slate-500">T'enviarem un enllaç per restablir-la</p>
      </div>

      <form
        class="flex flex-col gap-4 rounded-lg border border-line bg-white p-6 shadow-card"
        @submit.prevent="handleSubmit"
      >
        <div v-if="error" class="flex items-start gap-2 rounded-lg bg-red-50 p-3 text-sm text-red-700">
          <i class="pi pi-exclamation-circle mt-0.5" />
          <span>{{ error }}</span>
        </div>

        <div
          v-if="success"
          class="flex items-start gap-2 rounded-lg bg-brand-50 p-3 text-sm text-brand-700"
        >
          <i class="pi pi-check-circle mt-0.5" />
          <span>{{ success }}</span>
        </div>

        <div class="flex flex-col gap-1.5">
          <label for="email" class="text-sm font-medium text-slate-700">Correu electrònic</label>
          <InputText
            id="email"
            v-model="email"
            type="email"
            autocomplete="username"
            placeholder="usuari@exemple.com"
            fluid
            :invalid="Boolean(fieldErrors.email)"
          />
          <small v-if="fieldErrors.email" class="text-red-600">{{ fieldErrors.email[0] }}</small>
        </div>

        <Button type="submit" :disabled="loading" class="justify-center">
          <i v-if="loading" class="pi pi-spin pi-spinner" />
          <i v-else class="pi pi-send" />
          <span>Envia l'enllaç</span>
        </Button>

        <p class="text-center text-sm text-slate-500">
          <RouterLink :to="{ name: 'login' }" class="font-medium text-brand-700 hover:underline">
            Torna a l'accés
          </RouterLink>
        </p>
      </form>
    </div>
  </div>
</template>
