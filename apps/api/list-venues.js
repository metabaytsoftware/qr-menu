const { PrismaClient } = require('./src/generated/client');
const prisma = new PrismaClient();

async function main() {
  const venues = await prisma.venue.findMany();
  console.log('--- VENUES ---');
  venues.forEach(v => {
    console.log(`ID: ${v.id}, Slug: ${v.slug}, Name: ${v.name}`);
  });
  console.log('--------------');
}

main().catch(console.error).finally(() => prisma.$disconnect());
