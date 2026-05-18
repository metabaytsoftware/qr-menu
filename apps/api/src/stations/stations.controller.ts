import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { Permission } from '../permissions/permission.decorator';
import { StationsService } from './stations.service';
import { CreateStationDto } from './dto/create-station.dto';
import { UpdateStationDto } from './dto/update-station.dto';

@Controller('stations')
export class StationsController {
  constructor(private readonly service: StationsService) {}

  @Permission('stations', 'read')
  @Get('venue/:venueId')
  findByVenue(@Param('venueId') venueId: string) {
    return this.service.findByVenue(venueId);
  }

  @Permission('stations', 'read')
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Permission('stations', 'write')
  @Post()
  create(@Body() dto: CreateStationDto) {
    return this.service.create(dto);
  }

  @Permission('stations', 'write')
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateStationDto) {
    return this.service.update(id, dto);
  }

  @Permission('stations', 'write')
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }

  @Permission('stations', 'write')
  @Post(':id/regenerate-qr')
  regenerateQr(@Param('id') id: string) {
    return this.service.regenerateQr(id);
  }
}
