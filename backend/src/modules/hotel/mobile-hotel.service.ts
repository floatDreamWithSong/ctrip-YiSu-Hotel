import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common'
import { PrismaService } from '@/utils/prisma/prisma.service'
import { Prisma, PriceMode, ReviewStatus } from 'prisma-generated'
import { ApiMobileHotelTypes, PoiCategory } from '@yisu/shared'
import { LocationService } from '../location/location.service'

type SearchItem = ApiMobileHotelTypes['MobileHotelSearchResponse']['items'][number]

@Injectable()
export class MobileHotelService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly locationService: LocationService,
  ) {}

  private parseCsvNumbers(value?: string) {
    if (!value) return []
    return value
      .split(',')
      .map((item) => Number(item.trim()))
      .filter((num) => Number.isInteger(num) && num > 0)
  }

  private parseCsvString(value?: string) {
    if (!value) return []
    return value
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean)
  }

  private mergePoiItems<T extends { id: string; distance: number | null }>(groups: T[][], limit: number) {
    const dedup = new Map<string, T>()
    groups.flat().forEach((item) => {
      if (!dedup.has(item.id)) {
        dedup.set(item.id, item)
      }
    })
    return Array.from(dedup.values())
      .sort((a, b) => (a.distance ?? Number.MAX_SAFE_INTEGER) - (b.distance ?? Number.MAX_SAFE_INTEGER))
      .slice(0, limit)
  }

  private toRadians(degrees: number) {
    return (degrees * Math.PI) / 180
  }

  private calculateDistanceMeters(from: { lng: number; lat: number }, to: { lng: number; lat: number }) {
    const earthRadius = 6371e3
    const lat1 = this.toRadians(from.lat)
    const lat2 = this.toRadians(to.lat)
    const deltaLat = this.toRadians(to.lat - from.lat)
    const deltaLng = this.toRadians(to.lng - from.lng)

    const a =
      Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
      Math.cos(lat1) * Math.cos(lat2) * Math.sin(deltaLng / 2) * Math.sin(deltaLng / 2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    return earthRadius * c
  }

  private deriveEndTime(startTime: string, durationHours: number) {
    const [hours, minutes] = startTime.split(':').map(Number)
    if (!Number.isInteger(hours) || !Number.isInteger(minutes) || hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
      throw new BadRequestException(`非法时间格式: ${startTime}`)
    }
    const total = hours * 60 + minutes + durationHours * 60
    if (total > 24 * 60) {
      throw new BadRequestException(`钟点房时段 ${startTime} + ${durationHours} 小时超过当日 24:00`)
    }
    const endHours = Math.floor(total / 60)
    const endMinutes = total % 60
    return `${String(endHours).padStart(2, '0')}:${String(endMinutes).padStart(2, '0')}`
  }

  private async getInfoLocations(infoIds: number[]) {
    if (infoIds.length === 0) {
      return new Map<number, { lng: number; lat: number }>()
    }
    const rows = await this.prisma.$queryRaw<Array<{ id: number; lng: number | null; lat: number | null }>>(Prisma.sql`
      SELECT
        "id",
        ST_X("location_geog"::geometry) AS lng,
        ST_Y("location_geog"::geometry) AS lat
      FROM "hotel_infos"
      WHERE "id" IN (${Prisma.join(infoIds)})
    `)
    const map = new Map<number, { lng: number; lat: number }>()
    rows.forEach((row) => {
      if (row.lng !== null && row.lat !== null) {
        map.set(row.id, { lng: Number(row.lng), lat: Number(row.lat) })
      }
    })
    return map
  }

  private buildListItem(info: {
    hotelId: number
    id: number
    name: string
    enName: string | null
    starLevel: number
    city: string | null
    district: string | null
    address: string
    images: Array<{ url: string; sortOrder: number }>
    roomTypes: Array<{
      price: number
      priceMode: PriceMode
      duration: number
      hourlySlots: Array<{ id: number; startTime: string }>
    }>
    tags: Array<{ tag: { name: string } }>
  }): SearchItem {
    const coverImage =
      info.images
        .slice()
        .sort((a, b) => a.sortOrder - b.sortOrder)[0]
        ?.url ?? null
    const minPrice = info.roomTypes.length > 0 ? Math.min(...info.roomTypes.map((room) => room.price)) : null
    const hasHourlyRoom = info.roomTypes.some((room) => room.priceMode === PriceMode.PER_HOUR)
    return {
      hotelId: info.hotelId,
      infoId: info.id,
      name: info.name,
      enName: info.enName,
      starLevel: info.starLevel,
      city: info.city,
      district: info.district,
      address: info.address,
      coverImage,
      minPrice,
      distanceMeters: null,
      tags: info.tags.map((item) => item.tag.name),
      hasHourlyRoom,
    }
  }

  async getHomeBanners(query: ApiMobileHotelTypes['MobileHomeBannerQuery']) {
    const items = await this.prisma.hotel.findMany({
      where: {
        isDeleted: false,
        isHomeAdEnabled: true,
        publishedInfo: {
          is: {
            reviewStatus: ReviewStatus.APPROVED,
            ...(query.city ? { city: query.city } : {}),
            homeAdImage: {
              not: null,
            },
          },
        },
      },
      include: {
        publishedInfo: {
          include: {
            images: true,
            tags: {
              include: {
                tag: true,
              },
            },
            roomTypes: {
              include: {
                hourlySlots: {
                  select: { id: true, startTime: true },
                },
              },
            },
          },
        },
      },
      take: query.limit * 3,
    })
    const normalized = items
      .map((hotel) => hotel.publishedInfo)
      .filter((info): info is NonNullable<typeof info> => Boolean(info))
      .map((info) => this.buildListItem(info))
      .sort(() => Math.random() - 0.5)
      .slice(0, query.limit)
    return normalized
  }

  async searchHotels(
    query: ApiMobileHotelTypes['MobileHotelSearchQuery'],
    options?: {
      excludeHotelId?: number
    },
  ) {
    const starLevels = this.parseCsvNumbers(query.starLevels)
    const tagIds = this.parseCsvNumbers(query.tagIds)
    const hasUserLocation = typeof query.userLng === 'number' && typeof query.userLat === 'number'
    const searchPriceMode = query.roomType === 'HOURLY' ? PriceMode.PER_HOUR : PriceMode.PER_NIGHT
    const offset = (query.page - 1) * query.limit
    const baseConditions: Prisma.Sql[] = [
      Prisma.sql`h."is_deleted" = FALSE`,
      Prisma.sql`hi."review_status" = ${ReviewStatus.APPROVED}::"ReviewStatus"`,
      Prisma.sql`h."published_info_id" IS NOT NULL`,
    ]
    if (typeof options?.excludeHotelId === 'number') {
      baseConditions.push(Prisma.sql`h."id" <> ${options.excludeHotelId}`)
    }

    if (query.city) {
      baseConditions.push(Prisma.sql`hi."city" = ${query.city}`)
    }
    if (query.district) {
      baseConditions.push(Prisma.sql`hi."district" = ${query.district}`)
    }
    if (query.keyword?.trim()) {
      const keyword = `%${query.keyword.trim()}%`
      baseConditions.push(
        Prisma.sql`(
          hi."name" ILIKE ${keyword}
          OR hi."en_name" ILIKE ${keyword}
          OR hi."description" ILIKE ${keyword}
        )`,
      )
    }
    if (starLevels.length > 0) {
      baseConditions.push(Prisma.sql`hi."star_level" IN (${Prisma.join(starLevels)})`)
    }
    if (tagIds.length > 0) {
      baseConditions.push(
        Prisma.sql`EXISTS (
          SELECT 1
          FROM "hotel_tag_relations" htr
          WHERE htr."info_id" = hi."id"
            AND htr."tag_id" IN (${Prisma.join(tagIds)})
        )`,
      )
    }

    if (query.roomType === 'HOURLY') {
      const slotCondition = query.slotId
        ? Prisma.sql`AND EXISTS (
            SELECT 1
            FROM "hourly_room_slots" hrs
            WHERE hrs."room_type_id" = rt."id"
              AND hrs."id" = ${query.slotId}
          )`
        : Prisma.empty
      baseConditions.push(
        Prisma.sql`EXISTS (
          SELECT 1
          FROM "room_types" rt
          WHERE rt."info_id" = hi."id"
            AND rt."price_mode" = ${PriceMode.PER_HOUR}::"PriceMode"
            ${slotCondition}
        )`,
      )
    } else {
      baseConditions.push(
        Prisma.sql`(
          SELECT COALESCE(SUM(rt."count"), 0)
          FROM "room_types" rt
          WHERE rt."info_id" = hi."id"
            AND rt."price_mode" = ${PriceMode.PER_NIGHT}::"PriceMode"
        ) >= ${query.roomCount}`,
      )
      baseConditions.push(
        Prisma.sql`(
          SELECT COALESCE(SUM(cap."max_guests"), 0)
          FROM (
            SELECT rt."max_guests"
            FROM "room_types" rt
            JOIN generate_series(1, rt."count") gs(n) ON TRUE
            WHERE rt."info_id" = hi."id"
              AND rt."price_mode" = ${PriceMode.PER_NIGHT}::"PriceMode"
            ORDER BY rt."max_guests" DESC
            LIMIT ${query.roomCount}
          ) cap
        ) >= ${query.guestCount}`,
      )
    }

    const whereBase = Prisma.join(baseConditions, ' AND ')
    const filteredConditions: Prisma.Sql[] = [Prisma.sql`1 = 1`]
    if (typeof query.priceMin === 'number') {
      filteredConditions.push(Prisma.sql`f."min_price" IS NOT NULL AND f."min_price" >= ${query.priceMin}`)
    }
    if (typeof query.priceMax === 'number') {
      filteredConditions.push(Prisma.sql`f."min_price" IS NOT NULL AND f."min_price" <= ${query.priceMax}`)
    }
    if (hasUserLocation && typeof query.distanceKm === 'number') {
      filteredConditions.push(
        Prisma.sql`f."distance_meters" IS NOT NULL AND f."distance_meters" <= ${query.distanceKm * 1000}`,
      )
    }
    const whereFiltered = Prisma.join(filteredConditions, ' AND ')

    const distanceExpression = hasUserLocation
      ? Prisma.sql`CASE
          WHEN hi."location_geog" IS NULL THEN NULL
          ELSE ST_Distance(
            hi."location_geog",
            ST_SetSRID(ST_MakePoint(${Number(query.userLng)}, ${Number(query.userLat)}), 4326)::geography
          )
        END`
      : Prisma.sql`NULL`

    const searchCte = Prisma.sql`
      WITH base AS (
        SELECT
          h."id" AS "hotel_id",
          hi."id" AS "info_id",
          hi."name" AS "name",
          hi."en_name" AS "en_name",
          hi."star_level" AS "star_level",
          hi."city" AS "city",
          hi."district" AS "district",
          hi."address" AS "address",
          (
            SELECT img."url"
            FROM "hotel_images" img
            WHERE img."info_id" = hi."id"
            ORDER BY img."sort_order" ASC
            LIMIT 1
          ) AS "cover_image",
          (
            SELECT MIN(rt."price")
            FROM "room_types" rt
            WHERE rt."info_id" = hi."id"
              AND rt."price_mode" = ${searchPriceMode}::"PriceMode"
          ) AS "min_price",
          ${distanceExpression} AS "distance_meters",
          COALESCE((
            SELECT ARRAY_AGG(t."name" ORDER BY t."name")
            FROM "hotel_tag_relations" htr
            JOIN "hotel_tags" t ON t."id" = htr."tag_id"
            WHERE htr."info_id" = hi."id"
          ), ARRAY[]::text[]) AS "tags",
          EXISTS (
            SELECT 1
            FROM "room_types" rt
            WHERE rt."info_id" = hi."id"
              AND rt."price_mode" = ${PriceMode.PER_HOUR}::"PriceMode"
          ) AS "has_hourly_room"
        FROM "hotels" h
        JOIN "hotel_infos" hi ON hi."id" = h."published_info_id"
        WHERE ${whereBase}
      ),
      filtered AS (
        SELECT *
        FROM base f
        WHERE ${whereFiltered}
      )
    `

    const orderBySql =
      query.sortBy === 'distance'
        ? query.sortOrder === 'desc'
          ? Prisma.sql`ORDER BY COALESCE(f."distance_meters", 9999999999) DESC, f."hotel_id" ASC`
          : Prisma.sql`ORDER BY COALESCE(f."distance_meters", 9999999999) ASC, f."hotel_id" ASC`
        : query.sortBy === 'starLevel'
          ? query.sortOrder === 'desc'
            ? Prisma.sql`ORDER BY f."star_level" DESC, f."hotel_id" ASC`
            : Prisma.sql`ORDER BY f."star_level" ASC, f."hotel_id" ASC`
          : query.sortOrder === 'desc'
            ? Prisma.sql`ORDER BY COALESCE(f."min_price", 9999999999) DESC, f."hotel_id" ASC`
            : Prisma.sql`ORDER BY COALESCE(f."min_price", 9999999999) ASC, f."hotel_id" ASC`

    const totalRows = await this.prisma.$queryRaw<Array<{ total: number | string | bigint }>>(Prisma.sql`
      ${searchCte}
      SELECT COUNT(*)::int AS "total"
      FROM filtered f
    `)
    const rowTotal = totalRows[0]?.total ?? 0
    const total = typeof rowTotal === 'bigint' ? Number(rowTotal) : Number(rowTotal || 0)

    const rows = await this.prisma.$queryRaw<
      Array<{
        hotel_id: number
        info_id: number
        name: string
        en_name: string | null
        star_level: number
        city: string | null
        district: string | null
        address: string
        cover_image: string | null
        min_price: number | string | null
        distance_meters: number | string | null
        tags: string[] | null
        has_hourly_room: boolean
      }>
    >(Prisma.sql`
      ${searchCte}
      SELECT
        f."hotel_id",
        f."info_id",
        f."name",
        f."en_name",
        f."star_level",
        f."city",
        f."district",
        f."address",
        f."cover_image",
        f."min_price",
        f."distance_meters",
        f."tags",
        f."has_hourly_room"
      FROM filtered f
      ${orderBySql}
      LIMIT ${query.limit}
      OFFSET ${offset}
    `)

    const items: ApiMobileHotelTypes['MobileHotelSearchResponse']['items'] = rows.map((row) => ({
      hotelId: row.hotel_id,
      infoId: row.info_id,
      name: row.name,
      enName: row.en_name,
      starLevel: Number(row.star_level),
      city: row.city,
      district: row.district,
      address: row.address,
      coverImage: row.cover_image,
      minPrice: row.min_price === null ? null : Number(row.min_price),
      distanceMeters: row.distance_meters === null ? null : Number(row.distance_meters),
      tags: row.tags ?? [],
      hasHourlyRoom: row.has_hourly_room,
    }))

    return {
      total,
      page: query.page,
      limit: query.limit,
      items,
    }
  }

  async getHotelDetail(hotelId: number) {
    const hotel = await this.prisma.hotel.findFirst({
      where: {
        id: hotelId,
        isDeleted: false,
        publishedInfo: {
          is: { reviewStatus: ReviewStatus.APPROVED },
        },
      },
      include: {
        publishedInfo: {
          include: {
            images: true,
            tags: {
              include: {
                tag: true,
              },
            },
            roomTypes: {
              include: {
                hourlySlots: {
                  select: { id: true, startTime: true },
                },
              },
            },
          },
        },
      },
    })
    if (!hotel || !hotel.publishedInfo) {
      throw new NotFoundException('酒店不存在或不可访问')
    }
    const info = hotel.publishedInfo
    const locations = await this.getInfoLocations([info.id])
    const location = locations.get(info.id) ?? null
    return {
      hotelId: hotel.id,
      infoId: info.id,
      name: info.name,
      enName: info.enName,
      starLevel: info.starLevel,
      phone: info.phone,
      description: info.description,
      province: info.province,
      city: info.city,
      district: info.district,
      address: info.address,
      location,
      openedAt: info.openedAt?.toISOString() ?? null,
      images: info.images
        .slice()
        .sort((a, b) => a.sortOrder - b.sortOrder)
        .map((item) => ({
          id: item.id,
          url: item.url,
          sortOrder: item.sortOrder,
          caption: item.caption,
        })),
      tags: info.tags.map((item) => item.tag.name),
      roomTypes: info.roomTypes
        .slice()
        .sort((a, b) => a.sortOrder - b.sortOrder)
        .map((room) => ({
          id: room.id,
          name: room.name,
          count: room.count,
          price: room.price,
          priceMode: room.priceMode,
          duration: room.duration,
          bedType: room.bedType,
          maxGuests: room.maxGuests,
          area: room.area,
          imageUrl: room.imageUrl,
          sortOrder: room.sortOrder,
          slots: room.hourlySlots
            .slice()
            .map((slot) => ({
              id: slot.id,
              startTime: slot.startTime,
              endTime: this.deriveEndTime(slot.startTime, room.duration),
            })),
        })),
    }
  }

  async getNearbyHotels(query: ApiMobileHotelTypes['MobileNearbyHotelsQuery']) {
    const detail = await this.getHotelDetail(query.hotelId)
    if (!detail.location) {
      return []
    }
    const search = await this.searchHotels({
      page: 1,
      limit: query.limit,
      roomType: query.roomType,
      guestCount: query.guestCount,
      roomCount: query.roomCount,
      city: detail.city ?? undefined,
      sortBy: 'distance',
      sortOrder: 'asc',
      userLng: query.userLng ?? detail.location.lng,
      userLat: query.userLat ?? detail.location.lat,
      distanceKm: query.radiusKm,
    }, {
      excludeHotelId: query.hotelId,
    })
    return search.items
  }

  async getNearbyPois(query: ApiMobileHotelTypes['MobileNearbyPoisQuery']) {
    const detail = await this.getHotelDetail(query.hotelId)
    if (!detail.location) {
      return {
        scenic: [],
        food: [],
        entertainment: [],
        traffic: [],
      }
    }
    const categoryList = this.parseCsvString(query.categories) as PoiCategory[]
    const categories: PoiCategory[] =
      categoryList.length > 0
        ? categoryList
        : [PoiCategory.SCENIC, PoiCategory.FOOD, PoiCategory.ENTERTAINMENT, PoiCategory.TRAFFIC]
    const [scenic, food, entertainment, trafficSubGroups] = await Promise.all([
      categories.includes(PoiCategory.SCENIC)
        ? this.locationService.nearbySearch({
            location: `${detail.location.lng},${detail.location.lat}`,
            radiusMeters: query.radiusMeters,
            limit: query.limitPerCategory,
            keywords: '景点',
            category: PoiCategory.SCENIC,
          })
        : Promise.resolve([]),
      categories.includes(PoiCategory.FOOD)
        ? this.locationService.nearbySearch({
            location: `${detail.location.lng},${detail.location.lat}`,
            radiusMeters: query.radiusMeters,
            limit: query.limitPerCategory,
            keywords: '餐饮',
            category: PoiCategory.FOOD,
          })
        : Promise.resolve([]),
      categories.includes(PoiCategory.ENTERTAINMENT)
        ? this.locationService.nearbySearch({
            location: `${detail.location.lng},${detail.location.lat}`,
            radiusMeters: query.radiusMeters,
            limit: query.limitPerCategory,
            keywords: '娱乐',
            category: PoiCategory.ENTERTAINMENT,
          })
        : Promise.resolve([]),
      categories.includes(PoiCategory.TRAFFIC)
        ? Promise.all([
            this.locationService.nearbySearch({
              location: `${detail.location.lng},${detail.location.lat}`,
              radiusMeters: query.radiusMeters,
              limit: query.limitPerCategory,
              keywords: '地铁站',
              category: PoiCategory.TRAFFIC,
            }),
            this.locationService.nearbySearch({
              location: `${detail.location.lng},${detail.location.lat}`,
              radiusMeters: query.radiusMeters,
              limit: query.limitPerCategory,
              keywords: '公交站',
              category: PoiCategory.TRAFFIC,
            }),
            this.locationService.nearbySearch({
              location: `${detail.location.lng},${detail.location.lat}`,
              radiusMeters: query.radiusMeters,
              limit: query.limitPerCategory,
              keywords: '火车站',
              category: PoiCategory.TRAFFIC,
            }),
          ])
        : Promise.resolve([]),
    ])
    const traffic = Array.isArray(trafficSubGroups[0])
      ? this.mergePoiItems(trafficSubGroups, query.limitPerCategory)
      : []
    return {
      scenic,
      food,
      entertainment,
      traffic,
    }
  }

  async getTagList() {
    return this.prisma.hotelTag.findMany({
      orderBy: [{ category: 'asc' }, { name: 'asc' }],
      select: {
        id: true,
        name: true,
        category: true,
        icon: true,
      },
    })
  }
}
