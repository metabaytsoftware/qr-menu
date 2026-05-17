import { Controller, Get, Param, Query } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';

@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get(':venueId/summary')
  getSummary(@Param('venueId') venueId: string) {
    return this.analyticsService.getSummary(venueId);
  }

  @Get(':venueId/revenue')
  getRevenueSeries(
    @Param('venueId') venueId: string,
    @Query('period') period: string = '7d',
  ) {
    const days = period === '30d' ? 30 : 7;
    return this.analyticsService.getRevenueSeries(venueId, days);
  }

  @Get(':venueId/top-products')
  getTopProducts(
    @Param('venueId') venueId: string,
    @Query('limit') limit: string = '10',
  ) {
    return this.analyticsService.getTopProducts(venueId, parseInt(limit));
  }

  @Get(':venueId/station-performance')
  getStationPerformance(@Param('venueId') venueId: string) {
    return this.analyticsService.getStationPerformance(venueId);
  }

  @Get(':venueId/hourly-heatmap')
  getHourlyHeatmap(@Param('venueId') venueId: string) {
    return this.analyticsService.getHourlyHeatmap(venueId);
  }

  @Get(':venueId/payment-distribution')
  getPaymentMethodDistribution(@Param('venueId') venueId: string) {
    return this.analyticsService.getPaymentMethodDistribution(venueId);
  }

  @Get(':venueId/category-breakdown')
  getCategoryBreakdown(@Param('venueId') venueId: string) {
    return this.analyticsService.getCategoryBreakdown(venueId);
  }
}
