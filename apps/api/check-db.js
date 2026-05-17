
const { PrismaClient } = require('./src/generated/client');
const prisma = new PrismaClient();

async function main() {
  const venues = await prisma.venue.findMany({
    include: {
      categories: true,
      stations: true,
    }
  });
  console.log(JSON.stringify(venues, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
