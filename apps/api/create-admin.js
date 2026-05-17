const { PrismaClient } = require('./src/generated/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function main() {
  const email = 'admin@admin.com';
  const password = 'admin123';
  const hashedPassword = await bcrypt.hash(password, 10);

  const user = await prisma.user.upsert({
    where: { email },
    update: {
      passwordHash: hashedPassword,
    },
    create: {
      email,
      passwordHash: hashedPassword,
      firstName: 'Admin',
      lastName: 'User',
      role: 'OWNER',
      venueId: 'night-city-gaming',
    },
  });

  console.log('✅ Admin user created/updated:', user.email);
  console.log('📧 Email:', email);
  console.log('🔑 Password:', password);
}

main().catch(console.error).finally(() => prisma.$disconnect());
