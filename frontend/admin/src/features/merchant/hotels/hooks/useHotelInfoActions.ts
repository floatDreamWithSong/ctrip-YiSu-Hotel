import { MerchantHotelRequest } from '@/apis/hotel'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { message } from 'antd'
import { useCallback } from 'react'

const HOTEL_DETAIL_QUERY_KEY = 'merchant-hotel-detail'
const HOTEL_INFOS_QUERY_KEY = 'merchant-hotel-infos'

/**
 * 酒店信息操作 Hook
 * 封装酒店信息的所有状态变更操作
 */
export function useHotelInfoActions(hotelId: number) {
  const queryClient = useQueryClient()

  const refresh = useCallback(() => {
    void Promise.all([
      queryClient.invalidateQueries({ queryKey: [HOTEL_DETAIL_QUERY_KEY, hotelId] }),
      queryClient.invalidateQueries({ queryKey: [HOTEL_INFOS_QUERY_KEY, hotelId] }),
    ])
  }, [queryClient, hotelId])

  // 发布（提交审核）
  const submitMutation = useMutation({
    mutationFn: (infoId: number) => MerchantHotelRequest.submitHotelInfo(hotelId, infoId),
    onSuccess: () => {
      message.success('已提交审核')
      refresh()
    },
    onError: (error: Error) => message.error(error.message),
  })

  // 撤回
  const withdrawMutation = useMutation({
    mutationFn: (infoId: number) => MerchantHotelRequest.withdrawHotelInfo(hotelId, infoId),
    onSuccess: () => {
      message.success('已撤回到待发布状态')
      refresh()
    },
    onError: (error: Error) => message.error(error.message),
  })

  // 下线
  const offlineMutation = useMutation({
    mutationFn: (infoId: number) => MerchantHotelRequest.offlineHotelInfo(hotelId, infoId),
    onSuccess: () => {
      message.success('已下线')
      refresh()
    },
    onError: (error: Error) => message.error(error.message),
  })

  // 创建副本
  const duplicateMutation = useMutation({
    mutationFn: (infoId: number) => MerchantHotelRequest.duplicateHotelInfo(hotelId, infoId),
    onSuccess: () => {
      message.success('酒店信息副本创建成功')
      refresh()
    },
    onError: (error: Error) => message.error(error.message),
  })

  // 删除
  const deleteMutation = useMutation({
    mutationFn: (infoId: number) => MerchantHotelRequest.deleteHotelInfo(hotelId, infoId),
    onSuccess: () => {
      message.success('酒店信息已删除')
      refresh()
    },
    onError: (error: Error) => message.error(error.message),
  })

  return {
    submit: submitMutation.mutate,
    submitting: submitMutation.isPending,
    withdraw: withdrawMutation.mutate,
    withdrawing: withdrawMutation.isPending,
    offline: offlineMutation.mutate,
    offlining: offlineMutation.isPending,
    duplicate: duplicateMutation.mutate,
    duplicating: duplicateMutation.isPending,
    delete: deleteMutation.mutate,
    deleting: deleteMutation.isPending,
  }
}
