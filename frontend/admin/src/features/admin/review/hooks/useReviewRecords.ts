import { AdminReviewRequest } from '@/apis/hotel'
import { useTable } from '@/hooks/useTable'
import { useQuery } from '@tanstack/react-query'
import type { ApiHotelTypes } from '@yisu/shared'
import { useMemo } from 'react'

const ADMIN_REVIEW_RECORDS_KEY = 'admin-review-records'

interface ReviewRecordsFilter extends Record<string, unknown> {
  action?: ApiHotelTypes['ReviewRecordQuery']['action']
  rejectReason?: ApiHotelTypes['ReviewRecordQuery']['rejectReason']
  startAt?: string
  endAt?: string
}

/**
 * 审核记录列表业务逻辑 Hook
 */
export function useReviewRecords() {
  const { page, pageSize, filters, pagination, updateFilter } =
    useTable<ReviewRecordsFilter>()

  const reviewRecordsQuery = useQuery({
    queryKey: [ADMIN_REVIEW_RECORDS_KEY, page, pageSize, filters],
    queryFn: () =>
      AdminReviewRequest.getReviewRecords({
        page,
        limit: pageSize,
        action: filters.action,
        rejectReason: filters.rejectReason,
        startAt: filters.startAt,
        endAt: filters.endAt,
        order: 'desc',
      }),
  })

  const records = useMemo(
    () => reviewRecordsQuery.data?.items ?? [],
    [reviewRecordsQuery.data],
  )
  const total = useMemo(
    () => reviewRecordsQuery.data?.total ?? 0,
    [reviewRecordsQuery.data],
  )

  return {
    records,
    loading: reviewRecordsQuery.isLoading,
    pagination: {
      ...pagination,
      total,
    },
    filter: {
      ...filters,
      setAction: (value: ApiHotelTypes['ReviewRecordQuery']['action']) =>
        updateFilter('action', value),
      setRejectReason: (
        value: ApiHotelTypes['ReviewRecordQuery']['rejectReason'],
      ) => updateFilter('rejectReason', value),
      setStartAt: (value: string | undefined) => updateFilter('startAt', value),
      setEndAt: (value: string | undefined) => updateFilter('endAt', value),
    },
  }
}
