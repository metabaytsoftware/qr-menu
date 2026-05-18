import {
  Injectable,
  Logger,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpsertConfigDto } from './dto/upsert-config.dto';

/** Keys that are considered secrets and whose values are masked in list responses */
const SECRET_MASK = '••••••••';

// SMTP config key constants
export const SMTP_KEYS = {
  HOST: 'smtp.host',
  PORT: 'smtp.port',
  SECURE: 'smtp.secure',
  USER: 'smtp.user',
  PASS: 'smtp.pass',
  FROM: 'smtp.from',
} as const;

@Injectable()
export class SystemConfigService {
  private readonly logger = new Logger(SystemConfigService.name);

  constructor(private readonly prisma: PrismaService) {}

  /** Return all config entries; mask secret values */
  async findAll() {
    const rows = await this.prisma.systemConfig.findMany({
      orderBy: { key: 'asc' },
    });
    return rows.map((r) => ({
      ...r,
      value: r.isSecret ? SECRET_MASK : r.value,
    }));
  }

  /** Return a single config value (unmasked — internal use) */
  async getRaw(key: string): Promise<string | null> {
    const row = await this.prisma.systemConfig.findUnique({ where: { key } });
    return row?.value ?? null;
  }

  /** Upsert a single config entry */
  async upsert(dto: UpsertConfigDto) {
    return this.prisma.systemConfig.upsert({
      where: { key: dto.key },
      create: {
        key: dto.key,
        value: dto.value,
        isSecret: dto.isSecret ?? false,
        description: dto.description,
      },
      update: {
        value: dto.value,
        ...(dto.isSecret !== undefined ? { isSecret: dto.isSecret } : {}),
        ...(dto.description !== undefined ? { description: dto.description } : {}),
      },
    });
  }

  /** Bulk upsert — accepts an array of config objects */
  async bulkUpsert(configs: UpsertConfigDto[]) {
    const results = await Promise.all(configs.map((c) => this.upsert(c)));
    return { updated: results.length };
  }

  /** Delete a config key */
  async remove(key: string) {
    await this.prisma.systemConfig.delete({ where: { key } });
    return { ok: true };
  }

  /** Test SMTP connectivity using stored configuration */
  async testSmtp(to: string, subject: string): Promise<{ ok: boolean; message: string }> {
    const [host, portStr, secureStr, user, pass, from] = await Promise.all([
      this.getRaw(SMTP_KEYS.HOST),
      this.getRaw(SMTP_KEYS.PORT),
      this.getRaw(SMTP_KEYS.SECURE),
      this.getRaw(SMTP_KEYS.USER),
      this.getRaw(SMTP_KEYS.PASS),
      this.getRaw(SMTP_KEYS.FROM),
    ]);

    if (!host || !portStr) {
      throw new BadRequestException(
        'SMTP yapılandırması eksik. Önce host ve port ayarlarını kaydedin.',
      );
    }

    try {
      // Lazy-require nodemailer to avoid hard dependency if not installed
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const nodemailer = require('nodemailer');
      const port = parseInt(portStr, 10);
      const secure = secureStr === 'true';

      const transporter = nodemailer.createTransport({
        host,
        port,
        secure,
        auth: user && pass ? { user, pass } : undefined,
      });

      await transporter.verify();
      await transporter.sendMail({
        from: from ?? user ?? host,
        to,
        subject,
        text: `Bu, ${new Date().toISOString()} tarihinde gönderilmiş bir SMTP test e-postasıdır.`,
        html: `<p>Bu, <strong>${new Date().toLocaleString('tr-TR')}</strong> tarihinde gönderilmiş bir <b>SMTP test</b> e-postasıdır.</p>`,
      });

      this.logger.log(`SMTP test başarılı → ${to}`);
      return { ok: true, message: `Test e-postası ${to} adresine başarıyla gönderildi.` };
    } catch (err: any) {
      this.logger.error('SMTP test hatası', err?.message);
      return { ok: false, message: err?.message ?? 'Bilinmeyen hata' };
    }
  }
}
