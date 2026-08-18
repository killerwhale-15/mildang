import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import { IS_PRODUCTION } from './api/config.js'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

if ('serviceWorker' in navigator) {
  window.addEventListener('load', async () => {
    if (IS_PRODUCTION) {
      const registration = await navigator.serviceWorker.register(
        `${import.meta.env.BASE_URL}service-worker.js`,
        { updateViaCache: 'none' },
      )

      registration.update()
      return
    }

    const registrations = await navigator.serviceWorker.getRegistrations()
    await Promise.all(
      registrations.map((registration) => registration.unregister()),
    )

    if ('caches' in window) {
      const cacheNames = await caches.keys()
      await Promise.all(
        cacheNames
          .filter((cacheName) => cacheName.startsWith('mildang-'))
          .map((cacheName) => caches.delete(cacheName)),
      )
    }
  })
}
