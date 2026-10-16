import Aura from '@primeuix/themes/aura'
import { createPinia } from 'pinia'
import PrimeVue from 'primevue/config'
import ConfirmationService from 'primevue/confirmationservice'
import ToastService from 'primevue/toastservice'
import { createApp } from 'vue'
import 'primeicons/primeicons.css'
import App from './App.vue'
import router from './router'
import './style.css'

// Tema Aura amb el color primari en teal (coherent amb la marca de l'aplicació).
const theme = {
  ...Aura,
  semantic: {
    ...Aura.semantic,
    primary: {
      ...Aura.semantic?.primary,
      50: '{teal.50}',
      100: '{teal.100}',
      200: '{teal.200}',
      300: '{teal.300}',
      400: '{teal.400}',
      500: '{teal.500}',
      600: '{teal.600}',
      700: '{teal.700}',
      800: '{teal.800}',
      900: '{teal.900}',
      950: '{teal.950}',
      color: 'light-dark({primary.500}, {primary.400})',
      contrastColor: 'light-dark(#ffffff, {surface.900})',
      hoverColor: 'light-dark({primary.600}, {primary.300})',
      activeColor: 'light-dark({primary.700}, {primary.200})',
    },
  },
} as typeof Aura

// Textos de PrimeVue en valencià (es fusionen amb els valors per defecte).
const locale = {
  startsWith: 'Comença per',
  contains: 'Conté',
  notContains: 'No conté',
  endsWith: 'Acaba en',
  equals: 'És igual a',
  notEquals: 'No és igual a',
  noFilter: 'Sense filtre',
  lt: 'Menor que',
  lte: 'Menor o igual que',
  gt: 'Major que',
  gte: 'Major o igual que',
  clear: 'Neteja',
  apply: 'Aplica',
  accept: 'Sí',
  reject: 'No',
  choose: 'Tria',
  cancel: 'Cancel·la',
  emptyFilterMessage: 'Sense resultats',
  emptySelectionMessage: 'Cap element seleccionat',
  emptySearchMessage: 'Sense resultats',
  emptyMessage: 'No hi ha dades',
  aria: {
    trueLabel: 'Sí',
    falseLabel: 'No',
    nullLabel: 'No seleccionat',
    close: 'Tanca',
    previous: 'Anterior',
    next: 'Següent',
    pageLabel: 'Pàgina {page}',
    firstPageLabel: 'Primera pàgina',
    lastPageLabel: 'Última pàgina',
    nextPageLabel: 'Pàgina següent',
    prevPageLabel: 'Pàgina anterior',
    rowsPerPageLabel: 'Files per pàgina',
    selectRow: 'Fila seleccionada',
    unselectRow: 'Fila no seleccionada',
  },
}

const app = createApp(App)

app.use(createPinia())
app.use(router)
app.use(PrimeVue, {
  // Llicència PrimeUI (gratuïta Community via https://primeui.dev). Sense clau,
  // PrimeVue 5 mostra el banner "Invalid PrimeUI License".
  license: import.meta.env.VITE_PRIMEUI_LICENSE || undefined,
  theme: {
    preset: theme,
    options: {
      prefix: 'p',
      darkModeSelector: 'system',
      cssLayer: false,
    },
  },
  locale,
})
app.use(ToastService)
app.use(ConfirmationService)

app.mount('#app')
