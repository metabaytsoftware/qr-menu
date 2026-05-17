import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';

describe('Payments (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let venueId: string;
  let stationId: string;
  let productId: string;
  let categoryId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe());
    await app.init();

    prisma = app.get<PrismaService>(PrismaService);

    // Setup venue, category, product, station
    const venue = await prisma.venue.create({
      data: { name: 'Payment E2E Venue', slug: `pay-e2e-${Date.now()}` },
    });
    venueId = venue.id;

    const category = await prisma.category.create({
      data: { venueId, name: 'Food' },
    });
    categoryId = category.id;

    const product = await prisma.product.create({
      data: { venueId, categoryId, name: 'Burger', price: 100 },
    });
    productId = product.id;

    const station = await prisma.station.create({
      data: { venueId, name: `E2E-Pay-Table-${Date.now()}`, qrCode: `pay-qr-${Date.now()}` },
    });
    stationId = station.id;
  });

  afterAll(async () => {
    // Attempt cleanup, ignore errors if already deleted
    try {
      if (venueId) await prisma.venue.delete({ where: { id: venueId } });
    } catch (e) {}
    await app.close();
  });

  describe('/payments', () => {
    let orderId: string;

    it('should create an order and add payment', async () => {
      // 1. Create Order
      const orderRes = await request(app.getHttpServer())
        .post('/orders')
        .send({
          stationId,
          items: [{ productId, quantity: 1 }],
        });
      orderId = orderRes.body.id;

      // 2. Add partial payment
      const payRes = await request(app.getHttpServer())
        .post('/payments')
        .send({
          orderId,
          amount: 60,
          method: 'CASH',
        });

      expect(payRes.status).toBe(201);
      expect(payRes.body.paidAmount).toBe(60);

      // 3. Check order status via API
      const orderCheck = await request(app.getHttpServer()).get(`/orders/${venueId}`);
      const order = orderCheck.body.find((o: any) => o.id === orderId);
      expect(order.paymentStatus).toBe('PARTIAL');

      // 4. Complete payment
      await request(app.getHttpServer())
        .post('/payments')
        .send({
          orderId,
          amount: 50,
          method: 'CARD',
        });

      const finalCheck = await request(app.getHttpServer()).get(`/orders/${venueId}`);
      const finalOrder = finalCheck.body.find((o: any) => o.id === orderId);
      expect(finalOrder.paymentStatus).toBe('PAID');
    });
  });
});
