export interface Game {
  id: string
  name: string
  version: string
  description: string
  platform: string
  url: string
  sha256: string
  size_bytes: number
  executable: string
}

export interface Manifest {
  schema_version: number
  games: Game[]
}
