import { Controller, Get, Patch, Param, Body } from '@nestjs/common';
import { VenuesService } from './venues.service';

@Controller('venues')
export class VenuesController {
  constructor(private readonly venuesService: VenuesService) {}

  @Get()
  findAll() {
    return this.venuesService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.venuesService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() body: { name?: string; slug?: string }) {
    return this.venuesService.update(id, body);
  }

  @Patch(':id/config')
  updateConfig(@Param('id') id: string, @Body() body: Record<string, unknown>) {
    return this.venuesService.updateConfig(id, body);
  }
}
