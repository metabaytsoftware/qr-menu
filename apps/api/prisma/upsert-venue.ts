import { PrismaClient } from '../src/generated/client';

const prisma = new PrismaClient();

async function main() {
  const venue = await prisma.venue.upsert({
    where: { id: 'night-city-gaming' },
    update: {
      name: 'Nova Game Center',
    },
    create: {
      id: 'night-city-gaming',
      name: 'Nova Game Center',
      slug: 'nova-game-center',
      type: 'PLAYSTATION',
      address: 'Istanbul, Turkey',
      phone: '+90 123 456 7890',
    },
  });
  console.log('✅ Venue ready:', venue.id, venue.name, '| slug:', venue.slug);
}

main()
  .catch((e) => { console.error('❌', e); process.exit(1); })
  .finally(() => prisma.$disconnect());

