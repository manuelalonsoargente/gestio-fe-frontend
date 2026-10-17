<script setup lang="ts">
import Button from 'primevue/button'
import Password from 'primevue/password'
import InputText from 'primevue/inputtext'
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { errorMessage, validationErrors } from '../api/http'
import { useAuthStore } from '../stores/auth'

const auth = useAuthStore()
const router = useRouter()

const name = ref('')
const email = ref('')
const password = ref('')
const passwordConfirmation = ref('')
const loading = ref(false)
const error = ref('')
const fieldErrors = ref<Record<string, string[]>>({})

async function handleSubmit() {
  error.value = ''
  fieldErrors.value = {}

  if (!name.value || !email.value || !password.value) {
    error.value = 'Cal omplir tots els camps.'
    return
  }
  if (password.value !== passwordConfirmation.value) {
    fieldErrors.value = { password_confirmation: ['Les contrasenyes no coincidixen.'] }
    return
  }

  loading.value = true
  try {
    await auth.register({
      name: name.value,
      email: email.value,
      password: password.value,
      password_confirmation: passwordConfirmation.value,
    })
    await router.push({ name: 'dashboard' })
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
          <i class="pi pi-briefcase text-2xl" />
        </div>
        <h1 class="text-xl font-semibold text-slate-800">Crea un compte</h1>
        <p class="text-sm text-slate-500">Registra't per accedir a Gestió FE</p>
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
          <label for="name" class="text-sm font-medium text-slate-700">Nom complet</label>
          <InputText id="name" v-model="name" autocomplete="name" fluid :invalid="Boolean(fieldErrors.name)" />
          <small v-if="fieldErrors.name" class="text-red-600">{{ fieldErrors.name[0] }}</small>
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

        <div class="flex flex-col gap-1.5">
          <label for="password" class="text-sm font-medium text-slate-700">Contrasenya</label>
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
          <i v-else class="pi pi-user-plus" />
          <span>Crea el compte</span>
        </Button>

        <p class="text-center text-sm text-slate-500">
          Ja tens compte?
          <RouterLink :to="{ name: 'login' }" class="font-medium text-teal-700 hover:underline">
            Inicia la sessió
          </RouterLink>
        </p>
      </form>
    </div>
  </div>
</template>
