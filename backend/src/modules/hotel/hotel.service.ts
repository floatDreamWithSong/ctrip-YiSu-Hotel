import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common'
import { ApiHotelTypes, HotelReviewStatus } from '@yisu/shared'
import { PrismaService } from '@/utils/prisma/prisma.service'
import { Prisma, PriceMode, ReviewStatus, RejectReasonType } from 'prisma-generated'

type PrismaTransaction = Prisma.TransactionClient

@Injectable()
export class HotelService {
  constructor(private readonly prisma: PrismaService) {}

  private toPagination(page: number, limit: number) {
    return {
      skip: (page - 1) * limit,
      take: limit,
    }
  }

  private assertEditableStatus(status: ReviewStatus) {
    if (status === ReviewStatus.PENDING || status === ReviewStatus.APPROVED) {
      throw new BadRequestException('审核中或已发布的酒店信息不能编辑')
    }
  }

  private assertCanSubmit(status: ReviewStatus) {
    if (status !== ReviewStatus.DRAFT && status !== ReviewStatus.REJECTED) {
      throw new BadRequestException('仅待发布或待更改状态可提交审核')
    }
  }

  private assertCanWithdraw(status: ReviewStatus) {
    if (status !== ReviewStatus.PENDING) {
      throw new BadRequestException('仅审核中状态可撤回')
    }
  }

  private assertCanOffline(status: ReviewStatus) {
    if (status !== ReviewStatus.APPROVED) {
      throw new BadRequestException('仅已发布状态可下线')
    }
  }

  private async ensureMerchantProfile(merchantId: number) {
    const profile = await this.prisma.merchantProfile.findUnique({
      where: { userId: merchantId },
    })
    if (!profile) {
      throw new BadRequestException('商家资料不存在，请重新登录后重试')
    }
  }

  private async ensureAdminProfile(adminId: number) {
    const profile = await this.prisma.adminProfile.findUnique({
      where: { userId: adminId },
    })
    if (!profile) {
      throw new BadRequestException('管理员资料不存在，请重新登录后重试')
    }
  }

  private async ensureMerchantHotel(merchantId: number, hotelId: number) {
    await this.ensureMerchantProfile(merchantId)
    const hotel = await this.prisma.hotel.findFirst({
      where: {
        id: hotelId,
        merchantId,
        isDeleted: false,
      },
    })
    if (!hotel) {
      throw new NotFoundException('酒店不存在')
    }
    return hotel
  }

  private async ensureMerchantHotelInfo(merchantId: number, hotelId: number, infoId: number) {
    const info = await this.prisma.hotelInfo.findFirst({
      where: {
        id: infoId,
        hotelId,
        reviewStatus: { not: ReviewStatus.DEPRECATED },
        hotel: {
          merchantId,
          isDeleted: false,
        },
      },
      include: {
        hotel: true,
      },
    })
    if (!info) {
      throw new NotFoundException('酒店信息不存在')
    }
    return info
  }

  private normalizeTags(tags: string[]) {
    return Array.from(new Set(tags.map((item) => item.trim()).filter(Boolean)))
  }

  private parseTimeToMinutes(time: string) {
    const [hours, minutes] = time.split(':').map(Number)
    if (!Number.isInteger(hours) || !Number.isInteger(minutes) || hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
      throw new BadRequestException(`非法时间格式: ${time}`)
    }
    return hours * 60 + minutes
  }

  private validateRoomTypeInput(room: ApiHotelTypes['HotelInfoCreate']['roomTypes'][number]) {
    if (room.priceMode === PriceMode.PER_HOUR) {
      if (room.hourlySlots.length === 0) {
        throw new BadRequestException(`钟点房型 ${room.name} 至少需要一个时段`)
      }
      for (const slot of room.hourlySlots) {
        const start = this.parseTimeToMinutes(slot.startTime)
        const end = start + room.duration * 60
        if (end > 24 * 60) {
          throw new BadRequestException(`钟点房型 ${room.name} 的时段 ${slot.startTime} 超过当日 24:00`)
        }
      }
      return
    }
    if (room.hourlySlots.length > 0) {
      throw new BadRequestException(`非钟点房型 ${room.name} 不能配置时段`)
    }
  }

  private async replaceTags(tx: PrismaTransaction, infoId: number, tags: string[]) {
    const normalized = this.normalizeTags(tags)
    await tx.hotelTagRelation.deleteMany({
      where: { infoId },
    })
    if (normalized.length === 0) {
      return
    }
    const existingTags = await tx.hotelTag.findMany({
      where: {
        name: { in: normalized },
      },
    })
    const existingNameSet = new Set(existingTags.map((tag) => tag.name))
    const missingNames = normalized.filter((name) => !existingNameSet.has(name))
    if (missingNames.length > 0) {
      await tx.hotelTag.createMany({
        data: missingNames.map((name) => ({
          name,
          category: 'custom',
        })),
        skipDuplicates: true,
      })
    }
    const allTags = await tx.hotelTag.findMany({
      where: {
        name: { in: normalized },
      },
    })
    if (allTags.length > 0) {
      await tx.hotelTagRelation.createMany({
        data: allTags.map((tag) => ({
          infoId,
          tagId: tag.id,
        })),
        skipDuplicates: true,
      })
    }
  }

  private async replaceInfoChildren(tx: PrismaTransaction, infoId: number, body: ApiHotelTypes['HotelInfoCreate']) {
    await tx.hotelImage.deleteMany({ where: { infoId } })
    await tx.hourlyRoomSlot.deleteMany({
      where: {
        roomType: {
          infoId,
        },
      },
    })
    await tx.roomType.deleteMany({ where: { infoId } })
    await this.replaceTags(tx, infoId, body.tags)

    if (body.images.length > 0) {
      await tx.hotelImage.createMany({
        data: body.images.map((item) => ({
          infoId,
          url: item.url,
          sortOrder: item.sortOrder,
          caption: item.caption,
        })),
      })
    }

    if (body.roomTypes.length > 0) {
      for (const room of body.roomTypes) {
        this.validateRoomTypeInput(room)
        const createdRoom = await tx.roomType.create({
          data: {
            infoId,
            count: room.count,
            name: room.name,
            price: room.price,
            priceMode: room.priceMode,
            duration: room.duration,
            bedType: room.bedType,
            maxGuests: room.maxGuests,
            area: room.area,
            imageUrl: room.imageUrl,
            sortOrder: room.sortOrder,
          },
        })
        if (room.hourlySlots.length > 0) {
          await tx.hourlyRoomSlot.createMany({
            data: room.hourlySlots.map((slot) => ({
              roomTypeId: createdRoom.id,
              startTime: slot.startTime,
            })),
          })
        }
      }
    }
  }

  private async updateGeoLocation(tx: PrismaTransaction, infoId: number, location?: { lng: number; lat: number }) {
    if (!location) {
      await tx.$executeRaw`UPDATE "hotel_infos" SET "location_geog" = NULL WHERE "id" = ${infoId}`
      return
    }
    await tx.$executeRaw`
      UPDATE "hotel_infos"
      SET "location_geog" = ST_SetSRID(ST_MakePoint(${location.lng}, ${location.lat}), 4326)::geography
      WHERE "id" = ${infoId}
    `
  }

  private async getInfoLocation(infoId: number) {
    const rows = await this.prisma.$queryRaw<Array<{ lng: number | null; lat: number | null }>>`
      SELECT
        ST_X("location_geog"::geometry) AS lng,
        ST_Y("location_geog"::geometry) AS lat
      FROM "hotel_infos"
      WHERE "id" = ${infoId}
      LIMIT 1
    `
    const row = rows[0]
    if (!row || row.lng === null || row.lat === null) {
      return null
    }
    return {
      lng: Number(row.lng),
      lat: Number(row.lat),
    }
  }

  private buildInfoPayload(info: {
    id: number
    hotelId: number
    infoNickname: string
    name: string
    enName: string | null
    starLevel: number
    phone: string | null
    description: string | null
    province: string | null
    city: string | null
    district: string | null
    address: string
    openedAt: Date | null
    homeAdImage: string | null
    reviewStatus: ReviewStatus
    createdBy: number
    createdAt: Date
    updatedAt: Date
    images: Array<{ id: number; url: string; sortOrder: number; caption: string | null }>
    roomTypes: Array<{
      id: number
      count: number
      name: string
      price: number
      priceMode: PriceMode
      duration: number
      bedType: string | null
      maxGuests: number
      area: number | null
      imageUrl: string | null
      sortOrder: number
      hourlySlots: Array<{
        id: number
        startTime: string
      }>
    }>
    tags: Array<{ tag: { id: number; name: string; category: string; icon: string | null } }>
  }) {
    return {
      id: info.id,
      hotelId: info.hotelId,
      infoNickname: info.infoNickname,
      name: info.name,
      enName: info.enName,
      starLevel: info.starLevel,
      phone: info.phone,
      description: info.description,
      province: info.province,
      city: info.city,
      district: info.district,
      address: info.address,
      openedAt: info.openedAt,
      homeAdImage: info.homeAdImage,
      reviewStatus: info.reviewStatus,
      createdBy: info.createdBy,
      createdAt: info.createdAt,
      updatedAt: info.updatedAt,
      images: info.images
        .slice()
        .sort((a, b) => a.sortOrder - b.sortOrder)
        .map((item) => ({
          id: item.id,
          url: item.url,
          sortOrder: item.sortOrder,
          caption: item.caption,
        })),
      roomTypes: info.roomTypes
        .slice()
        .sort((a, b) => a.sortOrder - b.sortOrder)
        .map((room) => ({
          ...room,
          hourlySlots: room.hourlySlots
            .slice()
            .map((slot) => ({
              id: slot.id,
              startTime: slot.startTime,
            })),
        })),
      tags: info.tags.map((relation) => relation.tag.name),
    }
  }

  async getMerchantHotels(merchantId: number, query: ApiHotelTypes['HotelQuery']) {
    await this.ensureMerchantProfile(merchantId)
    const { page, limit, keyword } = query
    const where: Prisma.HotelWhereInput = {
      merchantId,
      isDeleted: false,
      ...(keyword
        ? {
            hotelNickname: {
              contains: keyword,
              mode: 'insensitive',
            },
          }
        : {}),
    }
    const [total, items] = await this.prisma.$transaction([
      this.prisma.hotel.count({ where }),
      this.prisma.hotel.findMany({
        where,
        orderBy: { updatedAt: 'desc' },
        ...this.toPagination(page, limit),
        include: {
          publishedInfo: {
            select: {
              id: true,
              infoNickname: true,
              name: true,
              reviewStatus: true,
            },
          },
          _count: {
            select: {
              infos: {
                where: {
                  reviewStatus: { not: ReviewStatus.DEPRECATED },
                },
              },
            },
          },
        },
      }),
    ])
    return {
      total,
      page,
      limit,
      items,
    }
  }

  async createHotel(merchantId: number, body: ApiHotelTypes['HotelCreate']) {
    await this.ensureMerchantProfile(merchantId)
    const hotel = await this.prisma.hotel.create({
      data: {
        hotelNickname: body.hotelNickname,
        merchantId,
      },
    })
    return hotel
  }

  async softDeleteHotel(merchantId: number, hotelId: number) {
    await this.ensureMerchantHotel(merchantId, hotelId)
    await this.prisma.hotel.update({
      where: { id: hotelId },
      data: {
        isDeleted: true,
        publishedInfoId: null,
      },
    })
    return null
  }

  async getMerchantHotelDetail(merchantId: number, hotelId: number) {
    const hotel = await this.ensureMerchantHotel(merchantId, hotelId)
    const infoCount = await this.prisma.hotelInfo.count({
      where: {
        hotelId,
        reviewStatus: {
          not: ReviewStatus.DEPRECATED,
        },
      },
    })
    return {
      ...hotel,
      infoCount,
    }
  }

  async updateHomeAdEnabled(merchantId: number, hotelId: number, body: ApiHotelTypes['HotelUpdateHomeAd']) {
    await this.ensureMerchantHotel(merchantId, hotelId)
    return this.prisma.hotel.update({
      where: { id: hotelId },
      data: {
        isHomeAdEnabled: body.isHomeAdEnabled,
      },
    })
  }

  async getMerchantHotelInfos(merchantId: number, hotelId: number, query: ApiHotelTypes['HotelInfoQuery']) {
    await this.ensureMerchantHotel(merchantId, hotelId)
    const { page, limit, reviewStatus } = query
    const where: Prisma.HotelInfoWhereInput = {
      hotelId,
      reviewStatus: {
        not: ReviewStatus.DEPRECATED,
      },
      ...(reviewStatus
        ? {
            reviewStatus: reviewStatus,
          }
        : {}),
    }
    const [total, items] = await this.prisma.$transaction([
      this.prisma.hotelInfo.count({ where }),
      this.prisma.hotelInfo.findMany({
        where,
        ...this.toPagination(page, limit),
        orderBy: {
          updatedAt: 'desc',
        },
        select: {
          id: true,
          infoNickname: true,
          name: true,
          reviewStatus: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
    ])
    return {
      total,
      page,
      limit,
      items,
    }
  }

  async getMerchantHotelInfoDetail(merchantId: number, hotelId: number, infoId: number) {
    await this.ensureMerchantHotel(merchantId, hotelId)
    const info = await this.prisma.hotelInfo.findFirst({
      where: {
        id: infoId,
        hotelId,
        reviewStatus: { not: ReviewStatus.DEPRECATED },
      },
      include: {
        images: true,
        roomTypes: {
          include: {
            hourlySlots: true
          },
        },
        tags: {
          include: {
            tag: true,
          },
        },
      },
    })
    if (!info) {
      throw new NotFoundException('酒店信息不存在')
    }
    const location = await this.getInfoLocation(info.id)
    const latestRejected = await this.prisma.reviewRecord.findFirst({
      where: {
        infoId,
        action: ReviewStatus.REJECTED,
      },
      orderBy: {
        createdAt: 'desc',
      },
      select: {
        rejectReason: true,
        rejectDetail: true,
        createdAt: true,
        reviewer: {
          select: {
            user: {
              select: {
                username: true,
              },
            },
          },
        },
      },
    })
    return {
      ...this.buildInfoPayload(info),
      location,
      latestRejectedReview: latestRejected
        ? {
            rejectReason: latestRejected.rejectReason,
            rejectDetail: latestRejected.rejectDetail,
            createdAt: latestRejected.createdAt,
            reviewerName: latestRejected.reviewer.user.username,
          }
        : null,
    }
  }

  async createHotelInfo(merchantId: number, hotelId: number, body: ApiHotelTypes['HotelInfoCreate']) {
    await this.ensureMerchantHotel(merchantId, hotelId)
    const info = await this.prisma.$transaction(async (tx) => {
      const created = await tx.hotelInfo.create({
        data: {
          hotelId,
          infoNickname: body.infoNickname,
          name: body.name,
          enName: body.enName,
          starLevel: body.starLevel,
          phone: body.phone,
          description: body.description,
          province: body.province,
          city: body.city,
          district: body.district,
          address: body.address,
          openedAt: body.openedAt ? new Date(body.openedAt) : null,
          homeAdImage: body.homeAdImage,
          reviewStatus: ReviewStatus.DRAFT,
          createdBy: merchantId,
        },
      })
      await this.replaceInfoChildren(tx, created.id, body)
      await this.updateGeoLocation(tx, created.id, body.location)
      return created
    })
    return this.getMerchantHotelInfoDetail(merchantId, hotelId, info.id)
  }

  async updateHotelInfo(merchantId: number, hotelId: number, infoId: number, body: ApiHotelTypes['HotelInfoUpdate']) {
    const info = await this.ensureMerchantHotelInfo(merchantId, hotelId, infoId)
    this.assertEditableStatus(info.reviewStatus)
    await this.prisma.$transaction(async (tx) => {
      await tx.hotelInfo.update({
        where: { id: infoId },
        data: {
          infoNickname: body.infoNickname,
          name: body.name,
          enName: body.enName,
          starLevel: body.starLevel,
          phone: body.phone,
          description: body.description,
          province: body.province,
          city: body.city,
          district: body.district,
          address: body.address,
          openedAt: body.openedAt ? new Date(body.openedAt) : null,
          homeAdImage: body.homeAdImage,
        },
      })
      await this.replaceInfoChildren(tx, infoId, body)
      await this.updateGeoLocation(tx, infoId, body.location)
    })
    return this.getMerchantHotelInfoDetail(merchantId, hotelId, infoId)
  }

  async softDeleteHotelInfo(merchantId: number, hotelId: number, infoId: number) {
    const info = await this.ensureMerchantHotelInfo(merchantId, hotelId, infoId)
    await this.prisma.$transaction(async (tx) => {
      await tx.hotelInfo.update({
        where: { id: infoId },
        data: {
          reviewStatus: ReviewStatus.DEPRECATED,
        },
      })
      if (info.hotel.publishedInfoId === infoId) {
        await tx.hotel.update({
          where: { id: hotelId },
          data: {
            publishedInfoId: null,
          },
        })
      }
    })
    return null
  }

  async duplicateHotelInfo(merchantId: number, hotelId: number, infoId: number) {
    const source = await this.prisma.hotelInfo.findFirst({
      where: {
        id: infoId,
        hotelId,
        reviewStatus: { not: ReviewStatus.DEPRECATED },
        hotel: {
          merchantId,
          isDeleted: false,
        },
      },
      include: {
        images: true,
        roomTypes: {
          include: {
            hourlySlots: true
          },
        },
        tags: {
          include: {
            tag: true,
          },
        },
      },
    })
    if (!source) {
      throw new NotFoundException('酒店信息不存在')
    }
    const location = await this.getInfoLocation(source.id)
    const duplicated = await this.prisma.$transaction(async (tx) => {
      const copy = await tx.hotelInfo.create({
        data: {
          hotelId,
          infoNickname: `${source.infoNickname}-副本`,
          name: source.name,
          enName: source.enName,
          starLevel: source.starLevel,
          phone: source.phone,
          description: source.description,
          province: source.province,
          city: source.city,
          district: source.district,
          address: source.address,
          openedAt: source.openedAt,
          homeAdImage: source.homeAdImage,
          reviewStatus: ReviewStatus.DRAFT,
          createdBy: merchantId,
        },
      })
      await this.replaceInfoChildren(tx, copy.id, {
        infoNickname: copy.infoNickname,
        name: copy.name,
        enName: copy.enName ?? undefined,
        starLevel: copy.starLevel,
        phone: copy.phone ?? undefined,
        description: copy.description ?? undefined,
        province: copy.province ?? undefined,
        city: copy.city ?? undefined,
        district: copy.district ?? undefined,
        address: copy.address,
        location: location ?? undefined,
        openedAt: copy.openedAt?.toISOString(),
        homeAdImage: copy.homeAdImage ?? undefined,
        tags: source.tags.map((item) => item.tag.name),
        images: source.images.map((image) => ({
          url: image.url,
          sortOrder: image.sortOrder,
          caption: image.caption ?? undefined,
        })),
        roomTypes: source.roomTypes.map((room) => ({
          count: room.count,
          name: room.name,
          price: room.price,
          priceMode: room.priceMode,
          duration: room.duration,
          bedType: room.bedType ?? undefined,
          maxGuests: room.maxGuests,
          area: room.area ?? undefined,
          imageUrl: room.imageUrl ?? undefined,
          sortOrder: room.sortOrder,
          hourlySlots: room.hourlySlots.map((slot) => ({
            startTime: slot.startTime,
          })),
        })),
      })
      await this.updateGeoLocation(tx, copy.id, location ?? undefined)
      return copy
    })
    return this.getMerchantHotelInfoDetail(merchantId, hotelId, duplicated.id)
  }

  async submitForReview(merchantId: number, hotelId: number, infoId: number) {
    const info = await this.ensureMerchantHotelInfo(merchantId, hotelId, infoId)
    this.assertCanSubmit(info.reviewStatus)
    const pendingCount = await this.prisma.hotelInfo.count({
      where: {
        hotelId,
        id: { not: infoId },
        reviewStatus: ReviewStatus.PENDING,
      },
    })
    if (pendingCount > 0) {
      throw new BadRequestException('当前酒店已有正在审核的酒店信息，请等待审核完成后再提交')
    }
    await this.prisma.hotelInfo.update({
      where: { id: infoId },
      data: {
        reviewStatus: ReviewStatus.PENDING,
      },
    })
    return null
  }

  async withdrawReview(merchantId: number, hotelId: number, infoId: number) {
    const info = await this.ensureMerchantHotelInfo(merchantId, hotelId, infoId)
    this.assertCanWithdraw(info.reviewStatus)
    await this.prisma.hotelInfo.update({
      where: { id: infoId },
      data: {
        reviewStatus: ReviewStatus.DRAFT,
      },
    })
    return null
  }

  async offlineHotelInfo(merchantId: number, hotelId: number, infoId: number) {
    const info = await this.ensureMerchantHotelInfo(merchantId, hotelId, infoId)
    this.assertCanOffline(info.reviewStatus)
    await this.prisma.$transaction(async (tx) => {
      await tx.hotelInfo.update({
        where: { id: infoId },
        data: {
          reviewStatus: ReviewStatus.DRAFT,
        },
      })
      if (info.hotel.publishedInfoId === infoId) {
        await tx.hotel.update({
          where: { id: hotelId },
          data: {
            publishedInfoId: null,
          },
        })
      }
    })
    return null
  }

  async getAdminReviewHotelInfos(query: ApiHotelTypes['AdminReviewQuery']) {
    const { page, limit, reviewStatus } = query
    const where: Prisma.HotelInfoWhereInput = {
      hotel: {
        isDeleted: false,
      },
      reviewStatus: reviewStatus
        ? reviewStatus
        : {
            in: [ReviewStatus.PENDING, ReviewStatus.APPROVED, ReviewStatus.REJECTED],
          },
    }
    const [total, items] = await this.prisma.$transaction([
      this.prisma.hotelInfo.count({ where }),
      this.prisma.hotelInfo.findMany({
        where,
        ...this.toPagination(page, limit),
        orderBy: {
          updatedAt: 'desc',
        },
        select: {
          id: true,
          infoNickname: true,
          name: true,
          reviewStatus: true,
          createdAt: true,
          updatedAt: true,
          hotel: {
            select: {
              id: true,
              hotelNickname: true,
              merchant: {
                select: {
                  user: {
                    select: {
                      id: true,
                      username: true,
                      email: true,
                    },
                  },
                },
              },
            },
          },
        },
      }),
    ])
    return {
      total,
      page,
      limit,
      items,
    }
  }

  async getAdminReviewHotelInfoDetail(infoId: number) {
    const info = await this.prisma.hotelInfo.findFirst({
      where: {
        id: infoId,
        reviewStatus: {
          not: ReviewStatus.DEPRECATED,
        },
        hotel: {
          isDeleted: false,
        },
      },
      include: {
        hotel: {
          include: {
            merchant: {
              include: {
                user: {
                  select: {
                    id: true,
                    username: true,
                    email: true,
                  },
                },
              },
            },
          },
        },
        images: true,
        roomTypes: {
          include: {
            hourlySlots: true,
          },
        },
        tags: {
          include: {
            tag: true,
          },
        },
      },
    })
    if (!info) {
      throw new NotFoundException('酒店信息不存在')
    }
    const [location, recentRecords] = await Promise.all([
      this.getInfoLocation(infoId),
      this.prisma.reviewRecord.findMany({
        where: {
          infoId,
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: 20,
        include: {
          reviewer: {
            select: {
              user: {
                select: {
                  username: true,
                },
              },
            },
          },
        },
      }),
    ])
    return {
      ...this.buildInfoPayload(info),
      location,
      hotel: {
        id: info.hotel.id,
        hotelNickname: info.hotel.hotelNickname,
        merchant: info.hotel.merchant.user,
      },
      reviewRecords: recentRecords.map((record) => ({
        id: record.id,
        action: record.action,
        rejectReason: record.rejectReason,
        rejectDetail: record.rejectDetail,
        createdAt: record.createdAt,
        reviewerName: record.reviewer.user.username,
      })),
    }
  }

  async reviewHotelInfo(adminId: number, infoId: number, body: ApiHotelTypes['AdminReviewAction']) {
    await this.ensureAdminProfile(adminId)
    const info = await this.prisma.hotelInfo.findFirst({
      where: {
        id: infoId,
        reviewStatus: {
          in: [ReviewStatus.PENDING, ReviewStatus.REJECTED, ReviewStatus.APPROVED],
        },
        hotel: {
          isDeleted: false,
        },
      },
      include: {
        hotel: true,
      },
    })
    if (!info) {
      throw new NotFoundException('酒店信息不存在或状态不支持审核')
    }
    const nextStatus = body.action === HotelReviewStatus.APPROVED ? ReviewStatus.APPROVED : ReviewStatus.REJECTED
    if (info.reviewStatus === ReviewStatus.REJECTED && nextStatus === ReviewStatus.REJECTED) {
      throw new BadRequestException('待更改状态不能再次拒绝')
    }
    if (info.reviewStatus === ReviewStatus.APPROVED && nextStatus === ReviewStatus.APPROVED) {
      throw new BadRequestException('已发布状态不能再次通过')
    }
    await this.prisma.$transaction(async (tx) => {
      if (nextStatus === ReviewStatus.APPROVED) {
        const previousPublishedId = info.hotel.publishedInfoId
        if (previousPublishedId && previousPublishedId !== info.id) {
          await tx.hotelInfo.update({
            where: { id: previousPublishedId },
            data: {
              reviewStatus: ReviewStatus.DRAFT,
            },
          })
        }
        await tx.hotel.update({
          where: { id: info.hotel.id },
          data: {
            publishedInfoId: info.id,
          },
        })
      } else if (info.hotel.publishedInfoId === info.id) {
        await tx.hotel.update({
          where: { id: info.hotel.id },
          data: {
            publishedInfoId: null,
          },
        })
      }

      await tx.hotelInfo.update({
        where: { id: info.id },
        data: {
          reviewStatus: nextStatus,
        },
      })

      await tx.reviewRecord.create({
        data: {
          hotelId: info.hotel.id,
          infoId: info.id,
          reviewerId: adminId,
          action: nextStatus,
          rejectReason: nextStatus === ReviewStatus.REJECTED ? body.rejectReason : null,
          rejectDetail:
            nextStatus === ReviewStatus.REJECTED && body.rejectReason === RejectReasonType.OTHER
              ? (body.rejectDetail ?? null)
              : null,
        },
      })
    })
    return null
  }

  async getReviewRecords(query: ApiHotelTypes['ReviewRecordQuery']) {
    const { page, limit, startAt, endAt, action, rejectReason, order } = query
    const where: Prisma.ReviewRecordWhereInput = {
      ...(startAt || endAt
        ? {
            createdAt: {
              ...(startAt ? { gte: new Date(startAt) } : {}),
              ...(endAt ? { lte: new Date(endAt) } : {}),
            },
          }
        : {}),
      ...(action ? { action: action } : {}),
      ...(rejectReason ? { rejectReason: rejectReason } : {}),
      hotel: {
        isDeleted: false,
      },
    }
    const [total, items] = await this.prisma.$transaction([
      this.prisma.reviewRecord.count({ where }),
      this.prisma.reviewRecord.findMany({
        where,
        ...this.toPagination(page, limit),
        orderBy: {
          createdAt: order,
        },
        include: {
          reviewer: {
            select: {
              user: {
                select: {
                  id: true,
                  username: true,
                  email: true,
                },
              },
            },
          },
          hotel: {
            select: {
              id: true,
              hotelNickname: true,
            },
          },
          info: {
            select: {
              id: true,
              infoNickname: true,
              name: true,
            },
          },
        },
      }),
    ])
    return {
      total,
      page,
      limit,
      items: items.map((item) => ({
        id: item.id,
        action: item.action,
        rejectReason: item.rejectReason,
        rejectDetail: item.rejectDetail,
        createdAt: item.createdAt,
        reviewer: item.reviewer.user,
        hotel: item.hotel,
        info: item.info,
      })),
    }
  }
}
