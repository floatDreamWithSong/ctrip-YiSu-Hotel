import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useNavigate, useParams, useSearch } from '@tanstack/react-router'
import { CalendarPicker, Swiper, Tabs } from 'antd-mobile'
import { MobileHotelRequest } from '@yisu/front-utils/apis/hotel-mobile'
import { NumberKeyboardInput } from '@/components/common/number-keyboard-input'
import { useHotelSearchStore } from '@/store/hotel-search'
import HotelListCard from './components/hotel-list-card'
import { CalendarIcon } from 'lucide-react'

type IntentRoomType = 'HOTEL' | 'HOURLY'

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
const normalizePositiveInt = (value?: number) =>
  Number.isInteger(value) && (value as number) >= 1 ? (value as number) : 1

const HotelDetailPage = () => {
  const navigate = useNavigate()
  const { hotelId } = useParams({ from: '/_authenticated/hotel/$hotelId' })
  const search = useSearch({ from: '/_authenticated/hotel/$hotelId' })
  const numericHotelId = Number(hotelId)
  const [activeTab, setActiveTab] = useState('room')
  const searchStore = useHotelSearchStore()
  const roomTypeIntent = (search.roomType ??
    searchStore.roomType ??
    'HOTEL') as IntentRoomType
  const today = useMemo(() => {
    const date = new Date()
    date.setHours(0, 0, 0, 0)
    return date
  }, [])

  const [checkIn, setCheckIn] = useState<string | undefined>(
    () => search.checkIn ?? searchStore.checkIn,
  )
  const [checkOut, setCheckOut] = useState<string | undefined>(
    () => search.checkOut ?? searchStore.checkOut,
  )
  const [targetDate, setTargetDate] = useState<string | undefined>(
    () => search.targetDate ?? searchStore.targetDate,
  )
  const [guestCount, setGuestCount] = useState(() =>
    normalizePositiveInt(search.guestCount ?? searchStore.guestCount),
  )
  const [roomCount, setRoomCount] = useState(() =>
    normalizePositiveInt(search.roomCount ?? searchStore.roomCount),
  )
  const [hotelRangeVisible, setHotelRangeVisible] = useState(false)
  const [hourlyDateVisible, setHourlyDateVisible] = useState(false)
  const [hotelCalendarValue, setHotelCalendarValue] = useState<
    [Date, Date] | null
  >(() => {
    const from = parseDate(search.checkIn ?? searchStore.checkIn)
    const to = parseDate(search.checkOut ?? searchStore.checkOut)
    return from && to ? [from, to] : null
  })
  const [hourlyCalendarValue, setHourlyCalendarValue] = useState<Date | null>(
    () => parseDate(search.targetDate ?? searchStore.targetDate) ?? null,
  )

  const detailQuery = useQuery({
    queryKey: ['mobile-hotel-detail', numericHotelId],
    queryFn: () => MobileHotelRequest.getHotelDetail(numericHotelId),
  })
  const nearbyHotelsQuery = useQuery({
    queryKey: [
      'mobile-nearby-hotels',
      numericHotelId,
      roomTypeIntent,
      guestCount,
      roomCount,
    ],
    queryFn: () =>
      MobileHotelRequest.getNearbyHotels({
        hotelId: numericHotelId,
        radiusKm: 5,
        limit: 6,
        roomType: roomTypeIntent,
        guestCount,
        roomCount,
      }),
  })
  const nearbyPoisQuery = useQuery({
    queryKey: ['mobile-nearby-pois', numericHotelId],
    queryFn: () =>
      MobileHotelRequest.getNearbyPois({
        hotelId: numericHotelId,
        radiusMeters: 3000,
        limitPerCategory: 8,
      }),
  })

  const roomTypes = useMemo(
    () =>
      (detailQuery.data?.roomTypes ?? [])
        .filter((item) =>
          roomTypeIntent === 'HOURLY'
            ? item.priceMode === 'PER_HOUR'
            : item.priceMode === 'PER_NIGHT',
        )
        .slice()
        .sort((a, b) => a.price - b.price),
    [detailQuery.data?.roomTypes, roomTypeIntent],
  )
  const intro = detailQuery.data?.description || '暂无介绍'
  const poiGroups = useMemo(() => nearbyPoisQuery.data, [nearbyPoisQuery.data])
  const nights = useMemo(() => {
    if (!checkIn || !checkOut) return undefined
    const start = new Date(checkIn).getTime()
    const end = new Date(checkOut).getTime()
    const diff = Math.ceil((end - start) / (1000 * 60 * 60 * 24))
    return Number.isFinite(diff) && diff > 0 ? diff : undefined
  }, [checkIn, checkOut])

  return (
    <div className="h-full overflow-y-auto bg-[#f8f8f6]">
      <div className="sticky top-0 z-10 flex items-center justify-between bg-white px-3 py-3 shadow-sm">
        <button
          className="text-blue-600"
          onClick={() => {
            if (window.history.length > 1) {
              window.history.back()
              return
            }
            navigate({
              to: '/list/$roomType',
              params: { roomType: roomTypeIntent },
            })
          }}
        >
          返回
        </button>
        <div className="max-w-[220px] truncate text-sm font-medium">
          {detailQuery.data?.name ?? '酒店详情'}
        </div>
        <div className="w-8" />
      </div>

      <div className="bg-white">
        {detailQuery.data?.images && detailQuery.data.images.length > 0 ? (
          <Swiper autoplay loop>
            {detailQuery.data.images.map((img) => (
              <Swiper.Item key={img.id}>
                <img src={img.url} className="h-52 w-full object-cover" />
              </Swiper.Item>
            ))}
          </Swiper>
        ) : (
          <div className="h-52 bg-gray-100" />
        )}
      </div>

      <div className="mt-2 bg-white px-3 py-3">
        <div className="text-lg font-semibold">{detailQuery.data?.name}</div>
        <div className="mt-1 text-xs text-gray-500">
          {detailQuery.data ? '★'.repeat(detailQuery.data.starLevel) : ''}
        </div>
        <div className="mt-1 text-xs text-gray-500">
          {detailQuery.data?.address}
        </div>
        <div className="mt-2 flex flex-wrap gap-1">
          {(detailQuery.data?.tags ?? []).slice(0, 8).map((tag) => (
            <span
              key={tag}
              className="rounded-full bg-gray-100 px-2 py-[2px] text-[11px] text-gray-600"
            >
              {tag}
            </span>
          ))}
        </div>
      </div>

      <div className="mt-2 bg-white px-3 py-3">
        <div className="mb-2 text-xs text-gray-500">
          {roomTypeIntent === 'HOURLY'
            ? '入住日期（钟点房）'
            : '入住信息（酒店）'}
        </div>
        {roomTypeIntent === 'HOTEL' ? (
          <>
            <button
              className="w-full rounded-xl border border-gray-200 px-3 py-2 text-left text-xs flex items-center gap-2"
              onClick={() => {
                const from = parseDate(checkIn)
                const to = parseDate(checkOut)
                setHotelCalendarValue(from && to ? [from, to] : null)
                setHotelRangeVisible(true)
              }}
            >
              <CalendarIcon size={16} />
              {checkIn && checkOut
                ? `${checkIn} 至 ${checkOut}`
                : '选择入住/离店日期'}
            </button>
            <div className="mt-2 grid grid-cols-2 gap-2">
              <div>
                <div className="mb-1 text-xs text-gray-500">入住人数</div>
                <NumberKeyboardInput
                  value={guestCount}
                  onChange={(value) => {
                    const next = normalizePositiveInt(value)
                    setGuestCount(next)
                    searchStore.setState({ guestCount: next })
                  }}
                  className="w-full rounded-xl border border-gray-200 px-2 py-2 text-xs"
                />
              </div>
              <div>
                <div className="mb-1 text-xs text-gray-500">房间数量</div>
                <NumberKeyboardInput
                  value={roomCount}
                  onChange={(value) => {
                    const next = normalizePositiveInt(value)
                    setRoomCount(next)
                    searchStore.setState({ roomCount: next })
                  }}
                  className="w-full rounded-xl border border-gray-200 px-2 py-2 text-xs"
                />
              </div>
            </div>
            <div className="mt-2 text-xs text-gray-500">
              {nights ? `共 ${nights} 晚` : '请选择入住和离店日期'}
            </div>
          </>
        ) : (
          <button
            className="w-full rounded-xl border border-gray-200 px-3 py-2 text-left text-xs"
            onClick={() => {
              setHourlyCalendarValue(parseDate(targetDate) ?? null)
              setHourlyDateVisible(true)
            }}
          >
            {targetDate ?? '选择入住日期'}
          </button>
        )}
      </div>

      <div className="mt-2 bg-white px-3 py-2">
        <Tabs activeKey={activeTab} onChange={setActiveTab}>
          <Tabs.Tab title="房型" key="room" />
          <Tabs.Tab title="介绍" key="intro" />
          <Tabs.Tab title="周边" key="poi" />
          <Tabs.Tab title="附近相关" key="nearby" />
        </Tabs>
      </div>

      <div className="px-3 py-2">
        {activeTab === 'room' && (
          <div className="space-y-2">
            {roomTypes.length === 0 && (
              <div className="rounded-xl bg-white p-3 text-xs text-gray-500">
                暂无匹配房型
              </div>
            )}
            {roomTypes.map((room) => (
              <div key={room.id} className="rounded-xl bg-white p-3">
                <div className="text-sm font-medium">{room.name}</div>
                <div className="mt-1 text-xs text-gray-500">
                  {room.priceMode === 'PER_NIGHT'
                    ? `￥${room.price.toFixed(0)} / ${room.duration}晚`
                    : `￥${room.price.toFixed(0)} / ${room.duration}小时`}
                </div>
                <div className="mt-1 text-xs text-gray-500">
                  剩余{room.count}间
                </div>
                {room.slots.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {room.slots.map((slot) => (
                      <span
                        key={slot.id}
                        className="rounded-full bg-gray-100 px-2 py-[2px] text-[11px] text-gray-600"
                      >
                        {slot.startTime}-{slot.endTime}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
        {activeTab === 'intro' && (
          <div className="rounded-xl bg-white p-3 text-sm text-gray-700">
            {intro}
          </div>
        )}
        {activeTab === 'poi' && (
          <div className="space-y-2">
            {(['scenic', 'food', 'entertainment', 'traffic'] as const).map(
              (key) => (
                <div key={key} className="rounded-xl bg-white p-3">
                  <div className="mb-2 text-sm font-medium">
                    {key === 'scenic'
                      ? '景点'
                      : key === 'food'
                        ? '餐饮'
                        : key === 'entertainment'
                          ? '娱乐'
                          : '交通'}
                  </div>
                  {(poiGroups?.[key] ?? []).slice(0, 6).map((poi) => (
                    <div
                      key={poi.id}
                      className="mb-1 flex items-center justify-between text-xs text-gray-600"
                    >
                      <span className="truncate">{poi.name}</span>
                      <span>
                        {poi.distance ? `${Math.round(poi.distance)}m` : '-'}
                      </span>
                    </div>
                  ))}
                </div>
              ),
            )}
          </div>
        )}
        {activeTab === 'nearby' && (
          <div className="space-y-2">
            {(nearbyHotelsQuery.data ?? []).map((hotel) => (
              <HotelListCard
                key={`${hotel.hotelId}-${hotel.infoId}`}
                onClick={() =>
                  navigate({
                    to: '/hotel/$hotelId',
                    params: { hotelId: String(hotel.hotelId) },
                    search: {
                      roomType: roomTypeIntent,
                      checkIn: roomTypeIntent === 'HOTEL' ? checkIn : undefined,
                      checkOut:
                        roomTypeIntent === 'HOTEL' ? checkOut : undefined,
                      targetDate:
                        roomTypeIntent === 'HOURLY' ? targetDate : undefined,
                      guestCount:
                        roomTypeIntent === 'HOTEL' ? guestCount : undefined,
                      roomCount:
                        roomTypeIntent === 'HOTEL' ? roomCount : undefined,
                    },
                  })
                }
                item={hotel}
              />
            ))}
          </div>
        )}
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
          if (!value) {
            setCheckIn(undefined)
            setCheckOut(undefined)
            searchStore.setState({
              roomType: 'HOTEL',
              checkIn: undefined,
              checkOut: undefined,
              targetDate: undefined,
              guestCount,
              roomCount,
            })
          } else {
            const nextCheckIn = formatDate(value[0])
            const nextCheckOut = formatDate(value[1])
            setCheckIn(nextCheckIn)
            setCheckOut(nextCheckOut)
            searchStore.setState({
              roomType: 'HOTEL',
              checkIn: nextCheckIn,
              checkOut: nextCheckOut,
              targetDate: undefined,
              guestCount,
              roomCount,
            })
          }
          setHotelRangeVisible(false)
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
          const nextDate = formatDate(value)
          setTargetDate(nextDate)
          searchStore.setState({
            roomType: 'HOURLY',
            targetDate: nextDate,
            checkIn: undefined,
            checkOut: undefined,
            guestCount,
            roomCount,
          })
          setHourlyDateVisible(false)
        }}
      />
    </div>
  )
}

export default HotelDetailPage
