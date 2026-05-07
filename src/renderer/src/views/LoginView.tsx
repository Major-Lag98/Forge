import { useState, type KeyboardEvent } from 'react'

interface LoginViewProps {
  onSignIn: (username: string) => void
}

export function LoginView({ onSignIn }: LoginViewProps): React.JSX.Element {
  const [username, setUsername] = useState('')
  const trimmed = username.trim()
  const canSubmit = trimmed.length > 0

  const submit = (): void => {
    if (canSubmit) onSignIn(trimmed)
  }

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>): void => {
    if (e.key === 'Enter') submit()
  }

  return (
    <div className="login-view">
      <div className="login-pane">
        <h1 className="login-banner">Sign In</h1>
        <input
          type="text"
          className="login-input"
          placeholder="USERNAME"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          onKeyDown={onKeyDown}
          autoFocus
          aria-label="Username"
        />
        <button
          type="button"
          className="login-submit"
          onClick={submit}
          disabled={!canSubmit}
          aria-label="Sign in"
        >
          →
        </button>
      </div>
      <div className="login-brand">
        <h2 className="brand-title">FORGE Launcher</h2>
        <p className="brand-by">By</p>
        <p className="brand-name">Alden</p>
      </div>
    </div>
  )
}
