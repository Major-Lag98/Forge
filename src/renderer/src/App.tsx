import { useState } from 'react'
import Versions from './components/Versions'
import electronLogo from './assets/electron.svg'

function App(): React.JSX.Element {
  const [response, setResponse] = useState<string>('')

  const ping = async (): Promise<void> => {
    try {
      const result = await window.api.request({ op: 'ping' })
      setResponse(JSON.stringify(result))
    } catch (e) {
      setResponse(`error: ${e instanceof Error ? e.message : String(e)}`)
    }
  }

  return (
    <>
      <img alt="logo" className="logo" src={electronLogo} />
      <div className="creator">Powered by electron-vite</div>
      <div className="text">
        Build an Electron app with <span className="react">React</span>
        &nbsp;and <span className="ts">TypeScript</span>
      </div>
      <p className="tip">
        Please try pressing <code>F12</code> to open the devTool
      </p>
      <div className="actions">
        <div className="action">
          <a href="https://electron-vite.org/" target="_blank" rel="noreferrer">
            Documentation
          </a>
        </div>
        <div className="action">
          <a target="_blank" rel="noreferrer" onClick={ping}>
            Ping core
          </a>
        </div>
      </div>
      {response && (
        <p className="tip">
          core says: <code>{response}</code>
        </p>
      )}
      <Versions></Versions>
    </>
  )
}

export default App
