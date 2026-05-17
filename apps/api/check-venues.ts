import { PrismaClient } from './src/generated/client';

const prisma = new PrismaClient();

async function main() {
  const venues = await prisma.venue.findMany();
  console.log('Venues:', JSON.stringify(venues, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
