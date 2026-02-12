import ReviewsPage from '@/features/admin/reviews-page'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_authenticated/admin/reviews')({
  component: ReviewsPage,
})
