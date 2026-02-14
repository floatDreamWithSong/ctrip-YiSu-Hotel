import AddressSearchPage from '@/features/hotel/address-search-page'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_authenticated/address-search')({
  component: AddressSearchPage,
})

