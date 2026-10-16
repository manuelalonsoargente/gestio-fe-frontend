import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { nextTick } from 'vue'
import { usePerPage } from './usePerPage'

const STORAGE_KEY = 'gestio-fe:files-per-pagina'

function stubLocalStorage() {
  const store = new Map<string, string>()
  vi.stubGlobal('localStorage', {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => void store.set(key, value),
    removeItem: (key: string) => void store.delete(key),
    clear: () => store.clear(),
  })
  return store
}

describe('usePerPage', () => {
  beforeEach(() => stubLocalStorage())
  afterEach(() => vi.unstubAllGlobals())

  it('fa servir 15 com a valor per defecte', () => {
    expect(usePerPage().perPage.value).toBe(15)
  })

  it('recupera el valor desat si és vàlid', () => {
    localStorage.setItem(STORAGE_KEY, '25')
    expect(usePerPage().perPage.value).toBe(25)
  })

  it('ignora un valor desat que no és una opció vàlida', () => {
    localStorage.setItem(STORAGE_KEY, '999')
    expect(usePerPage().perPage.value).toBe(15)
  })

  it('persisteix els canvis a localStorage', async () => {
    const { perPage } = usePerPage()
    perPage.value = 50
    await nextTick()

    expect(localStorage.getItem(STORAGE_KEY)).toBe('50')
  })
})
