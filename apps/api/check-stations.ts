import { PrismaClient } from './src/generated/client';
const prisma = new PrismaClient();
async function main() {
  const stations = await prisma.station.findMany();
  console.log('STATIONS_LIST:', JSON.stringify(stations));
}
main().catch(console.error).finally(() => prisma.$disconnect());
