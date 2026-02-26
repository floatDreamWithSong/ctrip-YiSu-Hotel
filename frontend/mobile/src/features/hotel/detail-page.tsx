import { useEffect, useMemo, useRef, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useNavigate, useParams, useSearch } from '@tanstack/react-router'
import { CalendarPicker, Dialog, Swiper, Tabs } from 'antd-mobile'
import { MobileHotelRequest } from '@yisu/front-utils/apis/hotel-mobile'
import { DateTriggerButton } from '@/components/common/date-trigger-button'
import { GuestRoomCountFields } from '@/components/common/guest-room-count-fields'
import {
  formatYmdDate,
  getStartOfToday,
  normalizePositiveInt,
  parseYmdDate,
} from '@/lib/hotel-search-form'
import { useHotelSearchStore } from '@/store/hotel-search'
import { env } from '@/env'
import HotelListCard from './components/hotel-list-card'
import { useHotelDetailRealtime } from './realtime/use-hotel-detail-realtime'
import Stars from '@/components/common/starts'
import { CarFront, Eye, MountainSnow, Music, Utensils } from 'lucide-react'

type IntentRoomType = 'HOTEL' | 'HOURLY'
type PoiCategoryKey = 'scenic' | 'food' | 'entertainment' | 'traffic'

type AMapLike = {
  Map: new (
    container: HTMLElement,
    options?: Record<string, unknown>,
  ) => {
    add: (overlays: unknown | unknown[]) => void
    remove: (overlays: unknown | unknown[]) => void
    setCenter: (center: [number, number]) => void
    setZoom: (zoom: number) => void
    setFitView: (
      overlays?: unknown[],
      immediately?: boolean,
      avoid?: [number, number, number, number],
      maxZoom?: number,
    ) => void
    destroy: () => void
  }
  Marker: new (options?: Record<string, unknown>) => unknown
}

const POI_MAP_RESET_ZOOM = 16

const POI_CATEGORY_META: Record<
  PoiCategoryKey,
  {
    label: string
    icon: typeof MountainSnow
    markerColor: string
  }
> = {
  scenic: { label: '景点', icon: MountainSnow, markerColor: '#16a34a' },
  food: { label: '餐饮', icon: Utensils, markerColor: '#ea580c' },
  entertainment: { label: '娱乐', icon: Music, markerColor: '#2563eb' },
  traffic: { label: '交通', icon: CarFront, markerColor: '#4b5563' },
}

let amapScriptLoadingPromise: Promise<AMapLike> | null = null

const getWindowWithAmap = () =>
  window as Window & {
    AMap?: AMapLike
    _AMapSecurityConfig?: {
      serviceHost?: string
    }
  }

const loadAmapScript = (key: string) => {
  const win = getWindowWithAmap()
  win._AMapSecurityConfig = {
    ...(win._AMapSecurityConfig ?? {}),
    serviceHost: env.VITE_AMAP_SERVICE_HOST,
  }
  if (win.AMap) {
    return Promise.resolve(win.AMap)
  }
  if (amapScriptLoadingPromise) {
    return amapScriptLoadingPromise
  }

  amapScriptLoadingPromise = new Promise<AMapLike>((resolve, reject) => {
    const script = document.createElement('script')
    script.src = `https://webapi.amap.com/maps?v=2.0&key=${encodeURIComponent(key)}`
    script.async = true
    script.onload = () => {
      if (win.AMap) {
        resolve(win.AMap)
        return
      }
      reject(new Error('高德地图脚本加载成功，但 AMap 未挂载到 window'))
    }
    script.onerror = () => reject(new Error('高德地图脚本加载失败'))
    document.head.appendChild(script)
  }).catch((error) => {
    amapScriptLoadingPromise = null
    throw error
  })

  return amapScriptLoadingPromise
}

const parseLngLat = (location?: string | null) => {
  if (!location) return null
  const [lngText, latText] = location.split(',')
  const lng = Number(lngText)
  const lat = Number(latText)
  if (!Number.isFinite(lng) || !Number.isFinite(lat)) return null
  return { lng, lat }
}

const escapeHtml = (value: string) =>
  value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;')

const buildHotelMarkerHtml = (hotelName: string) => {
  const safeName = escapeHtml(hotelName)
  return `
    <div style="display:flex;align-items:center;gap:6px;transform:translate(-14px,-40px);">
      <div style="width:28px;height:28px;border-radius:999px;background:#111827;color:#fff;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:700;border:2px solid #fff;box-shadow:0 6px 14px rgba(17,24,39,.25);">酒</div>
      <div style="max-width:160px;padding:4px 8px;border-radius:999px;background:rgba(255,255,255,.95);color:#111827;font-size:12px;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;box-shadow:0 6px 14px rgba(15,23,42,.12);border:1px solid rgba(17,24,39,.08);">${safeName}</div>
    </div>
    <div style="width:10px;height:10px;border-radius:999px;background:#111827;border:2px solid #fff;box-shadow:0 2px 6px rgba(17,24,39,.24);transform:translate(-1px,-8px);"></div>
  `
}

const buildPoiMarkerHtml = (name: string, color: string) => {
  const safeName = escapeHtml(name)
  return `
    <div style="display:flex;align-items:center;gap:6px;transform:translate(-8px,-24px);">
      <div style="width:14px;height:14px;border-radius:999px;background:${color};border:2px solid #fff;box-shadow:0 4px 10px rgba(15,23,42,.18);"></div>
      <div style="max-width:140px;padding:3px 8px;border-radius:999px;background:rgba(255,255,255,.94);color:#1f2937;font-size:11px;line-height:1.2;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;border:1px solid rgba(17,24,39,.08);box-shadow:0 4px 12px rgba(15,23,42,.10);">
        <span style="display:inline-block;width:6px;height:6px;border-radius:999px;background:${color};margin-right:6px;vertical-align:middle;"></span>${safeName}
      </div>
    </div>
  `
}

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
    return getStartOfToday()
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
    const from = parseYmdDate(search.checkIn ?? searchStore.checkIn)
    const to = parseYmdDate(search.checkOut ?? searchStore.checkOut)
    return from && to ? [from, to] : null
  })
  const [hourlyCalendarValue, setHourlyCalendarValue] = useState<Date | null>(
    () => parseYmdDate(search.targetDate ?? searchStore.targetDate) ?? null,
  )
  const [activePoiCategory, setActivePoiCategory] =
    useState<PoiCategoryKey>('scenic')
  const updateDialogOpenRef = useRef(false)
  const poiMapContainerRef = useRef<HTMLDivElement | null>(null)
  const poiMapRef = useRef<InstanceType<AMapLike['Map']> | null>(null)
  const poiMapOverlaysRef = useRef<unknown[]>([])
  const poiHotelOverlayRef = useRef<unknown | null>(null)
  const [poiMapStatus, setPoiMapStatus] = useState<
    'idle' | 'loading' | 'ready' | 'error'
  >('idle')

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

  const onHotelDetailUpdated = async () => {
    if (updateDialogOpenRef.current) return
    updateDialogOpenRef.current = true

    try {
      const confirmed = await Dialog.confirm({
        content: '酒店信息有更新，是否查看最新信息？',
        confirmText: '是',
        cancelText: '否',
      })
      if (!confirmed) return
      await detailQuery.refetch()
    } finally {
      updateDialogOpenRef.current = false
    }
  }

  useHotelDetailRealtime(numericHotelId, onHotelDetailUpdated)

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
  const hotelLocation = detailQuery.data?.location ?? null
  const poiCategoryKeys = useMemo(
    () => Object.keys(POI_CATEGORY_META) as PoiCategoryKey[],
    [],
  )
  const nearbyPoiPointsByCategory = useMemo(() => {
    const source = nearbyPoisQuery.data
    return poiCategoryKeys.reduce(
      (acc, category) => {
        acc[category] = (source?.[category] ?? [])
          .map((poi) => {
            const parsed = parseLngLat(poi.location)
            if (!parsed) return null
            return { ...poi, ...parsed }
          })
          .filter((item): item is NonNullable<typeof item> => Boolean(item))
        return acc
      },
      {} as Record<
        PoiCategoryKey,
        Array<
          NonNullable<typeof nearbyPoisQuery.data>[PoiCategoryKey][number] & {
            lng: number
            lat: number
          }
        >
      >,
    )
  }, [nearbyPoisQuery, poiCategoryKeys])

  useEffect(() => {
    const next = poiCategoryKeys.find(
      (category) => (nearbyPoisQuery.data?.[category]?.length ?? 0) > 0,
    )
    if (next) {
      setActivePoiCategory((prev) =>
        (nearbyPoisQuery.data?.[prev]?.length ?? 0) > 0 ? prev : next,
      )
    }
  }, [nearbyPoisQuery.data, poiCategoryKeys])

  useEffect(() => {
    if (activeTab !== 'poi' || !hotelLocation || !poiMapContainerRef.current)
      return
    let cancelled = false

    setPoiMapStatus((prev) => (prev === 'ready' ? prev : 'loading'))
    void loadAmapScript(env.VITE_AMAP_WEB_KEY)
      .then((AMap) => {
        if (cancelled || !poiMapContainerRef.current || poiMapRef.current)
          return
        const map = new AMap.Map(poiMapContainerRef.current, {
          zoom: POI_MAP_RESET_ZOOM,
          center: [hotelLocation.lng, hotelLocation.lat],
          resizeEnable: true,
        })
        poiMapRef.current = map
        setPoiMapStatus('ready')
      })
      .catch(() => {
        if (cancelled) return
        setPoiMapStatus('error')
      })

    return () => {
      cancelled = true
    }
  }, [activeTab, hotelLocation])

  useEffect(() => {
    const map = poiMapRef.current
    if (!map || !hotelLocation) return
    const win = getWindowWithAmap()
    const AMap = win.AMap
    if (!AMap) return

    if (poiMapOverlaysRef.current.length > 0) {
      map.remove(poiMapOverlaysRef.current)
      poiMapOverlaysRef.current = []
    }
    if (poiHotelOverlayRef.current) {
      map.remove(poiHotelOverlayRef.current)
      poiHotelOverlayRef.current = null
    }

    const hotelMarker = new AMap.Marker({
      position: [hotelLocation.lng, hotelLocation.lat],
      title: detailQuery.data?.name ?? '当前酒店',
      content: buildHotelMarkerHtml(detailQuery.data?.name ?? '当前酒店'),
      zIndex: 120,
    })
    poiHotelOverlayRef.current = hotelMarker

    const categoryMeta = POI_CATEGORY_META[activePoiCategory]
    const poiMarkers = nearbyPoiPointsByCategory[activePoiCategory].map(
      (poi) => {
        return new AMap.Marker({
          position: [poi.lng, poi.lat],
          title: poi.name,
          content: buildPoiMarkerHtml(poi.name, categoryMeta.markerColor),
          zIndex: 100,
        })
      },
    )

    map.add(hotelMarker)
    if (poiMarkers.length > 0) {
      map.add(poiMarkers)
    }
    poiMapOverlaysRef.current = poiMarkers
    map.setZoom(POI_MAP_RESET_ZOOM)
    map.setCenter([hotelLocation.lng, hotelLocation.lat])
  }, [
    activePoiCategory,
    detailQuery.data?.name,
    hotelLocation,
    nearbyPoiPointsByCategory,
  ])

  useEffect(() => {
    return () => {
      if (poiMapRef.current) {
        poiMapRef.current.destroy()
        poiMapRef.current = null
      }
    }
  }, [])

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
                <div className="relative">
                  <img src={img.url} className="h-52 w-full object-cover" />
                  {img.caption ? (
                    <div className="absolute inset-x-0 bottom-0 bg-linear-to-t from-black/60 to-transparent px-3 py-2">
                      <div className="truncate text-xs text-white">
                        {img.caption}
                      </div>
                    </div>
                  ) : null}
                </div>
              </Swiper.Item>
            ))}
          </Swiper>
        ) : (
          <div className="h-52 bg-gray-100" />
        )}
      </div>

      <div className="mt-2 bg-white px-3 py-3">
        <div className="text-lg font-semibold">{detailQuery.data?.name}</div>
        <Stars stars={detailQuery.data?.starLevel ?? 0} className="mb-1" />
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
            <DateTriggerButton
              onClick={() => {
                const from = parseYmdDate(checkIn)
                const to = parseYmdDate(checkOut)
                setHotelCalendarValue(from && to ? [from, to] : null)
                setHotelRangeVisible(true)
              }}
              from={checkIn}
              to={checkOut}
            />
            <GuestRoomCountFields
              guestCount={guestCount}
              roomCount={roomCount}
              onGuestCountChange={(value) => {
                const next = normalizePositiveInt(value)
                setGuestCount(next)
                searchStore.setState({ guestCount: next })
              }}
              onRoomCountChange={(value) => {
                const next = normalizePositiveInt(value)
                setRoomCount(next)
                searchStore.setState({ roomCount: next })
              }}
              inputClassName="w-full rounded-xl border border-gray-200 px-2 py-2 text-xs"
            />
          </>
        ) : (
          <DateTriggerButton
            className="rounded-xl text-xs"
            onClick={() => {
              setHourlyCalendarValue(parseYmdDate(targetDate) ?? null)
              setHourlyDateVisible(true)
            }}
            from={targetDate}
          />
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

      <div className="px-3 py-2 pb-8">
        {activeTab === 'room' && (
          <div className="space-y-2">
            {roomTypes.length === 0 && (
              <div className="rounded-xl bg-white p-3 text-xs text-gray-500">
                暂无匹配房型
              </div>
            )}
            {roomTypes.map((room) => (
              <div
                key={room.id}
                className="overflow-hidden rounded-2xl bg-white shadow-sm"
              >
                <div className="flex gap-3 p-3">
                  <div className="h-24 w-28 shrink-0 overflow-hidden rounded-xl bg-gray-100">
                    {room.imageUrl ? (
                      <img
                        src={room.imageUrl}
                        alt={room.name}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-[11px] text-gray-400">
                        暂无图片
                      </div>
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="truncate text-sm font-semibold text-gray-900">
                          {room.name}
                        </div>
                        <div className="mt-1 text-[11px] text-gray-500">
                          {room.priceMode === 'PER_NIGHT'
                            ? '按晚预订'
                            : '钟点房'}
                        </div>
                      </div>
                      <span
                        className={`shrink-0 rounded-full px-2 py-1 text-[11px] ${
                          room.count > 0
                            ? 'bg-gray-100 text-gray-500'
                            : 'bg-gray-100 text-gray-500'
                        }`}
                      >
                        {room.count > 0 ? `剩余 ${room.count} 间` : '已售罄'}
                      </span>
                    </div>

                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {room.bedType && (
                        <span className="rounded-full bg-gray-100 px-2 py-1 text-[11px] text-gray-600">
                          床型：{room.bedType}
                        </span>
                      )}
                      {room.area !== null && (
                        <span className="rounded-full bg-gray-100 px-2 py-1 text-[11px] text-gray-600">
                          面积：
                          {Number.isInteger(room.area)
                            ? `${room.area}㎡`
                            : `${room.area.toFixed(1)}㎡`}
                        </span>
                      )}
                      <span className="rounded-full bg-gray-100 px-2 py-1 text-[11px] text-gray-600">
                        {room.maxGuests}人/间
                      </span>
                    </div>
                  </div>
                </div>

                <div className="border-t border-dashed border-gray-100 px-3 py-2.5">
                  <div className="flex items-end justify-between gap-2">
                    <div>
                      <div className="text-[11px] text-gray-500">
                        {room.priceMode === 'PER_NIGHT'
                          ? '房型价格'
                          : '钟点房价格'}
                      </div>
                      <div className="mt-0.5 flex items-baseline gap-1">
                        <span className="text-xs font-medium text-orange-500">
                          ￥
                        </span>
                        <span className="text-xl font-semibold leading-none text-orange-600">
                          {room.price.toFixed(0)}
                        </span>
                        <span className="text-[11px] text-gray-500">
                          / {room.duration}
                          {room.priceMode === 'PER_NIGHT' ? '夜' : '小时'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {room.slots.length > 0 && (
                    <div className="mt-2.5 rounded-xl bg-gray-50 p-2">
                      <div className="mb-1.5 text-[11px] text-gray-500">
                        可预约时段
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {room.slots.map((slot) => (
                          <span
                            key={slot.id}
                            className="rounded-lg border border-gray-200 bg-white px-2 py-1 text-[11px] text-gray-700"
                          >
                            {slot.startTime}-{slot.endTime}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
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
            <div className="overflow-hidden rounded-2xl bg-white shadow-sm">
              <div className="border-b border-gray-100 px-3 py-2.5">
                <div className="text-sm font-semibold text-gray-900">
                  周边地图
                </div>
                <div className="mt-1 text-[11px] text-gray-500">
                  以当前酒店为中心，点击下方分类卡片切换点位
                </div>
              </div>
              {!hotelLocation ? (
                <div className="flex h-52 items-center justify-center px-4 text-center text-xs text-gray-500">
                  当前酒店暂无坐标信息，无法展示地图
                </div>
              ) : (
                <div className="relative h-80 w-full bg-gray-100">
                  <div ref={poiMapContainerRef} className="h-full w-full" />
                  {poiMapStatus !== 'ready' && (
                    <div className="absolute inset-0 flex items-center justify-center bg-white/75 text-xs text-gray-600">
                      {poiMapStatus === 'error'
                        ? '地图加载失败，请检查高德 Key 与白名单配置'
                        : '地图加载中...'}
                    </div>
                  )}
                </div>
              )}
            </div>

            {poiCategoryKeys.map((key) => {
              const meta = POI_CATEGORY_META[key]
              const Icon = meta.icon
              const isActive = activePoiCategory === key
              const items = nearbyPoisQuery.data?.[key] ?? []

              return (
                <button
                  type="button"
                  key={key}
                  onClick={() => setActivePoiCategory(key)}
                  className={`block w-full rounded-xl p-3 text-left ${
                    isActive ? 'bg-blue-50 ring-1 ring-blue-200' : 'bg-white'
                  }`}
                >
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 text-sm font-bold">
                      <Icon size={16} />
                      <span>{meta.label}</span>
                      {isActive && (
                        <span className="rounded-full bg-blue-100 px-2 py-[2px] text-[10px] font-medium text-blue-700">
                          <Eye size={12} />
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] text-gray-500">
                      {items.length} 个地点
                    </span>
                  </div>
                  {items.length === 0 ? (
                    <div className="text-xs text-gray-400">暂无数据</div>
                  ) : (
                    items.slice(0, 6).map((poi) => (
                      <div
                        key={poi.id}
                        className="mb-1 flex items-center justify-between text-xs text-gray-600 last:mb-0"
                      >
                        <span className="truncate pr-2">{poi.name}</span>
                        <span className="shrink-0">
                          {poi.distance ? `${Math.round(poi.distance)}m` : '-'}
                        </span>
                      </div>
                    ))
                  )}
                </button>
              )
            })}
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
            const nextCheckIn = formatYmdDate(value[0])
            const nextCheckOut = formatYmdDate(value[1])
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
          const nextDate = formatYmdDate(value)
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
