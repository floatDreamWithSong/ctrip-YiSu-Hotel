import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '@/utils/prisma/prisma.service';
import { GetPendingHotelsType } from '@yisu/shared';
import { Prisma } from 'prisma-generated';

@Injectable()
export class AdminService {
  constructor(private readonly prisma: PrismaService) {}

  async getPendingHotels(query: GetPendingHotelsType) {
    const { page, pageSize, startTime, endTime, merchantName } = query;

    const where: Prisma.HotelVersionWhereInput = {
      reviewStatus: 'PENDING',
    };

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

    return {
      total,
      items: items.map(item => ({
        id: item.id,
        hotelId: item.hotelId,
        name: item.name,
        merchantId: item.hotel.merchantId,
        merchantName: item.hotel.merchant.displayName,
        createdAt: item.createdAt,
        isNewHotel: !item.previousVersionId,
        reviewStatus: item.reviewStatus,
      })),
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
}
