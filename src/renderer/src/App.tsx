import { useState } from 'react'
import { LoginView } from './views/LoginView'
import { Shell } from './views/Shell'
import { WelcomeView } from './views/WelcomeView'

type AppState = { view: 'login' } | { view: 'welcome'; currentUser: string }

function App(): React.JSX.Element {
  const [state, setState] = useState<AppState>({ view: 'login' })

  const signIn = (currentUser: string): void => setState({ view: 'welcome', currentUser })
  const signOut = (): void => setState({ view: 'login' })
  const goHome = (): void => {
    if (state.view === 'welcome') setState({ view: 'welcome', currentUser: state.currentUser })
  }

  if (state.view === 'login') {
    return <LoginView onSignIn={signIn} />
  }

  return (
    <Shell onHome={goHome} onSignOut={signOut}>
      <WelcomeView username={state.currentUser} />
    </Shell>
  )
}

export default App
