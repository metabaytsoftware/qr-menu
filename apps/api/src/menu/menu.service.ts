import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class MenuService {
  constructor(private readonly prisma: PrismaService) {}

  async getByStationQr(stationQr: string) {
    console.log(`[MenuService] Fetching menu for QR: ${stationQr}`);
    const station = await this.prisma.station.findUnique({
      where: { qrCode: stationQr },
      include: {
        venue: {
          include: {
            categories: {
              where: { isActive: true },
              orderBy: { sortOrder: 'asc' },
              include: {
                products: {
                  where: { isActive: true },
                  orderBy: { name: 'asc' },
                },
              },
            },
          },
        },
      },
    });
    console.log(`[MenuService] Result found: ${!!station}`);

    if (!station || !station.isActive) {
      console.log(`[MenuService] Station not found or inactive`);
      throw new NotFoundException('Station not found');
    }

    try {
      console.log(`[MenuService] Mapping results for venue: ${station.venue.name}`);
      const result = {
        station: {
          id: station.id,
          name: station.name,
          qrCode: station.qrCode,
        },
        venue: {
          id: station.venue.id,
          name: station.venue.name,
          type: station.venue.type,
          logoUrl: station.venue.logoUrl,
        },
        categories: station.venue.categories.map((cat) => ({
          id: cat.id,
          name: cat.name,
          products: cat.products.map((p) => ({
            id: p.id,
            name: p.name,
            description: p.description,
            price: Number(p.price),
            imageUrl: p.imageUrl,
            categoryId: p.categoryId,
          })),
        })),
      };
      console.log(`[MenuService] Mapping complete, returning result`);
      return result;
    } catch (err: any) {
      console.error(`[MenuService] Mapping error:`, err);
      throw err;
    }
  }
}
