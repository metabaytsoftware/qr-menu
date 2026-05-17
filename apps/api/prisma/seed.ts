import { PrismaClient } from '../src/generated/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Clear existing data
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.product.deleteMany();
  await prisma.category.deleteMany();
  await prisma.station.deleteMany();
  await prisma.venue.deleteMany();

  // Create venue
  const venue = await prisma.venue.create({
    data: {
      id: 'night-city-gaming',
      name: 'Night City Gaming',
      slug: 'night-city-gaming',
      type: 'PLAYSTATION',
      address: 'Istanbul, Turkey',
      phone: '+90 123 456 7890',
      logoUrl: null,
    },
  });
  console.log('✅ Venue created:', venue.name);

  // Create stations
  const station1 = await prisma.station.create({
    data: {
      venueId: venue.id,
      name: 'DEMO-01',
      qrCode: 'DEMO-01',
    },
  });

  const station2 = await prisma.station.create({
    data: {
      venueId: venue.id,
      name: 'Table-02',
      qrCode: 'TABLE-02',
    },
  });
  console.log('✅ Stations created:', [station1.name, station2.name]);

  // Create categories
  const categories = await Promise.all([
    prisma.category.create({
      data: { venueId: venue.id, name: 'Burgers', sortOrder: 1 },
    }),
    prisma.category.create({
      data: { venueId: venue.id, name: 'Snacks', sortOrder: 2 },
    }),
    prisma.category.create({
      data: { venueId: venue.id, name: 'Drinks', sortOrder: 3 },
    }),
  ]);
  console.log('✅ Categories created:', categories.map((c) => c.name));

  // Create products
  const products = await Promise.all([
    // Burgers
    prisma.product.create({
      data: {
        venueId: venue.id,
        categoryId: categories[0].id,
        name: 'Gamer Burger',
        description: 'Double beef, melting cheddar, black bun, secret sauce.',
        price: 189.9,
        imageUrl: null,
      },
    }),
    prisma.product.create({
      data: {
        venueId: venue.id,
        categoryId: categories[0].id,
        name: 'Club Sandwich',
        description: 'Triple decker with chicken, bacon and fresh veggies.',
        price: 149.9,
        imageUrl: null,
      },
    }),
    // Snacks
    prisma.product.create({
      data: {
        venueId: venue.id,
        categoryId: categories[1].id,
        name: 'Neon Fries',
        description: 'Crispy fries with blue cheese dip and purple spices.',
        price: 85.0,
        imageUrl: null,
      },
    }),
    // Drinks
    prisma.product.create({
      data: {
        venueId: venue.id,
        categoryId: categories[2].id,
        name: 'Cyber Soda',
        description: 'Glowing lime and blueberry mix, strictly for pro-gamers.',
        price: 45.0,
        imageUrl: null,
      },
    }),
    prisma.product.create({
      data: {
        venueId: venue.id,
        categoryId: categories[2].id,
        name: 'Iced Latte',
        description: 'Cold brew with oat milk and caramel drizzle.',
        price: 65.0,
        imageUrl: null,
      },
    }),
  ]);
  console.log('✅ Products created:', products.map((p) => p.name));

  // Create sample orders
  const order1 = await prisma.order.create({
    data: {
      venueId: venue.id,
      stationId: station1.id,
      status: 'PREPARING',
      totalAmount: 320.9,
      items: {
        create: [
          { productId: products[0].id, quantity: 1, unitPrice: 189.9, total: 189.9 },
          { productId: products[3].id, quantity: 2, unitPrice: 45.0, total: 90.0 },
        ],
      },
    },
  });

  const order2 = await prisma.order.create({
    data: {
      venueId: venue.id,
      stationId: station2.id,
      status: 'PENDING',
      totalAmount: 255.0,
      items: {
        create: [
          { productId: products[2].id, quantity: 3, unitPrice: 85.0, total: 255.0 },
        ],
      },
    },
  });

  console.log('✅ Sample orders created:', [order1.id, order2.id]);

  console.log('\n✨ Database seeding completed!');
  console.log(`📍 Station QR codes: ${station1.qrCode}, ${station2.qrCode}`);
  console.log(`🔗 Demo URL: http://localhost:3003/menu/${station1.qrCode}`);
  console.log(`📊 Venue ID for admin: ${venue.id}`);
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
