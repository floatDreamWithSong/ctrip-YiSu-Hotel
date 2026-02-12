import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '@/utils/prisma/prisma.service';
import {
  GetHotelsType,
  GetPendingHotelsType,
  GetReviewRecordsType,
  RejectHotelType,
  RejectReasonTypeSchema,
} from '@yisu/shared';
import { Prisma } from 'prisma-generated';

@Injectable()
export class AdminService {
  constructor(private readonly prisma: PrismaService) {}

  async getHotels(query: GetHotelsType) {
    const { page, pageSize, status, startTime, endTime, merchantName } = query;

    const where: Prisma.HotelVersionWhereInput = {};

    if (status) {
      where.reviewStatus = status;
    }

    if (startTime || endTime) {
      where.createdAt = {
        ...(startTime && { gte: new Date(startTime) }),
        ...(endTime && { lte: new Date(endTime) }),
      };
    }

    if (merchantName) {
      where.hotel = {
        merchant: {
          displayName: {
            contains: merchantName,
          },
        },
      };
    }

    const [total, items] = await this.prisma.$transaction([
      this.prisma.hotelVersion.count({ where }),
      this.prisma.hotelVersion.findMany({
        where,
        include: {
          hotel: {
            include: {
              merchant: {
                select: {
                  userId: true,
                  displayName: true,
                },
              },
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ]);

    const versionIds = items.map(item => item.id);
    const latestReviewRecords = versionIds.length
      ? await this.prisma.reviewRecord.findMany({
        where: { versionId: { in: versionIds } },
        orderBy: { createdAt: 'desc' },
      })
      : [];

    const reviewedAtMap = new Map<number, Date>();
    for (const record of latestReviewRecords) {
      if (!reviewedAtMap.has(record.versionId)) {
        reviewedAtMap.set(record.versionId, record.createdAt);
      }
    }

    return {
      total,
      items: items.map(item => ({
        id: item.id,
        hotelId: item.hotelId,
        name: item.name,
        merchantId: item.hotel.merchantId,
        merchantName: item.hotel.merchant.displayName,
        createdAt: item.createdAt,
        reviewedAt: reviewedAtMap.get(item.id),
        isNewHotel: !item.previousVersionId,
        reviewStatus: item.reviewStatus,
      })),
    };
  }

  async getPendingHotels(query: GetPendingHotelsType) {
    return this.getHotels({
      ...query,
      status: 'PENDING',
    });
  }

  async getReviewRecords(query: GetReviewRecordsType) {
    const { page, pageSize, startTime, endTime, action, rejectReason, sort } = query;

    const where: Prisma.ReviewRecordWhereInput = {};

    if (action) {
      where.action = action;
    }

    if (rejectReason) {
      where.rejectReason = rejectReason;
    }

    if (startTime || endTime) {
      where.createdAt = {
        ...(startTime && { gte: new Date(startTime) }),
        ...(endTime && { lte: new Date(endTime) }),
      };
    }

    const [total, records] = await this.prisma.$transaction([
      this.prisma.reviewRecord.count({ where }),
      this.prisma.reviewRecord.findMany({
        where,
        orderBy: {
          createdAt: sort,
        },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ]);

    const versionIds = [...new Set(records.map(record => record.versionId))];
    const reviewerIds = [...new Set(records.map(record => record.reviewerId))];

    const [versions, reviewers] = await this.prisma.$transaction([
      this.prisma.hotelVersion.findMany({
        where: { id: { in: versionIds } },
        select: {
          id: true,
          name: true,
          hotel: {
            select: {
              merchant: {
                select: {
                  displayName: true,
                },
              },
            },
          },
        },
      }),
      this.prisma.user.findMany({
        where: { id: { in: reviewerIds } },
        select: {
          id: true,
          username: true,
        },
      }),
    ]);

    const versionMap = new Map(versions.map(version => [version.id, version]));
    const reviewerMap = new Map(reviewers.map(reviewer => [reviewer.id, reviewer.username]));

    return {
      total,
      items: records.map(record => {
        const version = versionMap.get(record.versionId);
        return {
          id: record.id,
          versionId: record.versionId,
          hotelId: record.hotelId,
          hotelName: version?.name ?? '未知酒店',
          merchantName: version?.hotel.merchant.displayName ?? '未知商家',
          reviewerId: record.reviewerId,
          reviewerName: reviewerMap.get(record.reviewerId) ?? '未知',
          action: record.action,
          rejectReason: record.rejectReason,
          rejectDetail: record.rejectDetail,
          createdAt: record.createdAt,
        };
      }),
    };
  }

  async getHotelDetail(versionId: number) {
    const currentVersion = await this.prisma.hotelVersion.findUnique({
      where: { id: versionId },
      include: {
        roomTypes: true,
        images: { orderBy: { sortOrder: 'asc' } },
        tags: {
          include: {
            tag: true,
          },
        },
        hotel: {
          include: {
            merchant: {
              select: {
                userId: true,
                displayName: true,
              },
            },
          },
        },
      },
    });

    if (!currentVersion)
      return null;

    let previousVersion = null;
    if (currentVersion.previousVersionId) {
      previousVersion = await this.prisma.hotelVersion.findUnique({
        where: { id: currentVersion.previousVersionId },
        include: {
          roomTypes: true,
          images: { orderBy: { sortOrder: 'asc' } },
          tags: {
            include: {
              tag: true,
            },
          },
        },
      });
    }

    return {
      currentVersion,
      previousVersion,
      merchant: {
        id: currentVersion.hotel.merchantId,
        displayName: currentVersion.hotel.merchant.displayName,
      },
    };
  }

  async approveHotel(versionId: number, adminUserId: number) {
    const version = await this.prisma.hotelVersion.findUnique({
      where: { id: versionId },
      include: { hotel: true },
    });

    if (!version || version.reviewStatus !== 'PENDING') {
      throw new BadRequestException('酒店版本不存在或已审核');
    }

    return this.prisma.$transaction(async (tx) => {
      await tx.hotelVersion.update({
        where: { id: versionId },
        data: { reviewStatus: 'APPROVED' },
      });

      await tx.hotel.update({
        where: { id: version.hotelId },
        data: { publishedVersionId: versionId },
      });

      if (version.previousVersionId) {
        await tx.hotelVersion.update({
          where: { id: version.previousVersionId },
          data: { reviewStatus: 'DEPRECATED' },
        });
      }

      await tx.reviewRecord.create({
        data: {
          hotelId: version.hotelId,
          versionId: versionId,
          reviewerId: adminUserId,
          action: 'APPROVED',
        },
      });
    });
  }

  async rejectHotel(versionId: number, adminUserId: number, dto: RejectHotelType) {
    const version = await this.prisma.hotelVersion.findUnique({
      where: { id: versionId },
      include: { hotel: true },
    });

    if (!version) {
      throw new BadRequestException('酒店版本不存在');
    }

    if (version.reviewStatus !== 'PENDING' && version.reviewStatus !== 'APPROVED') {
      throw new BadRequestException('只能拒绝待审核或已通过的酒店版本');
    }

    return this.prisma.$transaction(async (tx) => {
      await tx.hotelVersion.update({
        where: { id: versionId },
        data: { reviewStatus: 'REJECTED' },
      });

      if (version.reviewStatus === 'APPROVED' && version.hotel.publishedVersionId === versionId) {
        await tx.hotel.update({
          where: { id: version.hotelId },
          data: { publishedVersionId: null },
        });
      }

      await tx.reviewRecord.create({
        data: {
          hotelId: version.hotelId,
          versionId: versionId,
          reviewerId: adminUserId,
          action: 'REJECTED',
          rejectReason: dto.rejectReason,
          rejectDetail: dto.rejectDetail,
        },
      });
    });
  }

  getRejectReasons() {
    const labels: Record<typeof RejectReasonTypeSchema.enum[keyof typeof RejectReasonTypeSchema.enum], string> = {
      INFO_INCOMPLETE: '信息不完整',
      INFO_INACCURATE: '信息不准确',
      IMAGE_QUALITY: '图片质量问题',
      PRICE_ABNORMAL: '价格异常',
      DUPLICATE: '重复酒店',
      POLICY_VIOLATION: '违反政策',
      OTHER: '其他原因',
    };

    return RejectReasonTypeSchema.options.map(option => ({
      value: option,
      label: labels[option],
    }));
  }

  async getReviewHistory(hotelId: number) {
    const records = await this.prisma.reviewRecord.findMany({
      where: { hotelId },
      orderBy: { createdAt: 'desc' },
    });

    if (!records.length) {
      return [];
    }

    const reviewerIds = [...new Set(records.map(r => r.reviewerId))];
    const reviewers = await this.prisma.user.findMany({
      where: { id: { in: reviewerIds } },
      select: { id: true, username: true },
    });

    const reviewerMap = new Map(reviewers.map(r => [r.id, r.username]));

    return records.map(record => ({
      id: record.id,
      versionId: record.versionId,
      reviewerName: reviewerMap.get(record.reviewerId) || '未知',
      action: record.action,
      rejectReason: record.rejectReason,
      rejectDetail: record.rejectDetail,
      createdAt: record.createdAt.toISOString(),
    }));
  }
}
