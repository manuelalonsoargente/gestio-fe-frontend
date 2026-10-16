import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import PageHeader from './PageHeader.vue'

describe('PageHeader', () => {
  it('mostra el títol i el subtítol', () => {
    const wrapper = mount(PageHeader, {
      props: { title: 'Usuaris', subtitle: 'Gestió dels comptes.' },
    })
    expect(wrapper.find('h1').text()).toBe('Usuaris')
    expect(wrapper.text()).toContain('Gestió dels comptes.')
  })

  it('amaga el subtítol si no es passa', () => {
    const wrapper = mount(PageHeader, { props: { title: 'Rols' } })
    expect(wrapper.find('p').exists()).toBe(false)
  })

  it('renderitza el contingut de la ranura', () => {
    const wrapper = mount(PageHeader, {
      props: { title: 'Usuaris' },
      slots: { default: '<button>Nou</button>' },
    })
    expect(wrapper.find('button').text()).toBe('Nou')
  })
})
