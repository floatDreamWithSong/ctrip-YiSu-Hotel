import ReviewPage from '@/features/admin/review/pages/ReviewPage'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_authenticated/admin/reviews')({
  component: ReviewPage,
})
