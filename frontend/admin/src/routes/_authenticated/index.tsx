import Dashboard from '@/features/dashboard'
import { getCurrentUserPayload } from '@/lib/auth'
import { createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/_authenticated/')({
  beforeLoad: () => {
    const currentUser = getCurrentUserPayload()
    const isAdmin = currentUser?.userType === 'ADMIN'
    if (!isAdmin) {
      throw redirect({ to: '/merchant/hotels' })
    }
  },
  component: Dashboard,
})
