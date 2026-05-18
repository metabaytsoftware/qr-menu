import { Controller, Get, Param, Query } from '@nestjs/common';
import { Permission } from '../permissions/permission.decorator';
import { AnalyticsService } from './analytics.service';

@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Permission('analytics', 'read')
  @Get(':venueId/summary')
  getSummary(@Param('venueId') venueId: string) {
    return this.analyticsService.getSummary(venueId);
  }

  @Permission('analytics', 'read')
  @Get(':venueId/revenue')
  getRevenueSeries(@Param('venueId') venueId: string, @Query('period') period: string = '7d') {
    return this.analyticsService.getRevenueSeries(venueId, period === '30d' ? 30 : 7);
  }

  @Permission('analytics', 'read')
  @Get(':venueId/top-products')
  getTopProducts(@Param('venueId') venueId: string, @Query('limit') limit: string = '10') {
    return this.analyticsService.getTopProducts(venueId, parseInt(limit));
  }

  @Permission('analytics', 'read')
  @Get(':venueId/station-performance')
  getStationPerformance(@Param('venueId') venueId: string) {
    return this.analyticsService.getStationPerformance(venueId);
  }

  @Permission('analytics', 'read')
  @Get(':venueId/hourly-heatmap')
  getHourlyHeatmap(@Param('venueId') venueId: string) {
    return this.analyticsService.getHourlyHeatmap(venueId);
  }

  @Permission('analytics', 'read')
  @Get(':venueId/payment-distribution')
  getPaymentMethodDistribution(@Param('venueId') venueId: string) {
    return this.analyticsService.getPaymentMethodDistribution(venueId);
  }

  @Permission('analytics', 'read')
  @Get(':venueId/category-breakdown')
  getCategoryBreakdown(@Param('venueId') venueId: string) {
    return this.analyticsService.getCategoryBreakdown(venueId);
  }
}
