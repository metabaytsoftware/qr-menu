import { PrismaClient } from './src/generated/client';
const prisma = new PrismaClient();
async function main() {
  const station = await prisma.station.findUnique({
    where: { qrCode: process.argv[2] },
    include: {
        venue: {
          include: {
            categories: {
              where: { isActive: true },
              orderBy: { sortOrder: 'asc' },
              include: {
                products: {
                  where: { isActive: true },
                  orderBy: { name: 'asc' },
                },
              },
            },
          },
        },
      },
  });
  console.log(JSON.stringify(station, null, 2));
}
main().catch(console.error).finally(() => prisma.$disconnect());
