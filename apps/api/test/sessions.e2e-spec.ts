import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';

describe('Sessions (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let venueId: string;
  let stationId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe());
    await app.init();

    prisma = app.get<PrismaService>(PrismaService);

    // Create test seed
    const venue = await prisma.venue.create({
      data: {
        name: 'E2E Test Venue',
        slug: `e2e-test-${Date.now()}`,
      },
    });
    venueId = venue.id;

    const station = await prisma.station.create({
      data: {
        venueId: venueId,
        name: 'E2E-PS-01',
        qrCode: `e2e-qr-${Date.now()}`,
        stationType: 'PLAYSTATION',
        hourlyRate: 50,
      },
    });
    stationId = station.id;
  });

  afterAll(async () => {
    // Cleanup
    await prisma.venue.delete({ where: { id: venueId } });
    await app.close();
  });

  describe('/sessions', () => {
    let sessionId: string;

    it('POST /sessions should create a new session', async () => {
      const response = await request(app.getHttpServer())
        .post('/sessions')
        .send({
          stationId: stationId,
          isBillLess: false,
        });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id');
      expect(response.body.status).toBe('ACTIVE');
      sessionId = response.body.id;
    });

    it('GET /sessions/station/:stationId/active should return the active session', async () => {
      const response = await request(app.getHttpServer())
        .get(`/sessions/station/${stationId}/active`);

      expect(response.status).toBe(200);
      expect(response.body.id).toBe(sessionId);
    });

    it('POST /sessions/:id/pause should pause the session', async () => {
      const response = await request(app.getHttpServer())
        .post(`/sessions/${sessionId}/pause`);

      expect(response.status).toBe(201);
      expect(response.body.status).toBe('PAUSED');
    });

    it('POST /sessions/:id/resume should resume the session', async () => {
      const response = await request(app.getHttpServer())
        .post(`/sessions/${sessionId}/resume`);

      expect(response.status).toBe(201);
      expect(response.body.status).toBe('ACTIVE');
    });

    it('POST /sessions/:id/end should end the session and calculate charge', async () => {
      const response = await request(app.getHttpServer())
        .post(`/sessions/${sessionId}/end`);

      expect(response.status).toBe(201);
      expect(response.body.status).toBe('ENDED');
      expect(response.body).toHaveProperty('sessionCharge');
    });
  });
});
