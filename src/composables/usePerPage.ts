import { ref, watch } from 'vue'

const STORAGE_KEY = 'gestio-fe:files-per-pagina'
const DEFAULT_PER_PAGE = 15
const OPTIONS = [10, 15, 25, 50]

/** Files per pàgina persistides a localStorage i compartides per totes les taules. */
export function usePerPage() {
  const stored = Number(localStorage.getItem(STORAGE_KEY))
  const perPage = ref(OPTIONS.includes(stored) ? stored : DEFAULT_PER_PAGE)

  watch(perPage, (value) => {
    localStorage.setItem(STORAGE_KEY, String(value))
  })

  return { perPage, perPageOptions: OPTIONS }
}
