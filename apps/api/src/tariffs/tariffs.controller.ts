import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { TariffsService } from './tariffs.service';
import { CreateTariffDto } from './dto/create-tariff.dto';

@Controller('tariffs')
export class TariffsController {
  constructor(private readonly service: TariffsService) {}

  @Get('venue/:venueId')
  findByVenue(@Param('venueId') venueId: string) {
    return this.service.findByVenue(venueId);
  }

  @Get('venue/:venueId/effective-rate')
  getEffectiveRate(
    @Param('venueId') venueId: string,
    @Query('stationType') stationType: string,
    @Query('hour') hour: string,
  ) {
    return this.service.getEffectiveRate(venueId, stationType, parseInt(hour, 10) || new Date().getHours());
  }

  @Post()
  create(@Body() dto: CreateTariffDto) {
    return this.service.create(dto);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: Partial<CreateTariffDto>) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
