import { StrictMode } from 'react'
import ReactDOM from 'react-dom/client'
import { RouterProvider } from '@tanstack/react-router'
import {
  queryClient,
  router,
  Provider as TanStackQueryProvider,
} from '@/integrations/tanstack-query/root-provider.tsx'
import reportWebVitals from './reportWebVitals.ts'
import './styles.css'

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}

const rootElement = document.getElementById('app')
if (rootElement && !rootElement.innerHTML) {
  const root = ReactDOM.createRoot(rootElement)
  root.render(
    <StrictMode>
      <TanStackQueryProvider queryClient={queryClient}>
        <RouterProvider router={router} />
      </TanStackQueryProvider>
    </StrictMode>,
  )
}

reportWebVitals()
