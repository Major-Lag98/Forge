import type { Game } from '../../../shared/types'

interface GameDetailViewProps {
  game: Game
}

export function GameDetailView({ game }: GameDetailViewProps): React.JSX.Element {
  return (
    <div className="game-detail">
      <h1 className="game-title">{game.name}</h1>
      <button type="button" className="game-action" disabled>
        Install
      </button>
      <p className="game-description">{game.description}</p>
    </div>
  )
}
