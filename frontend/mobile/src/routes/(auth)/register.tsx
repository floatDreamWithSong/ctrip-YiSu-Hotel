import { AuthLayout } from '@/components/layout/auth-layout'
import Register from '@/features/auth/register'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/(auth)/register')({
  component: () => (
    <AuthLayout>
      <Register />
    </AuthLayout>
  ),
})
