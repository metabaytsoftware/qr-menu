import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

const SELECT = {
  id: true, email: true, firstName: true, lastName: true,
  role: true, isActive: true, venueId: true, createdAt: true,
};

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  findAll(venueId?: string) {
    return this.prisma.user.findMany({
      where: venueId ? { venueId } : undefined,
      select: SELECT,
      orderBy: [{ role: 'asc' }, { firstName: 'asc' }],
    });
  }

  async create(dto: CreateUserDto) {
    const exists = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (exists) throw new BadRequestException('Bu e-posta zaten kayıtlı');
    const passwordHash = await bcrypt.hash(dto.password, 12);
    return this.prisma.user.create({
      data: {
        firstName: dto.firstName,
        lastName: dto.lastName,
        email: dto.email,
        role: dto.role,
        venueId: dto.venueId ?? null,
        passwordHash,
      },
      select: SELECT,
    });
  }

  async update(id: string, dto: UpdateUserDto, requesterId: string) {
    if (id === requesterId && dto.role !== undefined) {
      throw new BadRequestException('Kendi rolünüzü değiştiremezsiniz');
    }
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('Kullanıcı bulunamadı');
    return this.prisma.user.update({ where: { id }, data: dto, select: SELECT });
  }

  async resetPassword(id: string, password: string) {
    if (password.length < 8) throw new BadRequestException('Şifre en az 8 karakter olmalı');
    const passwordHash = await bcrypt.hash(password, 12);
    await this.prisma.user.update({ where: { id }, data: { passwordHash } });
    // Mevcut refresh token'larını iptal et
    await this.prisma.refreshToken.deleteMany({ where: { userId: id } });
    return { ok: true };
  }

  async remove(id: string, requesterId: string) {
    if (id === requesterId) throw new BadRequestException('Kendinizi silemezsiniz');
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('Kullanıcı bulunamadı');
    // Soft delete — deaktive et
    return this.prisma.user.update({
      where: { id },
      data: { isActive: false },
      select: SELECT,
    });
  }
}
