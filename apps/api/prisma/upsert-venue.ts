import { PrismaClient } from '../src/generated/client';

const prisma = new PrismaClient();

async function main() {
  const venue = await prisma.venue.upsert({
    where: { id: 'night-city-gaming' },
    update: {},
    create: {
      id: 'night-city-gaming',
      name: 'Nova Game Center',
      slug: 'night-city-gaming',
      type: 'PLAYSTATION',
      address: 'Istanbul, Turkey',
      phone: '+90 123 456 7890',
    },
  });
  console.log('✅ Venue ready:', venue.id, venue.name);
}

main()
  .catch((e) => { console.error('❌', e); process.exit(1); })
  .finally(() => prisma.$disconnect());
