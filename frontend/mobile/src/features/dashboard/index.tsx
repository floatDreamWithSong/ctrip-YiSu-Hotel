import { useMemo, useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import {
  Button,
  CalendarPicker,
  Image,
  Input,
  Selector,
  Slider,
  Swiper,
} from 'antd-mobile'
import { MobileHotelRequest } from '@yisu/front-utils/apis/hotel-mobile'
import { LocationInput } from '@/components/home/location-input'
import { NumberKeyboardInput } from '@/components/common/number-keyboard-input'
import { useLocationStore } from '@/store/location'
import { useHotelSearchStore, type RoomTypeTab } from '@/store/hotel-search'
import dayjs from 'dayjs'
import { CalendarIcon } from 'lucide-react'

const roomTypeOptions = [
  { label: '酒店', value: 'HOTEL' },
  { label: '钟点房', value: 'HOURLY' },
] as const

const starOptions = [
  { label: '二星', value: 2 },
  { label: '三星', value: 3 },
  { label: '四星', value: 4 },
  { label: '五星', value: 5 },
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
const normalizePositiveInt = (value?: number) =>
  Number.isInteger(value) && (value as number) >= 1 ? (value as number) : 1

const Dashboard = () => {
  const navigate = useNavigate()
  const { city, location } = useLocationStore()
  const searchState = useHotelSearchStore()
  const today = useMemo(() => {
    const date = new Date()
    date.setHours(0, 0, 0, 0)
    return date
  }, [])
  const toValidDate = (value?: string) => {
    const date = parseDate(value)
    return date && isOnOrAfter(date, today) ? date : undefined
  }
  const [hotelRangeVisible, setHotelRangeVisible] = useState(false)
  const [hourlyDateVisible, setHourlyDateVisible] = useState(false)
  const [hotelCalendarValue, setHotelCalendarValue] = useState<
    [Date, Date] | null
  >(() => {
    const from = toValidDate(searchState.checkIn)
    const to = toValidDate(searchState.checkOut)
    return from && to ? [from, to] : null
  })
  const [hourlyCalendarValue, setHourlyCalendarValue] = useState<Date | null>(
    () => toValidDate(searchState.targetDate) ?? null,
  )
  const sliderValue: [number, number] = [
    searchState.priceMin ?? 0,
    searchState.priceMax ?? PRICE_UNLIMITED,
  ]
  const tagsQuery = useQuery({
    queryKey: ['mobile-hotel-tags'],
    queryFn: () => MobileHotelRequest.getTags(),
  })
  const bannersQuery = useQuery({
    queryKey: ['mobile-home-banners', city],
    queryFn: () =>
      MobileHotelRequest.getHomeBanners({
        city,
        limit: 3,
      }),
  })

  const tagOptions = useMemo(
    () =>
      (tagsQuery.data ?? [])
        .slice(0, 8)
        .map((item) => ({ label: item.name, value: item.id })),
    [tagsQuery.data],
  )

  const handleSearch = () => {
    const query = new URLSearchParams()
    query.set('page', '1')
    query.set('limit', '10')
    query.set('sortBy', 'price')
    query.set('sortOrder', 'asc')
    if (city) query.set('city', city)
    if (searchState.keyword.trim())
      query.set('keyword', searchState.keyword.trim())
    if (searchState.checkIn) query.set('checkIn', searchState.checkIn)
    if (searchState.checkOut) query.set('checkOut', searchState.checkOut)
    if (searchState.targetDate) query.set('targetDate', searchState.targetDate)
    if (searchState.roomType === 'HOTEL') {
      query.set(
        'guestCount',
        String(normalizePositiveInt(searchState.guestCount)),
      )
      query.set(
        'roomCount',
        String(normalizePositiveInt(searchState.roomCount)),
      )
    }
    if (searchState.slotId) query.set('slotId', String(searchState.slotId))
    if (searchState.priceMin)
      query.set('priceMin', String(searchState.priceMin))
    if (
      typeof searchState.priceMax === 'number' &&
      searchState.priceMax < PRICE_UNLIMITED
    ) {
      query.set('priceMax', String(searchState.priceMax))
    }
    if (searchState.starLevels.length > 0)
      query.set('starLevels', searchState.starLevels.join(','))
    if (searchState.tagIds.length > 0)
      query.set('tagIds', searchState.tagIds.join(','))
    if (location) {
      query.set('userLng', String(location.lng))
      query.set('userLat', String(location.lat))
    }
    window.location.href = `/list/${searchState.roomType}?${query.toString()}`
  }

  return (
    <div className="h-full overflow-y-auto bg-[#f6f6f1]">
      <div className="bg-blue-500 px-4 pt-8 pb-14 text-white">
        <div className="text-2xl font-semibold">易宿酒店</div>
        <div className="text-sm/6 opacity-90">酒店查询 · 筛选 · 快速预订</div>
      </div>

      <div className="-mt-8 px-4">
        <div className="overflow-hidden rounded-2xl bg-white p-2 shadow-sm">
          {(bannersQuery.data ?? []).length > 0 ? (
            <Swiper autoplay loop>
              {(bannersQuery.data ?? []).map((banner) => (
                <Swiper.Item key={`${banner.hotelId}-${banner.infoId}`}>
                  <div
                    className="relative cursor-pointer"
                    onClick={() =>
                      navigate({
                        to: '/hotel/$hotelId',
                        params: { hotelId: String(banner.hotelId) },
                      })
                    }
                  >
                    {banner.coverImage ? (
                      <Image
                        src={banner.coverImage}
                        fit="cover"
                        width="100%"
                        height={148}
                        className="rounded-xl"
                      />
                    ) : (
                      <div className="h-[148px] w-full rounded-xl bg-gray-100" />
                    )}
                    <div className="absolute bottom-2 left-2 rounded bg-black/45 px-2 py-1 text-xs text-white">
                      {banner.name}
                    </div>
                  </div>
                </Swiper.Item>
              ))}
            </Swiper>
          ) : (
            <div className="h-[148px] w-full rounded-xl bg-gray-100" />
          )}
        </div>
      </div>

      <div className="mt-3 px-4 pb-6">
        <div className="rounded-2xl bg-white p-4 shadow-sm">
          <div className="mb-4">
            <Selector
              options={roomTypeOptions.map((item) => ({
                label: item.label,
                value: item.value,
              }))}
              value={[searchState.roomType]}
              onChange={(value) =>
                searchState.setState({
                  roomType: (value[0] ?? 'HOTEL') as RoomTypeTab,
                })
              }
            />
          </div>
          <div className="mb-3">
            <div className="mb-1 text-xs text-gray-500">当前地点</div>
            <LocationInput />
          </div>
          <div className="mb-3">
            <div className="mb-1 text-xs text-gray-500">关键词</div>
            <Input
              value={searchState.keyword}
              onChange={(value) => searchState.setState({ keyword: value })}
              clearable
              placeholder="酒店名称、英文名、简介"
              className="w-full "
            />
          </div>
          {searchState.roomType === 'HOTEL' ? (
            <div className="mb-3">
              <button
                className="w-full rounded-xl border border-gray-200 px-3 py-2 text-left text-sm flex items-center gap-2"
                onClick={() => {
                  const from = toValidDate(searchState.checkIn)
                  const to = toValidDate(searchState.checkOut)
                  setHotelCalendarValue(from && to ? [from, to] : null)
                  setHotelRangeVisible(true)
                }}
              >
                <CalendarIcon size={16} />
                {searchState.checkIn && searchState.checkOut
                  ? `${searchState.checkIn} 至 ${searchState.checkOut}，共 ${dayjs(searchState.checkOut).diff(dayjs(searchState.checkIn), 'day')} 晚`
                  : '选择入住/离店日期'}
              </button>
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
                  if (!value) {
                    searchState.setState({
                      checkIn: undefined,
                      checkOut: undefined,
                    })
                  } else {
                    searchState.setState({
                      checkIn: formatDate(value[0]),
                      checkOut: formatDate(value[1]),
                    })
                  }
                  setHotelRangeVisible(false)
                }}
              />
              <div className="mt-2 grid grid-cols-2 gap-2">
                <div>
                  <div className="mb-1 text-xs text-gray-500">入住人数</div>
                  <NumberKeyboardInput
                    value={searchState.guestCount}
                    onChange={(value) =>
                      searchState.setState({
                        guestCount: normalizePositiveInt(value),
                      })
                    }
                    className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <div className="mb-1 text-xs text-gray-500">房间数量</div>
                  <NumberKeyboardInput
                    value={searchState.roomCount}
                    onChange={(value) =>
                      searchState.setState({
                        roomCount: normalizePositiveInt(value),
                      })
                    }
                    className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm"
                  />
                </div>
              </div>
            </div>
          ) : (
            <div className="mb-3">
              <button
                className="w-full rounded-xl border border-gray-200 px-3 py-2 text-left text-sm"
                onClick={() => {
                  setHourlyCalendarValue(
                    toValidDate(searchState.targetDate) ?? null,
                  )
                  setHourlyDateVisible(true)
                }}
              >
                {searchState.targetDate ?? '选择日期'}
              </button>
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
                  searchState.setState({ targetDate: formatDate(value) })
                  setHourlyDateVisible(false)
                }}
              />
            </div>
          )}
          <div className="mb-3">
            <div className="mb-1 text-xs text-gray-500">
              价格范围：{sliderValue[0]} -{' '}
              {sliderValue[1] >= PRICE_UNLIMITED ? '不限' : sliderValue[1]}
            </div>
            <Slider
              range
              min={0}
              max={PRICE_UNLIMITED}
              step={100}
              ticks
              marks={priceMarks}
              value={sliderValue}
              onChange={(value) => {
                const [min, max] = value as [number, number]
                searchState.setState({
                  priceMin: min,
                  priceMax: max >= PRICE_UNLIMITED ? undefined : max,
                })
              }}
            />
          </div>
          <div className="mb-3">
            <div className="mb-1 text-xs text-gray-500">星级</div>
            <Selector
              options={starOptions}
              value={searchState.starLevels}
              multiple
              onChange={(value) =>
                searchState.setState({ starLevels: value as number[] })
              }
            />
          </div>
          {tagOptions.length > 0 && (
            <div className="mb-4">
              <div className="mb-1 text-xs text-gray-500">快捷标签</div>
              <Selector
                options={tagOptions}
                value={searchState.tagIds}
                multiple
                onChange={(value) =>
                  searchState.setState({ tagIds: value as number[] })
                }
              />
            </div>
          )}
          <Button
            color="primary"
            block
            size="large"
            shape="rounded"
            onClick={handleSearch}
          >
            搜索酒店
          </Button>
        </div>
      </div>
    </div>
  )
}

export default Dashboard
