import { MerchantHotelRequest } from '@/apis/hotel'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { ApiHotelTypes } from '@yisu/shared'
import { message } from 'antd'
import { useCallback, useMemo } from 'react'
import {
  HOTEL_DETAIL_QUERY_KEY,
  hotelDetailQueryOptions,
} from '../queries/hotelQueries'

/**
 * 酒店详情业务逻辑 Hook
 */
export function useHotelDetail(hotelId: number) {
  const queryClient = useQueryClient()

  const hotelDetailQuery = useQuery(hotelDetailQueryOptions(hotelId))

  const updateHomeAdMutation = useMutation({
    mutationFn: (data: ApiHotelTypes['HotelUpdateHomeAd']) =>
      MerchantHotelRequest.updateHomeAdEnabled(hotelId, data),
    onSuccess: () => {
      message.success('首页广告推送设置已更新')
      void queryClient.invalidateQueries({
        queryKey: [HOTEL_DETAIL_QUERY_KEY, hotelId],
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
