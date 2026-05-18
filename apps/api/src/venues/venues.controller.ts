import { Controller, Get, Patch, Param, Body, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '@meta-repo/auth-api';
import { VenuesService } from './venues.service';

@UseGuards(JwtAuthGuard)
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
