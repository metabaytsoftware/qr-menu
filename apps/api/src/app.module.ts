import { Module } from '@nestjs/common';
import { APP_FILTER, APP_GUARD } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { SentryGlobalFilter, SentryModule } from '@sentry/nestjs/setup';
import { InternalApiGuard } from './common/guards/internal-api.guard';
import { CustomThrottlerGuard } from './common/guards/custom-throttler.guard';
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
import { PermissionsModule } from './permissions/permissions.module';
import { UsersModule } from './users/users.module';

@Module({
  imports: [
    SentryModule.forRoot(),
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRoot([
      { name: 'global', ttl: 60000, limit: 200 },
    ]),
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
    PermissionsModule,
    UsersModule,
  ],
  controllers: [],
  providers: [
    { provide: APP_FILTER, useClass: SentryGlobalFilter },
    { provide: APP_GUARD, useClass: InternalApiGuard },
    { provide: APP_GUARD, useClass: CustomThrottlerGuard },
  ],
})
export class AppModule {}
