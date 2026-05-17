import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';

const CATEGORY_SELECT = { select: { id: true, name: true } };

@Injectable()
export class ProductsService {
  constructor(private readonly prisma: PrismaService) {}

  findByVenue(venueId: string) {
    return this.prisma.product.findMany({
      where: { venueId },
      include: { category: CATEGORY_SELECT },
      orderBy: [{ category: { sortOrder: 'asc' } }, { name: 'asc' }],
    });
  }

  create(dto: CreateProductDto) {
    return this.prisma.product.create({
      data: {
        venueId: dto.venueId,
        categoryId: dto.categoryId,
        name: dto.name,
        description: dto.description,
        price: dto.price,
        imageUrl: dto.imageUrl,
      },
      include: { category: CATEGORY_SELECT },
    });
  }

  async update(id: string, dto: UpdateProductDto) {
    await this.findOne(id);
    return this.prisma.product.update({
      where: { id },
      data: dto,
      include: { category: CATEGORY_SELECT },
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.product.delete({ where: { id } });
  }

  private async findOne(id: string) {
    const product = await this.prisma.product.findUnique({ where: { id } });
    if (!product) throw new NotFoundException('Product not found');
    return product;
  }
}
