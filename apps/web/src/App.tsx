import { useState, useEffect } from 'react'
import { SYSTEM_NAME } from '@systemarchitect/shared'
import './App.css'

function App() {
  const [health, setHealth] = useState<string>("checking...")

  useEffect(() => {
    fetch('http://localhost:3000/health')
      .then(res => res.json())
      .then(data => setHealth(data.status))
      .catch(() => setHealth("error connecting to backend"))
  }, [])

  return (
    <div style={{ padding: '2rem', fontFamily: 'sans-serif' }}>
      <h1>{SYSTEM_NAME}</h1>
      <p>AI-powered system architecture workspace</p>
      <button style={{ padding: '0.5rem 1rem', fontSize: '1rem', cursor: 'pointer' }}>New Project</button>
      <p style={{ marginTop: '2rem', color: '#666' }}>No architecture yet.</p>
      <div style={{ marginTop: '3rem', fontSize: '0.8rem', color: '#999' }}>
        Backend status: {health}
      </div>
    </div>
  )
}

export default App
