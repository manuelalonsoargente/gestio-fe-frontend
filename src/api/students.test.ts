import { beforeEach, describe, expect, it, vi } from 'vitest'
import { api } from './http'
import { fetchStudents, importStudents } from './students'

vi.mock('./http', () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}))

const mockedApi = vi.mocked(api, true)

describe('API dalumnat', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('fetchStudents envia cerca, filtre de curs i paginació', async () => {
    mockedApi.get.mockResolvedValue({ data: { data: [], meta: {} } })

    await fetchStudents({ page: 2, search: 'Garcia', courseId: 3, perPage: 10 })

    expect(mockedApi.get).toHaveBeenCalledWith('/students', {
      params: {
        page: 2,
        per_page: 10,
        sort: 'surnames',
        direction: 'asc',
        search: 'Garcia',
        course_id: 3,
      },
    })
  })

  it('importStudents puja el fitxer com a multipart', async () => {
    const result = { message: 'ok', imported: 1, courses_created: 1, skipped: 0, errors: [] }
    mockedApi.post.mockResolvedValue({ data: result })

    const file = new File(['Nom,Cognoms,Curs\nJoan,Ferrer,1r ESO'], 'alumnes.csv', {
      type: 'text/csv',
    })
    const response = await importStudents(file)

    expect(response).toEqual(result)
    const [url, body] = mockedApi.post.mock.calls[0]
    expect(url).toBe('/students/import')
    expect(body).toBeInstanceOf(FormData)
    expect((body as FormData).get('file')).toBe(file)
  })
})
