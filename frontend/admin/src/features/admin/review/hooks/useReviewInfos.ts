import { AdminReviewRequest } from '@/apis/hotel'
import { useTable } from '@/hooks/useTable'
import { useQuery } from '@tanstack/react-query'
import type { ApiHotelTypes } from '@yisu/shared'
import { useMemo } from 'react'

const ADMIN_REVIEW_INFOS_KEY = 'admin-review-infos'

interface ReviewInfosFilter extends Record<string, unknown> {
  reviewStatus?: ApiHotelTypes['AdminReviewQuery']['reviewStatus']
}

/**
 * 管理员端审核信息列表业务逻辑 Hook
 */
export function useReviewInfos() {
  const { page, pageSize, filters, pagination, updateFilter } =
    useTable<ReviewInfosFilter>()

  const statusFilter = filters.reviewStatus

  const reviewInfosQuery = useQuery({
    queryKey: [ADMIN_REVIEW_INFOS_KEY, page, pageSize, statusFilter],
    queryFn: () =>
      AdminReviewRequest.getReviewHotelInfos({
        page,
        limit: pageSize,
        reviewStatus: statusFilter,
      }),
  })

  const infos = useMemo(
    () => reviewInfosQuery.data?.items ?? [],
    [reviewInfosQuery.data],
  )
  const total = useMemo(
    () => reviewInfosQuery.data?.total ?? 0,
    [reviewInfosQuery.data],
  )

  return {
    infos,
    loading: reviewInfosQuery.isLoading,
    pagination: {
      ...pagination,
      total,
    },
    filter: {
      statusFilter,
      setStatusFilter: (
        value: ApiHotelTypes['AdminReviewQuery']['reviewStatus'],
      ) => updateFilter('reviewStatus', value),
    },
  }
}
