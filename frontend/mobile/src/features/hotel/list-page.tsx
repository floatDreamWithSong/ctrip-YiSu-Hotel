import { useMemo, useState } from 'react'
import { useInfiniteQuery, useMutation, useQuery } from '@tanstack/react-query'
import { useNavigate, useParams } from '@tanstack/react-router'
import {
  CalendarPicker,
  Dropdown,
  InfiniteScroll,
  Loading,
  Selector,
  Slider,
  Toast,
} from 'antd-mobile'
import { LocationFill } from 'antd-mobile-icons'
import { MobileHotelRequest } from '@yisu/front-utils/apis/hotel-mobile'
import { LocationRequest } from '@yisu/front-utils/apis/location'
import { getCurrentPosition } from '@yisu/front-utils/geolocation'
import { NumberKeyboardInput } from '@/components/common/number-keyboard-input'
import { useLocationStore } from '@/store/location'
import { useHotelSearchStore } from '@/store/hotel-search'
import HotelListCard from './components/hotel-list-card'

const sortOptions = [
  { label: '价格', value: 'price' },
  { label: '距离', value: 'distance' },
  { label: '星级', value: 'starLevel' },
]
const PRICE_UNLIMITED = 600 as const
const priceMarks = {
  0: '0',
  100: '100',
  200: '200',
  300: '300',
  400: '400',
  500: '500',
  [PRICE_UNLIMITED]: '不限',
}

const parseNumber = (value?: string) => {
  if (!value) return undefined
  const num = Number(value)
  return Number.isFinite(num) ? num : undefined
}
const normalizePositiveInt = (value?: number) =>
  Number.isInteger(value) && (value as number) >= 1 ? (value as number) : 1

const getSearchParams = () => {
  const params = new URLSearchParams(window.location.search)
  return {
    city: params.get('city') ?? undefined,
    district: params.get('district') ?? undefined,
    keyword: params.get('keyword') ?? undefined,
    checkIn: params.get('checkIn') ?? undefined,
    checkOut: params.get('checkOut') ?? undefined,
    targetDate: params.get('targetDate') ?? undefined,
    guestCount: params.get('guestCount') ?? undefined,
    roomCount: params.get('roomCount') ?? undefined,
    slotId: params.get('slotId') ?? undefined,
    priceMin: params.get('priceMin') ?? undefined,
    priceMax: params.get('priceMax') ?? undefined,
    starLevels: params.get('starLevels') ?? undefined,
    tagIds: params.get('tagIds') ?? undefined,
    distanceKm: params.get('distanceKm') ?? undefined,
    sortBy: params.get('sortBy') ?? undefined,
    sortOrder: params.get('sortOrder') ?? undefined,
    page: params.get('page') ?? '1',
    limit: params.get('limit') ?? '10',
  }
}

const calcNights = (checkIn?: string, checkOut?: string) => {
  if (!checkIn || !checkOut) return undefined
  const start = new Date(checkIn)
  const end = new Date(checkOut)
  const diff = Math.ceil(
    (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24),
  )
  if (!Number.isFinite(diff) || diff <= 0) return undefined
  return diff
}

const formatDate = (date?: Date | null) => {
  if (!date) return undefined
  const year = date.getFullYear()
  const month = `${date.getMonth() + 1}`.padStart(2, '0')
  const day = `${date.getDate()}`.padStart(2, '0')
  return `${year}-${month}-${day}`
}

const parseDate = (value?: string) => {
  if (!value) return undefined
  const [year, month, day] = value.split('-').map((item) => Number(item))
  if (!year || !month || !day) return undefined
  return new Date(year, month - 1, day)
}

const isOnOrAfter = (date: Date, target: Date) =>
  date.getTime() >= target.getTime()

const HotelListPage = () => {
  const navigate = useNavigate()
  const params = useParams({ from: '/_authenticated/list/$roomType' })
  const search = getSearchParams()
  const { city, location, updateLocation } = useLocationStore()
  const searchStore = useHotelSearchStore()
  const tagsQuery = useQuery({
    queryKey: ['mobile-tags-list'],
    queryFn: () => MobileHotelRequest.getTags(),
  })
  const [keyword, setKeyword] = useState(search.keyword ?? '')
  const [priceRange, setPriceRange] = useState<[number, number]>([
    Number(search.priceMin ?? 0),
    Number(search.priceMax ?? PRICE_UNLIMITED),
  ])
  const today = useMemo(() => {
    const date = new Date()
    date.setHours(0, 0, 0, 0)
    return date
  }, [])
  const toValidDate = (value?: string) => {
    const date = parseDate(value)
    return date && isOnOrAfter(date, today) ? date : undefined
  }
  const [checkIn, setCheckIn] = useState<string | undefined>(() => {
    const date = toValidDate(search.checkIn)
    return date ? formatDate(date) : undefined
  })
  const [checkOut, setCheckOut] = useState<string | undefined>(() => {
    const date = toValidDate(search.checkOut)
    return date ? formatDate(date) : undefined
  })
  const [targetDate, setTargetDate] = useState<string | undefined>(() => {
    const date = toValidDate(search.targetDate)
    return date ? formatDate(date) : undefined
  })
  const [guestCount, setGuestCount] = useState(() =>
    normalizePositiveInt(parseNumber(search.guestCount)),
  )
  const [roomCount, setRoomCount] = useState(() =>
    normalizePositiveInt(parseNumber(search.roomCount)),
  )
  const [starLevels, setStarLevels] = useState<number[]>(
    search.starLevels
      ? search.starLevels
          .split(',')
          .map((item) => Number(item))
          .filter((item) => Number.isInteger(item))
      : [],
  )
  const [tagIds, setTagIds] = useState<number[]>(
    search.tagIds
      ? search.tagIds
          .split(',')
          .map((item) => Number(item))
          .filter((item) => Number.isInteger(item))
      : [],
  )
  const [sortBy, setSortBy] = useState(search.sortBy ?? 'price')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>(
    (search.sortOrder as 'asc' | 'desc') ?? 'asc',
  )
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null)
  const [hotelRangeVisible, setHotelRangeVisible] = useState(false)
  const [hourlyDateVisible, setHourlyDateVisible] = useState(false)
  const [hotelCalendarValue, setHotelCalendarValue] = useState<
    [Date, Date] | null
  >(() => {
    const from = toValidDate(checkIn)
    const to = toValidDate(checkOut)
    return from && to ? [from, to] : null
  })
  const [hourlyCalendarValue, setHourlyCalendarValue] = useState<Date | null>(
    () => toValidDate(targetDate) ?? null,
  )
  const currentCity = city ?? search.city ?? '未定位'
  const relocateMutation = useMutation({
    mutationFn: async () => {
      const pos = await getCurrentPosition()
      return LocationRequest.regeocode(`${pos.lng},${pos.lat}`)
    },
    onSuccess: (data) => {
      updateLocation({
        city: data.city || data.province,
        address: data.formattedAddress,
        location: data.location,
      })
      Toast.show({
        icon: 'success',
        content: '定位成功',
      })
    },
    onError: (error: Error) => {
      Toast.show({
        icon: 'fail',
        content: error.message || '定位失败，请重试',
      })
    },
  })

  const queryResult = useInfiniteQuery({
    queryKey: [
      'mobile-hotel-list',
      params.roomType,
      currentCity,
      search.district,
      checkIn,
      checkOut,
      targetDate,
      guestCount,
      roomCount,
      search.slotId,
      keyword,
      priceRange[0],
      priceRange[1],
      starLevels.join(','),
      tagIds.join(','),
      sortBy,
      sortOrder,
      location?.lng,
      location?.lat,
    ],
    initialPageParam: Number(search.page ?? 1),
    queryFn: ({ pageParam }) =>
      MobileHotelRequest.searchHotels({
        page: pageParam,
        limit: Number(search.limit ?? 10),
        roomType: params.roomType as 'HOTEL' | 'HOURLY',
        city: currentCity === '未定位' ? undefined : currentCity,
        district: search.district,
        keyword,
        checkIn,
        checkOut,
        targetDate,
        guestCount,
        roomCount,
        slotId: parseNumber(search.slotId),
        priceMin: priceRange[0],
        priceMax: priceRange[1] >= PRICE_UNLIMITED ? undefined : priceRange[1],
        starLevels: starLevels.length > 0 ? starLevels.join(',') : undefined,
        tagIds: tagIds.length > 0 ? tagIds.join(',') : undefined,
        distanceKm: parseNumber(search.distanceKm),
        sortBy: sortBy as 'price' | 'distance' | 'starLevel',
        sortOrder,
        userLng: location?.lng,
        userLat: location?.lat,
      }),
    getNextPageParam: (lastPage) => {
      const currentCount = lastPage.page * lastPage.limit
      if (currentCount >= lastPage.total) return undefined
      return lastPage.page + 1
    },
  })

  const data = useMemo(
    () => queryResult.data?.pages.flatMap((page) => page.items) ?? [],
    [queryResult.data],
  )
  const hasMore = queryResult.hasNextPage
  const canUseDistance = Boolean(location?.lng && location?.lat)
  const nights = calcNights(checkIn, checkOut)

  return (
    <div className="h-full overflow-y-hidden">
      <div className="h-full overflow-y-auto bg-[#f4f4f2] px-3 pb-4">
        <div className="sticky top-0 z-10 mb-3 bg-[#f4f4f2] pt-3">
          <div className="mb-2 flex items-center justify-between">
            <div className="text-base font-semibold">
              {params.roomType === 'HOURLY' ? '钟点房列表' : '酒店列表'}
            </div>
            <button
              onClick={() => navigate({ to: '/' })}
              className="text-sm text-blue-600"
            >
              返回首页
            </button>
          </div>
          <div className="mb-2 flex items-center gap-2">
            <div className="flex shrink-0 items-center gap-1 rounded-xl bg-white px-2 py-2 text-xs text-gray-600">
              <span>{currentCity}</span>
              <button
                type="button"
                aria-label="重新定位"
                className="text-gray-500"
                disabled={relocateMutation.isPending}
                onClick={() => relocateMutation.mutate()}
              >
                {relocateMutation.isPending ? <Loading /> : <LocationFill />}
              </button>
            </div>
            <input
              value={keyword}
              onChange={(event) => setKeyword(event.target.value)}
              placeholder="酒店名称、英文名、简介"
              className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm"
            />
          </div>
          <div className="mb-2 rounded-xl bg-white px-2">
            <Dropdown activeKey={activeDropdown} onChange={setActiveDropdown}>
              <Dropdown.Item key="tags" title="快捷标签">
                <div className="p-3">
                  {(tagsQuery.data ?? []).length > 0 ? (
                    <Selector
                      options={(tagsQuery.data ?? [])
                        .slice(0, 12)
                        .map((item) => ({ label: item.name, value: item.id }))}
                      value={tagIds}
                      multiple
                      onChange={(value) => setTagIds(value as number[])}
                    />
                  ) : (
                    <div className="text-xs text-gray-400">暂无标签可选</div>
                  )}
                </div>
              </Dropdown.Item>
              <Dropdown.Item key="date" title="日期">
                <div className="p-3">
                  {params.roomType === 'HOTEL' ? (
                    <button
                      className="w-full rounded-lg border border-gray-200 px-3 py-2 text-left text-sm"
                      onClick={() => {
                        setActiveDropdown(null)
                        const from = toValidDate(checkIn)
                        const to = toValidDate(checkOut)
                        setHotelCalendarValue(from && to ? [from, to] : null)
                        setHotelRangeVisible(true)
                      }}
                    >
                      {checkIn && checkOut
                        ? `${checkIn} 至 ${checkOut}`
                        : '选择入住/离店日期'}
                    </button>
                  ) : (
                    <button
                      className="w-full rounded-lg border border-gray-200 px-3 py-2 text-left text-sm"
                      onClick={() => {
                        setActiveDropdown(null)
                        setHourlyCalendarValue(toValidDate(targetDate) ?? null)
                        setHourlyDateVisible(true)
                      }}
                    >
                      {targetDate ?? '选择日期'}
                    </button>
                  )}
                  <div className="mt-2 text-xs text-gray-500">
                    {params.roomType === 'HOTEL'
                      ? `入住：${checkIn ?? '-'} 离店：${checkOut ?? '-'} ${nights ? `· 共${nights}晚` : ''}`
                      : `日期：${targetDate ?? '-'}`}
                  </div>
                  {params.roomType === 'HOTEL' && (
                    <div className="mt-3 grid grid-cols-2 gap-2">
                      <div>
                        <div className="mb-1 text-xs text-gray-500">
                          入住人数
                        </div>
                        <NumberKeyboardInput
                          value={guestCount}
                          onChange={(value) =>
                            setGuestCount(normalizePositiveInt(value))
                          }
                          className="w-full rounded-lg border border-gray-200 px-2 py-2 text-sm"
                        />
                      </div>
                      <div>
                        <div className="mb-1 text-xs text-gray-500">
                          房间数量
                        </div>
                        <NumberKeyboardInput
                          value={roomCount}
                          onChange={(value) =>
                            setRoomCount(normalizePositiveInt(value))
                          }
                          className="w-full rounded-lg border border-gray-200 px-2 py-2 text-sm"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </Dropdown.Item>
              <Dropdown.Item key="price-star" title="价格/星级">
                <div className="space-y-3 p-3">
                  <div className="text-xs text-gray-500">
                    价格：{priceRange[0]} -{' '}
                    {priceRange[1] >= PRICE_UNLIMITED ? '不限' : priceRange[1]}
                  </div>
                  <Slider
                    range
                    min={0}
                    max={PRICE_UNLIMITED}
                    step={100}
                    ticks
                    marks={priceMarks}
                    value={priceRange}
                    onChange={(value) =>
                      setPriceRange(value as [number, number])
                    }
                  />
                  <Selector
                    options={[
                      { label: '二星', value: 2 },
                      { label: '三星', value: 3 },
                      { label: '四星', value: 4 },
                      { label: '五星', value: 5 },
                    ]}
                    value={starLevels}
                    multiple
                    onChange={(value) => setStarLevels(value as number[])}
                  />
                </div>
              </Dropdown.Item>
              <Dropdown.Item key="sort" title="排序">
                <div className="space-y-3 p-3">
                  <Selector
                    options={sortOptions.filter(
                      (item) => canUseDistance || item.value !== 'distance',
                    )}
                    value={[sortBy]}
                    onChange={(value) =>
                      setSortBy((value[0] as string) ?? 'price')
                    }
                  />
                  <div className="flex gap-2">
                    <button
                      className={`rounded-lg border px-3 py-1 text-xs ${
                        sortOrder === 'asc'
                          ? 'border-blue-600 bg-blue-50 text-blue-600'
                          : 'border-gray-200 bg-white text-gray-700'
                      }`}
                      onClick={() => setSortOrder('asc')}
                    >
                      升序
                    </button>
                    <button
                      className={`rounded-lg border px-3 py-1 text-xs ${
                        sortOrder === 'desc'
                          ? 'border-blue-600 bg-blue-50 text-blue-600'
                          : 'border-gray-200 bg-white text-gray-700'
                      }`}
                      onClick={() => setSortOrder('desc')}
                    >
                      降序
                    </button>
                  </div>
                  {!canUseDistance && (
                    <div className="text-xs text-orange-500">
                      开启定位后可按距离排序
                    </div>
                  )}
                </div>
              </Dropdown.Item>
            </Dropdown>
          </div>
        </div>
        <CalendarPicker
          visible={hotelRangeVisible}
          selectionMode="range"
          min={today}
          value={hotelCalendarValue}
          onChange={(value) => setHotelCalendarValue(value)}
          onClose={() => setHotelRangeVisible(false)}
          onMaskClick={() => setHotelRangeVisible(false)}
          closeOnMaskClick
          onConfirm={(value) => {
            if (value) {
              setCheckIn(formatDate(value[0]))
              setCheckOut(formatDate(value[1]))
            } else {
              setCheckIn(undefined)
              setCheckOut(undefined)
            }
            setHotelRangeVisible(false)
            setActiveDropdown(null)
          }}
        />
        <CalendarPicker
          visible={hourlyDateVisible}
          selectionMode="single"
          min={today}
          value={hourlyCalendarValue}
          onChange={(value) => setHourlyCalendarValue(value)}
          onClose={() => setHourlyDateVisible(false)}
          onMaskClick={() => setHourlyDateVisible(false)}
          closeOnMaskClick
          onConfirm={(value) => {
            setTargetDate(formatDate(value))
            setHourlyDateVisible(false)
            setActiveDropdown(null)
          }}
        />

        <div className="space-y-3">
          {data.map((item) => (
            <HotelListCard
              key={`${item.hotelId}-${item.infoId}`}
              onClick={() => {
                const currentRoomType = params.roomType as 'HOTEL' | 'HOURLY'
                searchStore.setState({
                  roomType: currentRoomType,
                  keyword,
                  checkIn: currentRoomType === 'HOTEL' ? checkIn : undefined,
                  checkOut: currentRoomType === 'HOTEL' ? checkOut : undefined,
                  targetDate:
                    currentRoomType === 'HOURLY' ? targetDate : undefined,
                  guestCount:
                    currentRoomType === 'HOTEL'
                      ? guestCount
                      : searchStore.guestCount,
                  roomCount:
                    currentRoomType === 'HOTEL'
                      ? roomCount
                      : searchStore.roomCount,
                })
                navigate({
                  to: '/hotel/$hotelId',
                  params: { hotelId: String(item.hotelId) },
                  search: {
                    roomType: currentRoomType,
                    checkIn: currentRoomType === 'HOTEL' ? checkIn : undefined,
                    checkOut:
                      currentRoomType === 'HOTEL' ? checkOut : undefined,
                    targetDate:
                      currentRoomType === 'HOURLY' ? targetDate : undefined,
                    guestCount:
                      currentRoomType === 'HOTEL' ? guestCount : undefined,
                    roomCount:
                      currentRoomType === 'HOTEL' ? roomCount : undefined,
                  },
                })
              }}
              item={item}
            />
          ))}
        </div>

        <InfiniteScroll
          loadMore={async () => {
            await queryResult.fetchNextPage()
          }}
          hasMore={Boolean(hasMore)}
        />
      </div>
    </div>
  )
}

export default HotelListPage
