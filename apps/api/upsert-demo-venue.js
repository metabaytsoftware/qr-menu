const { PrismaClient } = require('./src/generated/client');
const prisma = new PrismaClient();

async function main() {
  const venue = await prisma.venue.upsert({
    where: { slug: 'demo-venue' },
    update: {},
    create: {
      id: 'demo-venue',
      name: 'Demo Venue',
      slug: 'demo-venue',
      type: 'CAFE',
    },
  });
  console.log('Upserted venue:', venue);
}

main().catch(console.error).finally(() => prisma.$disconnect());
