<script setup lang="ts">
import Button from 'primevue/button'
import InputPassword from 'primevue/inputpassword'
import InputText from 'primevue/inputtext'
import { ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { errorMessage, validationErrors } from '../api/http'
import { useAuthStore } from '../stores/auth'

const auth = useAuthStore()
const route = useRoute()
const router = useRouter()

const email = ref('')
const password = ref('')
const loading = ref(false)
const error = ref('')
const fieldErrors = ref<Record<string, string[]>>({})

async function handleSubmit() {
  error.value = ''
  fieldErrors.value = {}

  if (!email.value || !password.value) {
    error.value = 'Cal omplir el correu i la contrasenya.'
    return
  }

  loading.value = true
  try {
    await auth.login(email.value, password.value)
    const redirect = route.query.redirect
    await router.push(typeof redirect === 'string' && redirect ? redirect : { name: 'dashboard' })
  } catch (e) {
    error.value = errorMessage(e)
    fieldErrors.value = validationErrors(e)
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="flex min-h-screen items-center justify-center bg-slate-100 p-4">
    <div class="w-full max-w-md">
      <div class="mb-6 flex flex-col items-center gap-2">
        <div class="flex h-12 w-12 items-center justify-center rounded-xl bg-teal-600 text-white">
          <i class="pi pi-briefcase text-2xl" />
        </div>
        <h1 class="text-xl font-semibold text-slate-800">Gestió FE</h1>
        <p class="text-sm text-slate-500">Accedeix amb el teu compte</p>
      </div>

      <form
        class="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
        @submit.prevent="handleSubmit"
      >
        <div v-if="error" class="flex items-start gap-2 rounded-lg bg-red-50 p-3 text-sm text-red-700">
          <i class="pi pi-exclamation-circle mt-0.5" />
          <span>{{ error }}</span>
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
        </div>

        <div class="flex flex-col gap-1.5">
          <label for="password" class="text-sm font-medium text-slate-700">Contrasenya</label>
          <InputPassword
            id="password"
            v-model="password"
            autocomplete="current-password"
            fluid
          />
        </div>

        <Button type="submit" :disabled="loading" class="mt-2 justify-center" fluid>
          <i v-if="loading" class="pi pi-spin pi-spinner" />
          <i v-else class="pi pi-sign-in" />
          <span>{{ loading ? 'Comprovant…' : 'Accedeix' }}</span>
        </Button>
      </form>

      <p class="mt-4 text-center text-xs text-slate-400">
        Frontend Vue 3 · API Laravel Sanctum
      </p>
    </div>
  </div>
</template>
