import { AuthLayout } from '@/components/layout/auth-layout'
import Login from '@/features/auth/login'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/(auth)/login')({
  component: () => (
    <AuthLayout>
      <Login />
    </AuthLayout>
  ),
})
