import type { Manifest } from '../shared/types'

export const DEFAULT_CATALOG_URL =
  'https://raw.githubusercontent.com/Major-Lag98/Forge-Manifest/refs/heads/main/manifest.json'

export const CATALOG_FETCH_TIMEOUT_MS = 10_000

export class CatalogFetchError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'CatalogFetchError'
  }
}

export async function fetchCatalog(
  url: string = process.env.FORGE_CATALOG_URL ?? DEFAULT_CATALOG_URL,
  timeoutMs: number = CATALOG_FETCH_TIMEOUT_MS
): Promise<Manifest> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)
  let response: Response
  try {
    response = await fetch(url, { signal: controller.signal })
  } catch (e) {
    const reason = e instanceof Error ? e.message : String(e)
    throw new CatalogFetchError(`network error fetching catalog: ${reason}`)
  } finally {
    clearTimeout(timer)
  }

  if (!response.ok) {
    throw new CatalogFetchError(`catalog server returned ${response.status} ${response.statusText}`)
  }

  let parsed: unknown
  try {
    parsed = await response.json()
  } catch (e) {
    const reason = e instanceof Error ? e.message : String(e)
    throw new CatalogFetchError(`catalog body is not valid JSON: ${reason}`)
  }

  return validateManifest(parsed)
}

function validateManifest(value: unknown): Manifest {
  if (!isRecord(value)) {
    throw new CatalogFetchError('catalog root is not an object')
  }
  if (value.schema_version !== 1) {
    throw new CatalogFetchError(
      `unsupported catalog schema_version: ${JSON.stringify(value.schema_version)}`
    )
  }
  if (!Array.isArray(value.games)) {
    throw new CatalogFetchError('catalog "games" is not an array')
  }
  for (const [idx, entry] of value.games.entries()) {
    validateGame(entry, idx)
  }
  return value as unknown as Manifest
}

function validateGame(value: unknown, idx: number): void {
  if (!isRecord(value)) {
    throw new CatalogFetchError(`games[${idx}] is not an object`)
  }
  const requiredStrings = [
    'id',
    'name',
    'version',
    'description',
    'platform',
    'url',
    'sha256',
    'executable'
  ] as const
  for (const field of requiredStrings) {
    if (typeof value[field] !== 'string' || value[field] === '') {
      throw new CatalogFetchError(`games[${idx}].${field} missing or not a non-empty string`)
    }
  }
  if (typeof value.size_bytes !== 'number' || value.size_bytes <= 0) {
    throw new CatalogFetchError(`games[${idx}].size_bytes missing or not a positive number`)
  }
  if (!/^[0-9a-f]{64}$/i.test(value.sha256 as string)) {
    throw new CatalogFetchError(`games[${idx}].sha256 is not 64 hex characters`)
  }
  if (value.icon_url !== undefined) {
    if (typeof value.icon_url !== 'string' || value.icon_url === '') {
      throw new CatalogFetchError(`games[${idx}].icon_url present but not a non-empty string`)
    }
  }
  if (value.screenshots !== undefined) {
    if (!Array.isArray(value.screenshots)) {
      throw new CatalogFetchError(`games[${idx}].screenshots present but not an array`)
    }
    for (const [sIdx, s] of value.screenshots.entries()) {
      if (typeof s !== 'string' || s === '') {
        throw new CatalogFetchError(`games[${idx}].screenshots[${sIdx}] is not a non-empty string`)
      }
    }
    if (value.screenshots.length > 5) {
      value.screenshots = value.screenshots.slice(0, 5)
    }
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}
