import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { StoreProvider } from './context/StoreContext.jsx'
import './index.css'
import App from './App.jsx'

// Append fonts to document head
const link = document.createElement('link');
link.href = 'https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;700&family=Playfair+Display:wght@400;600;700&family=JetBrains+Mono:wght@400;600&display=swap';
link.rel = 'stylesheet';
document.head.appendChild(link);

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <StoreProvider>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </StoreProvider>
  </StrictMode>,
)
