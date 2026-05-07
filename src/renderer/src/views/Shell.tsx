import { type ReactNode } from 'react'

interface ShellProps {
  onHome: () => void
  onSignOut: () => void
  children: ReactNode
}

export function Shell({ onHome, onSignOut, children }: ShellProps): React.JSX.Element {
  return (
    <div className="shell">
      <aside className="rail">
        <button type="button" className="rail-home" onClick={onHome} aria-label="Home">
          F
        </button>
        <div className="rail-games" />
        <button
          type="button"
          className="rail-signout"
          onClick={onSignOut}
          aria-label="Sign out"
          title="Sign out"
        >
          ⎋
        </button>
      </aside>
      <main className="main-pane">{children}</main>
    </div>
  )
}
