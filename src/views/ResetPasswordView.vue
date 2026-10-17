<script setup lang="ts">
import Button from 'primevue/button'
import Password from 'primevue/password'
import InputText from 'primevue/inputtext'
import { ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { resetPassword } from '../api/auth'
import { errorMessage, validationErrors } from '../api/http'

const route = useRoute()
const router = useRouter()

const token = ref(typeof route.query.token === 'string' ? route.query.token : '')
const email = ref(typeof route.query.email === 'string' ? route.query.email : '')
const password = ref('')
const passwordConfirmation = ref('')
const loading = ref(false)
const error = ref('')
const fieldErrors = ref<Record<string, string[]>>({})

async function handleSubmit() {
  error.value = ''
  fieldErrors.value = {}

  if (!token.value || !email.value) {
    error.value = "L'enllaç de restabliment no és vàlid o ha caducat."
    return
  }
  if (password.value.length < 8) {
    fieldErrors.value = { password: ['La contrasenya ha de tindre almenys 8 caràcters.'] }
    return
  }
  if (password.value !== passwordConfirmation.value) {
    fieldErrors.value = { password_confirmation: ['Les contrasenyes no coincidixen.'] }
    return
  }

  loading.value = true
  try {
    await resetPassword({
      token: token.value,
      email: email.value,
      password: password.value,
      password_confirmation: passwordConfirmation.value,
    })
    await router.push({ name: 'login', query: { restablert: '1' } })
  } catch (e) {
    error.value = errorMessage(e)
    fieldErrors.value = validationErrors(e)
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="relative flex min-h-screen items-center justify-center overflow-hidden bg-slate-100 p-4">
    <div aria-hidden="true" class="pointer-events-none absolute -top-32 -left-32 h-96 w-96 rounded-full bg-teal-200/40 blur-3xl" />
    <div aria-hidden="true" class="pointer-events-none absolute -right-32 -bottom-32 h-96 w-96 rounded-full bg-teal-100/60 blur-3xl" />
    <div class="relative w-full max-w-md">
      <div class="mb-6 flex flex-col items-center gap-2">
        <div class="flex h-12 w-12 items-center justify-center rounded-xl bg-teal-600 text-white">
          <i class="pi pi-lock text-2xl" />
        </div>
        <h1 class="text-xl font-semibold text-slate-800">Restablix la contrasenya</h1>
        <p class="text-sm text-slate-500">Defineix una contrasenya nova</p>
      </div>

      <form
        class="flex flex-col gap-4 rounded-2xl border border-slate-200/80 bg-white p-6 shadow-card"
        @submit.prevent="handleSubmit"
      >
        <div v-if="error" class="flex items-start gap-2 rounded-lg bg-red-50 p-3 text-sm text-red-700">
          <i class="pi pi-exclamation-circle mt-0.5" />
          <span>{{ error }}</span>
        </div>

        <div class="flex flex-col gap-1.5">
          <label for="email" class="text-sm font-medium text-slate-700">Correu electrònic</label>
          <InputText id="email" v-model="email" type="email" fluid readonly />
        </div>

        <div class="flex flex-col gap-1.5">
          <label for="password" class="text-sm font-medium text-slate-700">Contrasenya nova</label>
          <Password
            inputId="password"
            v-model="password"
            autocomplete="new-password"
            fluid
            :invalid="Boolean(fieldErrors.password)"
          />
          <small v-if="fieldErrors.password" class="text-red-600">{{ fieldErrors.password[0] }}</small>
        </div>

        <div class="flex flex-col gap-1.5">
          <label for="password_confirmation" class="text-sm font-medium text-slate-700">
            Repetix la contrasenya
          </label>
          <Password
            inputId="password_confirmation"
            v-model="passwordConfirmation"
            autocomplete="new-password"
            fluid
            :invalid="Boolean(fieldErrors.password_confirmation)"
          />
          <small v-if="fieldErrors.password_confirmation" class="text-red-600">
            {{ fieldErrors.password_confirmation[0] }}
          </small>
        </div>

        <Button type="submit" :disabled="loading" class="justify-center">
          <i v-if="loading" class="pi pi-spin pi-spinner" />
          <i v-else class="pi pi-check" />
          <span>Restablix</span>
        </Button>

        <p class="text-center text-sm text-slate-500">
          <RouterLink :to="{ name: 'login' }" class="font-medium text-teal-700 hover:underline">
            Torna a l'accés
          </RouterLink>
        </p>
      </form>
    </div>
  </div>
</template>
