import { MerchantHotelRequest } from '@/apis/hotel'
import { useTable } from '@/hooks/useTable'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { message } from 'antd'
import { useCallback, useMemo } from 'react'

const HOTELS_QUERY_KEY = 'merchant-hotels'

interface HotelsFilter extends Record<string, unknown> {
  keyword?: string
}

/**
 * 商家端酒店列表业务逻辑 Hook
 * 封装查询、分页、筛选、删除等操作
 */
export function useHotels() {
  const queryClient = useQueryClient()
  const { page, pageSize, filters, pagination, updateFilter } = useTable<HotelsFilter>()

  const keyword = filters.keyword

  // 查询酒店列表
  const hotelsQuery = useQuery({
    queryKey: [HOTELS_QUERY_KEY, page, pageSize, keyword],
    queryFn: () =>
      MerchantHotelRequest.getHotels({
        page,
        limit: pageSize,
        keyword: keyword?.trim() || undefined,
      }),
  })

  // 删除酒店
  const deleteHotelMutation = useMutation({
    mutationFn: MerchantHotelRequest.deleteHotel,
    onSuccess: () => {
      message.success('酒店已删除')
      void queryClient.invalidateQueries({ queryKey: [HOTELS_QUERY_KEY] })
    },
    onError: (error: Error) => message.error(error.message),
  })

  // 处理搜索
  const handleSearch = useCallback(
    (value: string) => {
      updateFilter('keyword', value)
    },
    [updateFilter]
  )

  // 处理删除
  const handleDelete = useCallback(
    (hotelId: number) => {
      deleteHotelMutation.mutate(hotelId)
    },
    [deleteHotelMutation]
  )

  // 刷新列表
  const refresh = useCallback(() => {
    void queryClient.invalidateQueries({ queryKey: [HOTELS_QUERY_KEY] })
  }, [queryClient])

  const hotels = useMemo(() => hotelsQuery.data?.items ?? [], [hotelsQuery.data])
  const total = useMemo(() => hotelsQuery.data?.total ?? 0, [hotelsQuery.data])

  return {
    hotels,
    loading: hotelsQuery.isLoading,
    pagination: {
      ...pagination,
      total,
    },
    keyword,
    handleSearch,
    handleDelete,
    deleting: deleteHotelMutation.isPending,
    refresh,
  }
}
