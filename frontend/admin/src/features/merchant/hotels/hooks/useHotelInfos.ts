import { MerchantHotelRequest } from '@/apis/hotel'
import { useTable } from '@/hooks/useTable'
import { useQuery } from '@tanstack/react-query'
import type { ApiHotelTypes } from '@yisu/shared'
import { useMemo } from 'react'

const HOTEL_INFOS_QUERY_KEY = 'merchant-hotel-infos'

interface HotelInfosFilter extends Record<string, unknown> {
  reviewStatus?: ApiHotelTypes['HotelInfoQuery']['reviewStatus']
}

/**
 * 酒店信息列表业务逻辑 Hook
 */
export function useHotelInfos(hotelId: number) {
  const { page, pageSize, filters, pagination, updateFilter, resetFilters } =
    useTable<HotelInfosFilter>()

  const statusFilter = filters.reviewStatus

  const hotelInfosQuery = useQuery({
    queryKey: [HOTEL_INFOS_QUERY_KEY, hotelId, page, pageSize, statusFilter],
    queryFn: () =>
      MerchantHotelRequest.getHotelInfos(hotelId, {
        page,
        limit: pageSize,
        reviewStatus: statusFilter,
      }),
  })

  const infos = useMemo(
    () => hotelInfosQuery.data?.items ?? [],
    [hotelInfosQuery.data],
  )
  const total = useMemo(
    () => hotelInfosQuery.data?.total ?? 0,
    [hotelInfosQuery.data],
  )

  return {
    infos,
    loading: hotelInfosQuery.isLoading,
    pagination: {
      ...pagination,
      total,
    },
    filter: {
      statusFilter,
      setStatusFilter: (
        value: ApiHotelTypes['HotelInfoQuery']['reviewStatus'],
      ) => updateFilter('reviewStatus', value),
      resetFilters,
    },
  }
}
