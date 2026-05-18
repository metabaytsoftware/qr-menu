import { Controller, Get, Patch, Param, Body } from '@nestjs/common';
import { Permission } from '../permissions/permission.decorator';
import { VenuesService } from './venues.service';

@Controller('venues')
export class VenuesController {
  constructor(private readonly venuesService: VenuesService) {}

  @Permission('venues', 'read')
  @Get()
  findAll() {
    return this.venuesService.findAll();
  }

  @Permission('venues', 'read')
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.venuesService.findOne(id);
  }

  @Permission('venues', 'write')
  @Patch(':id')
  update(@Param('id') id: string, @Body() body: { name?: string; slug?: string }) {
    return this.venuesService.update(id, body);
  }

  @Permission('venues', 'write')
  @Patch(':id/config')
  updateConfig(@Param('id') id: string, @Body() body: Record<string, unknown>) {
    return this.venuesService.updateConfig(id, body);
  }
}
