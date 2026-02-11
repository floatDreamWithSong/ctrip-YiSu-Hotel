import { Injectable } from '@nestjs/common';
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
}
