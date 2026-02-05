import { createFileRoute } from '@tanstack/react-router'
import ForgotPassword from '@/features/auth/forgot-password'
import { AuthLayout } from '@/components/layout/auth-layout'

export const Route = createFileRoute('/(auth)/forgot-password')({
  component: ForgotPasswordPage,
})

function ForgotPasswordPage() {
  return (
    <AuthLayout>
      <ForgotPassword />
    </AuthLayout>
  )
}
