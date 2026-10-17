<script setup lang="ts">
import Button from 'primevue/button'
import Password from 'primevue/password'
import InputText from 'primevue/inputtext'
import Tag from 'primevue/tag'
import { useToast } from 'primevue/usetoast'
import { reactive, ref } from 'vue'
import { errorMessage, validationErrors } from '../api/http'
import { updateProfile } from '../api/profile'
import { useAuthStore } from '../stores/auth'

const auth = useAuthStore()
const toast = useToast()

const dataForm = reactive({
  name: auth.user?.name ?? '',
  email: auth.user?.email ?? '',
})
const dataErrors = ref<Record<string, string[]>>({})
const savingData = ref(false)

const passwordForm = reactive({
  current_password: '',
  password: '',
  password_confirmation: '',
})
const passwordErrors = ref<Record<string, string[]>>({})
const savingPassword = ref(false)

async function saveData(): Promise<void> {
  dataErrors.value = {}

  if (!dataForm.name.trim()) {
    dataErrors.value = { name: ['El nom és obligatori.'] }
    return
  }

  savingData.value = true
  try {
    await updateProfile({ name: dataForm.name.trim(), email: dataForm.email.trim() })
    await auth.fetchMe()
    toast.add({ severity: 'success', summary: 'Dades actualitzades', life: 2500 })
  } catch (e) {
    const errors = validationErrors(e)
    if (Object.keys(errors).length > 0) dataErrors.value = errors
    else toast.add({ severity: 'error', summary: 'Error', detail: errorMessage(e), life: 4000 })
  } finally {
    savingData.value = false
  }
}

async function savePassword(): Promise<void> {
  passwordErrors.value = {}

  const errors: Record<string, string[]> = {}

  if (!passwordForm.current_password) errors.current_password = ['La contrasenya actual és obligatòria.']
  if (!passwordForm.password) errors.password = ['La nova contrasenya és obligatòria.']
  else if (passwordForm.password.length < 8)
    errors.password = ['La contrasenya ha de tindre 8 caràcters com a mínim.']
  else if (passwordForm.password !== passwordForm.password_confirmation)
    errors.password_confirmation = ['Les contrasenyes no coincideixen.']

  passwordErrors.value = errors

  if (Object.keys(errors).length > 0) return

  savingPassword.value = true
  try {
    await updateProfile({ ...passwordForm })
    passwordForm.current_password = ''
    passwordForm.password = ''
    passwordForm.password_confirmation = ''
    toast.add({ severity: 'success', summary: 'Contrasenya actualitzada', life: 2500 })
  } catch (e) {
    const errors2 = validationErrors(e)
    if (Object.keys(errors2).length > 0) {
      passwordErrors.value = errors2
    } else {
      toast.add({ severity: 'error', summary: 'Error', detail: errorMessage(e), life: 4000 })
    }
  } finally {
    savingPassword.value = false
  }
}
</script>

<template>
  <div class="mx-auto flex max-w-3xl flex-col gap-6">
    <header class="flex items-center gap-4">
      <div
        class="flex h-14 w-14 items-center justify-center rounded-full bg-teal-600 text-lg font-semibold text-white"
      >
        {{ auth.initials }}
      </div>
      <div>
        <h1 class="text-2xl font-semibold text-slate-800">El meu perfil</h1>
        <div class="mt-1 flex flex-wrap gap-1">
          <Tag
            v-for="role in auth.user?.roles ?? []"
            :key="role"
            :value="role"
            :severity="role === 'admin' ? 'danger' : 'info'"
          />
        </div>
      </div>
    </header>

    <form
      class="flex flex-col gap-4 card"
      @submit.prevent="saveData"
    >
      <div>
        <h2 class="font-medium text-slate-800">Dades del compte</h2>
        <p class="text-sm text-slate-500">Actualitza el teu nom i la teua adreça de correu.</p>
      </div>

      <div class="flex flex-col gap-1.5">
        <label for="profile-name" class="text-sm font-medium text-slate-700">Nom</label>
        <InputText id="profile-name" v-model="dataForm.name" fluid :invalid="Boolean(dataErrors.name)" />
        <small v-if="dataErrors.name" class="text-red-600">{{ dataErrors.name[0] }}</small>
      </div>

      <div class="flex flex-col gap-1.5">
        <label for="profile-email" class="text-sm font-medium text-slate-700">Correu electrònic</label>
        <InputText
          id="profile-email"
          v-model="dataForm.email"
          type="email"
          fluid
          :invalid="Boolean(dataErrors.email)"
        />
        <small v-if="dataErrors.email" class="text-red-600">{{ dataErrors.email[0] }}</small>
      </div>

      <div class="flex justify-end">
        <Button type="submit" :disabled="savingData" class="justify-center">
          <i v-if="savingData" class="pi pi-spin pi-spinner" />
          <i v-else class="pi pi-check" />
          <span>Desa els canvis</span>
        </Button>
      </div>
    </form>

    <form
      class="flex flex-col gap-4 card"
      @submit.prevent="savePassword"
    >
      <div>
        <h2 class="font-medium text-slate-800">Canvi de contrasenya</h2>
        <p class="text-sm text-slate-500">
          Cal confirmar la contrasenya actual per a establir-ne una de nova.
        </p>
      </div>

      <div class="flex flex-col gap-1.5">
        <label for="profile-current" class="text-sm font-medium text-slate-700">Contrasenya actual</label>
        <Password
          inputId="profile-current"
          v-model="passwordForm.current_password"
          autocomplete="current-password"
          fluid
          :invalid="Boolean(passwordErrors.current_password)"
        />
        <small v-if="passwordErrors.current_password" class="text-red-600">
          {{ passwordErrors.current_password[0] }}
        </small>
      </div>

      <div class="grid gap-4 sm:grid-cols-2">
        <div class="flex flex-col gap-1.5">
          <label for="profile-password" class="text-sm font-medium text-slate-700">Nova contrasenya</label>
          <Password
            inputId="profile-password"
            v-model="passwordForm.password"
            autocomplete="new-password"
            fluid
            :invalid="Boolean(passwordErrors.password)"
          />
          <small v-if="passwordErrors.password" class="text-red-600">{{ passwordErrors.password[0] }}</small>
        </div>

        <div class="flex flex-col gap-1.5">
          <label for="profile-password-confirm" class="text-sm font-medium text-slate-700">
            Repeteix la contrasenya
          </label>
          <Password
            inputId="profile-password-confirm"
            v-model="passwordForm.password_confirmation"
            autocomplete="new-password"
            fluid
            :invalid="Boolean(passwordErrors.password_confirmation)"
          />
          <small v-if="passwordErrors.password_confirmation" class="text-red-600">
            {{ passwordErrors.password_confirmation[0] }}
          </small>
        </div>
      </div>

      <div class="flex justify-end">
        <Button type="submit" :disabled="savingPassword" class="justify-center">
          <i v-if="savingPassword" class="pi pi-spin pi-spinner" />
          <i v-else class="pi pi-key" />
          <span>Canvia la contrasenya</span>
        </Button>
      </div>
    </form>
  </div>
</template>
