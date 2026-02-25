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
import { DateTriggerButton } from '@/components/common/date-trigger-button'
import { GuestRoomCountFields } from '@/components/common/guest-room-count-fields'
import { LocationInput } from '@/components/home/location-input'
import {
  formatYmdDate,
  getStartOfToday,
  isOnOrAfterDate,
  normalizePositiveInt,
  parseYmdDate,
} from '@/lib/hotel-search-form'
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

const Dashboard = () => {
  const navigate = useNavigate()
  const { city } = useLocationStore()
  const searchState = useHotelSearchStore()
  const today = useMemo(() => {
    return getStartOfToday()
  }, [])
  const toValidDate = (value?: string) => {
    const date = parseYmdDate(value)
    return date && isOnOrAfterDate(date, today) ? date : undefined
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
    const trimmedKeyword = searchState.keyword.trim()

    navigate({
      to: '/list/$roomType',
      params: { roomType: searchState.roomType },
      search: {
        page: 1,
        limit: 10,
        sortBy: 'price',
        sortOrder: 'asc',
        city: city,
        keyword: trimmedKeyword,
        checkIn: searchState.checkIn,
        checkOut: searchState.checkOut,
        targetDate: searchState.targetDate,
        guestCount:
          searchState.roomType === 'HOTEL'
            ? normalizePositiveInt(searchState.guestCount)
            : void 0,
        roomCount:
          searchState.roomType === 'HOTEL'
            ? normalizePositiveInt(searchState.roomCount)
            : void 0,
        slotId: searchState.slotId,
        priceMin:
          typeof searchState.priceMin === 'number' && searchState.priceMin > 0
            ? searchState.priceMin
            : void 0,
        priceMax:
          typeof searchState.priceMax === 'number' &&
          searchState.priceMax < PRICE_UNLIMITED
            ? searchState.priceMax
            : void 0,
        starLevels:
          searchState.starLevels.length > 0
            ? searchState.starLevels.join(',')
            : void 0,
        tagIds:
          searchState.tagIds.length > 0 ? searchState.tagIds.join(',') : void 0,
      },
    })
  }

  return (
    <div className="h-full overflow-y-auto bg-[#f6f6f1]">
      <div className="bg-blue-500 px-4 pt-8 pb-14 text-white">
        <div className="text-2xl font-semibold">易宿酒店</div>
        <div className="text-sm/6 opacity-90">酒店查询 · 快捷筛选</div>
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
              <DateTriggerButton
                className="rounded-xl text-sm"
                icon={<CalendarIcon size={16} />}
                onClick={() => {
                  const from = toValidDate(searchState.checkIn)
                  const to = toValidDate(searchState.checkOut)
                  setHotelCalendarValue(from && to ? [from, to] : null)
                  setHotelRangeVisible(true)
                }}
                text={
                  searchState.checkIn && searchState.checkOut
                    ? `${searchState.checkIn} 至 ${searchState.checkOut}，共 ${dayjs(searchState.checkOut).diff(dayjs(searchState.checkIn), 'day')} 晚`
                    : '选择入住/离店日期'
                }
              />
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
                      checkIn: formatYmdDate(value[0]),
                      checkOut: formatYmdDate(value[1]),
                    })
                  }
                  setHotelRangeVisible(false)
                }}
              />
              <GuestRoomCountFields
                guestCount={searchState.guestCount}
                roomCount={searchState.roomCount}
                onGuestCountChange={(value) =>
                  searchState.setState({
                    guestCount: normalizePositiveInt(value),
                  })
                }
                onRoomCountChange={(value) =>
                  searchState.setState({
                    roomCount: normalizePositiveInt(value),
                  })
                }
                inputClassName="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm"
              />
            </div>
          ) : (
            <div className="mb-3">
              <DateTriggerButton
                className="rounded-xl text-sm"
                onClick={() => {
                  setHourlyCalendarValue(
                    toValidDate(searchState.targetDate) ?? null,
                  )
                  setHourlyDateVisible(true)
                }}
                text={searchState.targetDate ?? '选择日期'}
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
                  searchState.setState({ targetDate: formatYmdDate(value) })
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
