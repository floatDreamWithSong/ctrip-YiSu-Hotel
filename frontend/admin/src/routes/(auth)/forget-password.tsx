import { AuthLayout } from '@/components/layout/auth-layout'
import ForgetPassword from '@/features/auth/forget-password'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/(auth)/forget-password')({
  component: () => (
    <AuthLayout>
      <ForgetPassword />
    </AuthLayout>
  ),
})
