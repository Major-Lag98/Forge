interface WelcomeViewProps {
  username: string
}

export function WelcomeView({ username }: WelcomeViewProps): React.JSX.Element {
  return (
    <div className="welcome">
      <h1 className="welcome-title">WELCOME</h1>
      <p className="welcome-username">{username}</p>
      <p className="welcome-prompt">← Select a game</p>
    </div>
  )
}
