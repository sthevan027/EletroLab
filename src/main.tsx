import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { initializeDatabase } from './db/database'

// Inicializar banco de dados
initializeDatabase()
  .then(() => {
    console.log('EletriLab Ultra-MVP inicializado com sucesso');
  })
  .catch((error) => {
    console.error('Erro ao inicializar EletriLab:', error);
  });

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
