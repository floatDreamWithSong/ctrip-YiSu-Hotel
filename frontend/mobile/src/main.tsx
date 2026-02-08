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
import { unstableSetRender } from 'antd-mobile' // Support since version ^5.40.0
import { createRoot } from 'react-dom/client'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
unstableSetRender((node, container: any) => {
  container._reactRoot ||= createRoot(container)
  const root = container._reactRoot
  root.render(node)
  return async () => {
    await new Promise((resolve) => setTimeout(resolve, 0))
    root.unmount()
  }
})

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
