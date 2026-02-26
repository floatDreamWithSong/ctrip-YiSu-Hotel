import { MerchantHotelRequest } from '@/apis/hotel'
import { hotelDetailQueryOptions } from '../queries/hotelQueries'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { ApiHotelTypes } from '@yisu/shared'
import { message } from 'antd'
import { useCallback, useMemo } from 'react'

/**
 * 酒店详情业务逻辑 Hook
 */
export function useHotelDetail(hotelId: number) {
  const queryClient = useQueryClient()

  // 使用共享 QueryOptions，与 route loader 的 ensureQueryData 共享同一 queryKey
  // 悬停预取后进入详情页时，此处 useQuery 会直接命中缓存，实现零等待
  const hotelDetailQuery = useQuery(hotelDetailQueryOptions(hotelId))

  const updateHomeAdMutation = useMutation({
    mutationFn: (data: ApiHotelTypes['HotelUpdateHomeAd']) =>
      MerchantHotelRequest.updateHomeAdEnabled(hotelId, data),
    onSuccess: () => {
      message.success('首页广告推送设置已更新')
      void queryClient.invalidateQueries({
        queryKey: ['merchant-hotel-detail', hotelId],
      })
    },
    onError: (error: Error) => message.error(error.message),
  })

  const handleUpdateHomeAd = useCallback(
    (enabled: boolean) => {
      updateHomeAdMutation.mutate({ isHomeAdEnabled: enabled })
    },
    [updateHomeAdMutation],
  )

  const hotel = useMemo(() => hotelDetailQuery.data, [hotelDetailQuery.data])

  return {
    hotel,
    loading: hotelDetailQuery.isLoading,
    updateHomeAd: handleUpdateHomeAd,
    updatingHomeAd: updateHomeAdMutation.isPending,
  }
}
