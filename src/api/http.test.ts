import { describe, expect, it } from 'vitest'
import { errorMessage, isUnauthorized, validationErrors } from './http'

function axiosError(status: number, data: unknown) {
  return { isAxiosError: true, response: { status, data } }
}

describe('helpers derrors dHTTP', () => {
  it('validationErrors extreu els errors de validació 422', () => {
    const error = axiosError(422, { errors: { email: ['Ja existeix'] } })

    expect(validationErrors(error)).toEqual({ email: ['Ja existeix'] })
  })

  it('validationErrors retorna un objecte buit per a errors no-axios', () => {
    expect(validationErrors(new Error('bo'))).toEqual({})
  })

  it('errorMessage prioritza el missatge del servidor', () => {
    const error = axiosError(422, { message: 'Dades incorrectes', errors: { email: ['x'] } })

    expect(errorMessage(error)).toBe('Dades incorrectes')
  })

  it('errorMessage usa el primer error de validació si no hi ha missatge', () => {
    const error = axiosError(422, { errors: { email: ['Ja existeix'] } })

    expect(errorMessage(error)).toBe('Ja existeix')
  })

  it('errorMessage té un text de reserva per a axios sense dades', () => {
    expect(errorMessage(axiosError(500, undefined))).toContain('Error inesperat')
  })

  it('isUnauthorized detecta el 401', () => {
    expect(isUnauthorized(axiosError(401, {}))).toBe(true)
    expect(isUnauthorized(axiosError(403, {}))).toBe(false)
    expect(isUnauthorized(new Error('x'))).toBe(false)
  })
})
