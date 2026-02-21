import { StrictMode } from 'react'
import ReactDOM from 'react-dom/client'
import { RouterProvider } from '@tanstack/react-router'
import { ConfigProvider } from 'antd'
import zhCN from 'antd/locale/zh_CN'
import { adminTheme } from './theme'
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
      <ConfigProvider theme={adminTheme} locale={zhCN}>
        <TanStackQueryProvider queryClient={queryClient}>
          <RouterProvider router={router} />
        </TanStackQueryProvider>
      </ConfigProvider>
    </StrictMode>,
  )
}

reportWebVitals()
