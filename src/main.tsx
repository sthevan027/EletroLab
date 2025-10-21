import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'

// Renderizar a aplicação imediatamente
const root = document.getElementById('root')
if (!root) {
  throw new Error('Elemento root não encontrado')
}

console.log('Iniciando EletriLab...')

// Renderizar a aplicação
ReactDOM.createRoot(root).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)

// Inicializar banco de dados em background (não bloqueia a renderização)
setTimeout(async () => {
  try {
    const { initializeDatabase } = await import('./db/database')
    await initializeDatabase()
    console.log('EletriLab Ultra-MVP inicializado com sucesso')
  } catch (error) {
    console.error('Erro ao inicializar EletriLab:', error)
  }
}, 100)
