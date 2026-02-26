import { useEffect, useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'
import { LocationRequest } from '@yisu/front-utils/apis/location'
import { useLocationStore } from '@/store/location'
import { IndexBar, SpinLoading, Toast } from 'antd-mobile'
import type { ApiLocationTypes } from '@yisu/shared'

type AddressHistoryItem = {
  id: string
  city?: string
  address: string
  location: {
    lng: number
    lat: number
  }
}

const ADDRESS_SEARCH_HISTORY_KEY = 'mobile-address-search-history'
const MAX_HISTORY_COUNT = 3

const readAddressSearchHistory = (): AddressHistoryItem[] => {
  if (typeof window === 'undefined') return []
  try {
    const raw = window.localStorage.getItem(ADDRESS_SEARCH_HISTORY_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as unknown
    if (!Array.isArray(parsed)) return []
    return parsed
      .filter((item): item is AddressHistoryItem => {
        if (!item || typeof item !== 'object') return false
        const candidate = item as Partial<AddressHistoryItem>
        return Boolean(
          candidate.id &&
          candidate.address &&
          candidate.location &&
          typeof candidate.location.lng === 'number' &&
          typeof candidate.location.lat === 'number',
        )
      })
      .slice(0, MAX_HISTORY_COUNT)
  } catch {
    return []
  }
}

const writeAddressSearchHistory = (items: AddressHistoryItem[]) => {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(
    ADDRESS_SEARCH_HISTORY_KEY,
    JSON.stringify(items.slice(0, MAX_HISTORY_COUNT)),
  )
}

const makeHistoryId = (location: { lng: number; lat: number }) =>
  `${location.lng},${location.lat}`

const AddressSearchPage = () => {
  const navigate = useNavigate()
  const { city, updateLocation } = useLocationStore()
  const [keyword, setKeyword] = useState('')
  const [submittedKeyword, setSubmittedKeyword] = useState('')

  const [historyItems, setHistoryItems] = useState<AddressHistoryItem[]>(() =>
    readAddressSearchHistory(),
  )
  const [selectingKey, setSelectingKey] = useState<string | null>(null)
  const isEmptyKeyword = keyword.trim().length === 0

  useEffect(() => {
    const trimmedKeyword = keyword.trim()
    const timer = window.setTimeout(() => {
      setSubmittedKeyword(trimmedKeyword)
    }, 300)

    return () => window.clearTimeout(timer)
  }, [keyword])

  const tipsQuery = useQuery({
    queryKey: ['mobile-address-tips', city, submittedKeyword],
    queryFn: async () => {
      if (!submittedKeyword) return []
      return LocationRequest.inputTips(submittedKeyword, city)
    },
    enabled: Boolean(submittedKeyword),
  })

  const chinaCityIndexQuery = useQuery({
    queryKey: ['mobile-address-china-city-index'],
    queryFn: () => LocationRequest.chinaCityIndex(),
    staleTime: Infinity,
  })

  const cityIndexGroups = useMemo(() => {
    const groups = new Map<
      string,
      Array<ApiLocationTypes['ChinaCityIndexResponse'][number]>
    >()
    if (!chinaCityIndexQuery.data || chinaCityIndexQuery.data.length === 0)
      return []
    for (const item of chinaCityIndexQuery.data) {
      const initial = item.initial.toUpperCase()
      const index = /^[A-Z]$/.test(initial) ? initial : '#'
      const list = groups.get(index) ?? []
      list.push(item)
      groups.set(index, list)
    }

    return Array.from(groups.entries()).map(([index, items]) => ({
      index,
      items: items.sort((a, b) => {
        return a.name.localeCompare(b.name, 'zh-CN')
      }),
    }))
  }, [chinaCityIndexQuery.data])

  const pushHistory = (item: AddressHistoryItem) => {
    setHistoryItems((prev) => {
      const next = [
        item,
        ...prev.filter((record) => record.id !== item.id),
      ].slice(0, MAX_HISTORY_COUNT)
      writeAddressSearchHistory(next)
      return next
    })
  }

  const handleSelectResolvedLocation = (
    regeocode: ApiLocationTypes['RegeocodeResponse'],
  ) => {
    const nextCity = regeocode.city || regeocode.province
    const nextAddress = regeocode.formattedAddress

    updateLocation({
      city: nextCity,
      address: nextAddress,
      location: regeocode.location,
    })

    pushHistory({
      id: makeHistoryId(regeocode.location),
      city: nextCity,
      address: nextAddress,
      location: regeocode.location,
    })

    navigate({ to: '/' })
  }

  const handleSelectLocationByCoordinate = async (
    locationText: string,
    loadingKey: string,
  ) => {
    try {
      setSelectingKey(loadingKey)
      const regeocode = await LocationRequest.regeocode(locationText)
      handleSelectResolvedLocation(regeocode)
    } catch (error) {
      Toast.show({
        icon: 'fail',
        content:
          error instanceof Error ? error.message : '选择地址失败，请重试',
      })
    } finally {
      setSelectingKey(null)
    }
  }

  const handleSelectHistory = (item: AddressHistoryItem) => {
    updateLocation({
      city: item.city,
      address: item.address,
      location: item.location,
    })
    pushHistory(item)
    navigate({ to: '/' })
  }

  return (
    <div className="h-full flex flex-col bg-white ">
      <div className="top-0 z-1000 bg-white px-3 py-3">
        <div className="mb-3 flex items-center justify-between">
          <div className="text-base font-medium">地址搜索</div>
          <button
            className="text-sm text-blue-600"
            onClick={() => navigate({ to: '/' })}
          >
            返回
          </button>
        </div>
        <div className="mb-3 flex gap-2">
          <input
            value={keyword}
            onChange={(event) => setKeyword(event.target.value)}
            placeholder="输入城市、商圈、地标"
            className="w-full rounded-xl px-3 py-2 text-sm outline-2 outline-primary"
          />
          <button
            className="min-w-fit rounded-lg bg-blue-600 px-4 py-2 text-sm text-white"
            onClick={() => {
              // Re-run address lookup when clicking search with same term
              const trimmedKeyword = keyword.trim()
              if (trimmedKeyword === submittedKeyword && trimmedKeyword) {
                void tipsQuery.refetch()
                return
              }
              setSubmittedKeyword(trimmedKeyword)
            }}
            disabled={tipsQuery.isFetching}
          >
            搜索
          </button>
        </div>
      </div>
      <div className="flex min-h-0 flex-1 flex-col">
        {isEmptyKeyword ? (
          <div className="flex min-h-0 flex-1 flex-col">
            {historyItems.length > 0 && (
              <div className="bg-gray-50 p-3">
                <div className="mb-2 flex items-center justify-between">
                  <div className="text-sm font-medium text-gray-800">
                    历史记录
                  </div>
                  <button
                    type="button"
                    className="text-xs text-gray-500 disabled:text-gray-300"
                    disabled={historyItems.length === 0}
                    onClick={() => {
                      setHistoryItems([])
                      if (typeof window !== 'undefined') {
                        window.localStorage.removeItem(
                          ADDRESS_SEARCH_HISTORY_KEY,
                        )
                      }
                    }}
                  >
                    清空
                  </button>
                </div>

                <div className="space-y-2">
                  {historyItems.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      className="w-full rounded-xl bg-white p-3 text-left flex gap-4 items-center"
                      onClick={() => handleSelectHistory(item)}
                    >
                      <div className="text-sm text-nowrap font-medium text-gray-900">
                        {item.city ?? '历史位置'}
                      </div>
                      <div className="text-xs text-nowrap text-gray-500 overflow-hidden text-ellipsis">
                        {item.address}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
            {chinaCityIndexQuery.isLoading ? (
              <div className="flex flex-1 items-center justify-center py-6">
                <SpinLoading />
              </div>
            ) : chinaCityIndexQuery.isError ? (
              <div className="m-3 rounded-xl bg-red-50 p-3 text-xs text-red-500">
                行政区数据加载失败
                <button
                  type="button"
                  className="ml-2 text-red-600 underline"
                  onClick={() => void chinaCityIndexQuery.refetch()}
                >
                  重试
                </button>
              </div>
            ) : cityIndexGroups.length === 0 ? (
              <div className="m-3 rounded-xl bg-gray-50 p-3 text-xs text-gray-400">
                暂无行政区数据
              </div>
            ) : (
              <div className="min-h-0 flex-1 overflow-y-auto">
                <IndexBar>
                  {cityIndexGroups.map((group) => (
                    <IndexBar.Panel
                      index={group.index}
                      title={group.index}
                      brief={group.index}
                      key={group.index}
                    >
                      {group.items.map((item) => {
                        const itemKey = `city-${item.adcode}`
                        const centerText = `${item.center.lng},${item.center.lat}`
                        const isSelecting = selectingKey === itemKey
                        return (
                          <button
                            key={item.adcode}
                            type="button"
                            className="flex w-full items-center justify-between py-3 text-left text-sm text-gray-800"
                            disabled={isSelecting}
                            onClick={() =>
                              void handleSelectLocationByCoordinate(
                                centerText,
                                itemKey,
                              )
                            }
                          >
                            <span className="ml-3">{item.name}</span>
                            {isSelecting ? <SpinLoading /> : null}
                          </button>
                        )
                      })}
                    </IndexBar.Panel>
                  ))}
                </IndexBar>
              </div>
            )}
          </div>
        ) : (
          <>
            {tipsQuery.isFetching ? (
              <div className="flex justify-center">
                <SpinLoading />
              </div>
            ) : null}
            {(tipsQuery.data ?? []).map((item) => {
              const itemKey = `tip-${item.name}-${item.location ?? 'unknown'}`
              const isSelecting = selectingKey === itemKey
              return (
                <div
                  key={`${item.name}-${item.location}`}
                  className="rounded-xl border border-gray-100 p-3"
                  onClick={() => {
                    if (!item.location || isSelecting) return
                    void handleSelectLocationByCoordinate(
                      item.location,
                      itemKey,
                    )
                  }}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="text-sm font-medium">{item.name}</div>
                    {isSelecting ? <SpinLoading /> : null}
                  </div>
                  <div className="mt-1 text-xs text-gray-500">
                    {item.address ?? '-'}
                  </div>
                </div>
              )
            })}
            {!tipsQuery.isPending && (tipsQuery.data?.length ?? 0) === 0 ? (
              <div className="rounded-xl bg-gray-50 p-3 text-center text-xs text-gray-400">
                未找到相关地址
              </div>
            ) : null}
          </>
        )}
      </div>
    </div>
  )
}

export default AddressSearchPage
