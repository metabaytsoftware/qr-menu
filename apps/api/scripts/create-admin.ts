/**
 * Kullanım:
 *   cd apps/api
 *   DATABASE_URL="..." npx ts-node scripts/create-admin.ts ad soyad email@ornek.com sifre
 */
import { PrismaClient } from '../src/generated/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const [firstName, lastName, email, password] = process.argv.slice(2);

  if (!firstName || !lastName || !email || !password) {
    console.error('Kullanım: npx ts-node scripts/create-admin.ts <ad> <soyad> <email> <sifre>');
    process.exit(1);
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    console.error('❌ Bu e-posta zaten kayıtlı:', email);
    process.exit(1);
  }

  const venue = await prisma.venue.findFirst();
  const passwordHash = await bcrypt.hash(password, 12);

  const user = await prisma.user.create({
    data: {
      email,
      passwordHash,
      firstName,
      lastName,
      role: 'OWNER',
      venueId: venue?.id ?? null,
    },
  });

  console.log('✅ Admin hesabı oluşturuldu:');
  console.log('   E-posta :', user.email);
  console.log('   Ad Soyad:', user.firstName, user.lastName);
  console.log('   Venue   :', user.venueId ?? '(yok)');
}

main()
  .catch((e) => { console.error('❌', e.message); process.exit(1); })
  .finally(() => prisma.$disconnect());
