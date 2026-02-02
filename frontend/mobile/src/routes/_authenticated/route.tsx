import { createFileRoute, redirect } from '@tanstack/react-router'
import { AuthenticatedLayout } from '@/components/layout/authenticated-layout'
import { tokenStore } from '@/lib/request'

export const Route = createFileRoute('/_authenticated')({
  component: AuthenticatedLayout,
  beforeLoad: () => {
    const token = tokenStore.get()
    const isAuthenticated = Boolean(token)

    if (!isAuthenticated) {
      throw redirect({
        to: '/login',
      })
    }
  },
})
