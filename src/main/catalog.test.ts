import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { CatalogFetchError, fetchCatalog } from './catalog'

const validManifest = {
  schema_version: 1,
  games: [
    {
      id: 'sample-game',
      name: 'Sample Game',
      version: '1.0.0',
      description: 'A sample game.',
      platform: 'windows-x64',
      url: 'https://example.com/sample.zip',
      sha256: '0'.repeat(64),
      size_bytes: 100,
      executable: 'sample.exe'
    }
  ]
}

const mockResponse = (init: {
  ok: boolean
  status?: number
  statusText?: string
  body: unknown
}): Response =>
  ({
    ok: init.ok,
    status: init.status ?? (init.ok ? 200 : 500),
    statusText: init.statusText ?? '',
    json: async () => init.body
  }) as Response

describe('fetchCatalog', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn())
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  it('returns the parsed manifest on a 200 response with valid JSON', async () => {
    ;(globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
      mockResponse({ ok: true, body: validManifest })
    )
    const manifest = await fetchCatalog('https://example.com/manifest.json')
    expect(manifest.schema_version).toBe(1)
    expect(manifest.games[0].id).toBe('sample-game')
  })

  it('throws CatalogFetchError when fetch rejects (network error)', async () => {
    ;(globalThis.fetch as ReturnType<typeof vi.fn>).mockRejectedValueOnce(
      new Error('ENOTFOUND example.com')
    )
    await expect(fetchCatalog('https://example.com/manifest.json')).rejects.toBeInstanceOf(
      CatalogFetchError
    )
  })

  it('throws CatalogFetchError on a non-2xx response', async () => {
    ;(globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
      mockResponse({ ok: false, status: 404, statusText: 'Not Found', body: null })
    )
    await expect(fetchCatalog('https://example.com/manifest.json')).rejects.toThrow(/404/)
  })

  it('throws CatalogFetchError when body is not valid JSON', async () => {
    const response = {
      ok: true,
      status: 200,
      statusText: 'OK',
      json: async () => {
        throw new SyntaxError('Unexpected end of JSON')
      }
    } as unknown as Response
    ;(globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce(response)
    await expect(fetchCatalog('https://example.com/manifest.json')).rejects.toThrow(
      /not valid JSON/
    )
  })

  it('rejects an unsupported schema_version', async () => {
    ;(globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
      mockResponse({ ok: true, body: { ...validManifest, schema_version: 2 } })
    )
    await expect(fetchCatalog('https://example.com/manifest.json')).rejects.toThrow(
      /schema_version/
    )
  })

  it('rejects a manifest whose games is not an array', async () => {
    ;(globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
      mockResponse({ ok: true, body: { schema_version: 1, games: 'oops' } })
    )
    await expect(fetchCatalog('https://example.com/manifest.json')).rejects.toThrow(/games/)
  })

  it('rejects a game missing a required string field', async () => {
    const bad = {
      schema_version: 1,
      games: [{ ...validManifest.games[0], executable: '' }]
    }
    ;(globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
      mockResponse({ ok: true, body: bad })
    )
    await expect(fetchCatalog('https://example.com/manifest.json')).rejects.toThrow(/executable/)
  })

  it('rejects a game whose sha256 is not 64 hex characters', async () => {
    const bad = {
      schema_version: 1,
      games: [{ ...validManifest.games[0], sha256: 'notavalidhash' }]
    }
    ;(globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
      mockResponse({ ok: true, body: bad })
    )
    await expect(fetchCatalog('https://example.com/manifest.json')).rejects.toThrow(/sha256/)
  })

  it('honours the timeout by aborting and surfacing a network error', async () => {
    ;(globalThis.fetch as ReturnType<typeof vi.fn>).mockImplementationOnce(
      (_url: string, init: RequestInit) => {
        return new Promise((_resolve, reject) => {
          init.signal?.addEventListener('abort', () => {
            const err = new Error('aborted')
            err.name = 'AbortError'
            reject(err)
          })
        })
      }
    )
    await expect(fetchCatalog('https://example.com/manifest.json', 5)).rejects.toBeInstanceOf(
      CatalogFetchError
    )
  })
})
