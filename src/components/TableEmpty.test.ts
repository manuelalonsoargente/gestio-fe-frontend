import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import TableEmpty from './TableEmpty.vue'

describe('TableEmpty', () => {
  it('mostra el missatge per defecte', () => {
    const wrapper = mount(TableEmpty)
    expect(wrapper.text()).toContain('No hi ha dades.')
  })

  it('accepta un missatge personalitzat', () => {
    const wrapper = mount(TableEmpty, { props: { message: 'Cap resultat.' } })
    expect(wrapper.text()).toContain('Cap resultat.')
  })

  it('aplica la icona indicada', () => {
    const wrapper = mount(TableEmpty, { props: { icon: 'pi pi-search' } })
    expect(wrapper.find('i').classes()).toContain('pi-search')
  })
})
