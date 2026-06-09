import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { i18n } from '@lingui/core'
import { I18nProvider } from '@lingui/react'
import './index.css'
import App from './App.tsx'

i18n.load('fr', {})
i18n.activate('fr')

const queryClient = new QueryClient()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <I18nProvider i18n={i18n}>
        <App />
      </I18nProvider>
    </QueryClientProvider>
  </StrictMode>,
)
