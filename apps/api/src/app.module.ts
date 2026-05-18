import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { InternalApiGuard } from './common/guards/internal-api.guard';
import { PrismaModule } from './prisma/prisma.module';
import { MenuModule } from './menu/menu.module';
import { OrdersModule } from './orders/orders.module';
import { CategoriesModule } from './categories/categories.module';
import { ProductsModule } from './products/products.module';
import { StationsModule } from './stations/stations.module';
import { SessionsModule } from './sessions/sessions.module';
import { TariffsModule } from './tariffs/tariffs.module';
import { PaymentsModule } from './payments/payments.module';
import { AnalyticsModule } from './analytics/analytics.module';
import { AuthModule } from './auth/auth.module';
import { HealthModule } from './health/health.module';
import { VenuesModule } from './venues/venues.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    MenuModule,
    OrdersModule,
    CategoriesModule,
    ProductsModule,
    StationsModule,
    SessionsModule,
    TariffsModule,
    PaymentsModule,
    AnalyticsModule,
    AuthModule,
    HealthModule,
    VenuesModule,
  ],
  controllers: [],
  providers: [
    { provide: APP_GUARD, useClass: InternalApiGuard },
  ],
})
export class AppModule {}
