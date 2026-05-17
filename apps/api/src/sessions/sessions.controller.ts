import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { SessionsService } from './sessions.service';
import { StartSessionDto } from './dto/start-session.dto';

@Controller('sessions')
export class SessionsController {
  constructor(private readonly service: SessionsService) {}

  @Get('station/:stationId')
  findByStation(@Param('stationId') stationId: string) {
    return this.service.findByStation(stationId);
  }

  @Get('station/:stationId/active')
  findActive(@Param('stationId') stationId: string) {
    return this.service.findActive(stationId);
  }

  @Get(':id/bill')
  getBill(@Param('id') id: string) {
    return this.service.getSessionBill(id);
  }

  @Post()
  start(@Body() dto: StartSessionDto) {
    return this.service.start(dto);
  }

  @Post(':id/pause')
  pause(@Param('id') id: string) {
    return this.service.pause(id);
  }

  @Post(':id/resume')
  resume(@Param('id') id: string) {
    return this.service.resume(id);
  }

  @Post(':id/end')
  end(@Param('id') id: string) {
    return this.service.end(id);
  }
}
