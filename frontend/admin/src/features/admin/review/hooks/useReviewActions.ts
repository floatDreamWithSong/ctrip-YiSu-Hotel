import { AdminReviewRequest } from '@/apis/hotel'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { ApiHotelTypes } from '@yisu/shared'
import { message } from 'antd'

const ADMIN_REVIEW_INFO_DETAIL_KEY = 'admin-review-info-detail'
const ADMIN_REVIEW_INFOS_KEY = 'admin-review-infos'
const ADMIN_REVIEW_RECORDS_KEY = 'admin-review-records'

/**
 * 审核操作业务逻辑 Hook
 */
export function useReviewActions() {
  const queryClient = useQueryClient()

  const reviewActionMutation = useMutation({
    mutationFn: (params: {
      infoId: number
      data: ApiHotelTypes['AdminReviewAction']
    }) => AdminReviewRequest.reviewHotelInfo(params.infoId, params.data),
    onSuccess: () => {
      message.success('审核提交成功')
      void Promise.all([
        queryClient.invalidateQueries({ queryKey: [ADMIN_REVIEW_INFOS_KEY] }),
        queryClient.invalidateQueries({ queryKey: [ADMIN_REVIEW_RECORDS_KEY] }),
      ])
    },
    onError: (error: Error) => {
      message.error(error.message)
    },
  })

  return {
    submit: reviewActionMutation.mutate,
    submitting: reviewActionMutation.isPending,
  }
}

/**
 * 审核信息详情业务逻辑 Hook
 */
export function useReviewInfoDetail(infoId: number | null) {
  const detailQuery = useQuery({
    queryKey: [ADMIN_REVIEW_INFO_DETAIL_KEY, infoId],
    queryFn: () =>
      AdminReviewRequest.getReviewHotelInfoDetail(infoId as number),
    enabled: infoId !== null,
  })

  return {
    info: detailQuery.data,
    loading: detailQuery.isLoading,
  }
}
