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
  icon_url?: string
  screenshots?: string[]
}

export interface Manifest {
  schema_version: number
  games: Game[]
}

export interface InstalledGame {
  id: string
  version: string
  install_dir: string
  executable_path: string
  installed_at: string
}
