import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateNotificationPrefsDto } from './dto/update-notification-prefs.dto';

@Injectable()
export class NotificationsService {
  constructor(private readonly prisma: PrismaService) {}

  /** Get preferences for a user — create default row if absent */
  async getPrefs(userId: string) {
    const existing = await this.prisma.userNotificationPreferences.findUnique({
      where: { userId },
    });

    if (existing) return existing;

    // Auto-create with sensible defaults
    return this.prisma.userNotificationPreferences.create({
      data: { userId },
    });
  }

  /** Partial-update preferences for a user */
  async updatePrefs(userId: string, dto: UpdateNotificationPrefsDto) {
    // Ensure user exists
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('Kullanıcı bulunamadı');

    return this.prisma.userNotificationPreferences.upsert({
      where: { userId },
      create: {
        userId,
        emailEnabled: dto.emailEnabled ?? true,
        smsEnabled: dto.smsEnabled ?? false,
        inAppEnabled: dto.inAppEnabled ?? true,
        pushEnabled: dto.pushEnabled ?? false,
        eventPrefs: dto.eventPrefs ?? undefined,
      },
      update: {
        ...(dto.emailEnabled !== undefined && { emailEnabled: dto.emailEnabled }),
        ...(dto.smsEnabled !== undefined && { smsEnabled: dto.smsEnabled }),
        ...(dto.inAppEnabled !== undefined && { inAppEnabled: dto.inAppEnabled }),
        ...(dto.pushEnabled !== undefined && { pushEnabled: dto.pushEnabled }),
        ...(dto.eventPrefs !== undefined && { eventPrefs: dto.eventPrefs }),
      },
    });
  }

  /** Get preferences for all users (admin view) */
  async findAll() {
    return this.prisma.userNotificationPreferences.findMany({
      include: {
        user: {
          select: { id: true, email: true, firstName: true, lastName: true, role: true },
        },
      },
      orderBy: { user: { email: 'asc' } },
    });
  }
}
