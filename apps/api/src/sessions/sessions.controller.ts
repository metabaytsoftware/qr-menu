import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { Permission } from '../permissions/permission.decorator';
import { SessionsService } from './sessions.service';
import { StartSessionDto } from './dto/start-session.dto';

@Controller('sessions')
export class SessionsController {
  constructor(private readonly service: SessionsService) {}

  @Permission('sessions', 'read')
  @Get('station/:stationId')
  findByStation(@Param('stationId') stationId: string) {
    return this.service.findByStation(stationId);
  }

  @Permission('sessions', 'read')
  @Get('station/:stationId/active')
  findActive(@Param('stationId') stationId: string) {
    return this.service.findActive(stationId);
  }

  @Permission('sessions', 'read')
  @Get(':id/bill')
  getBill(@Param('id') id: string) {
    return this.service.getSessionBill(id);
  }

  @Permission('sessions', 'write')
  @Post()
  start(@Body() dto: StartSessionDto) {
    return this.service.start(dto);
  }

  @Permission('sessions', 'write')
  @Post(':id/pause')
  pause(@Param('id') id: string) {
    return this.service.pause(id);
  }

  @Permission('sessions', 'write')
  @Post(':id/resume')
  resume(@Param('id') id: string) {
    return this.service.resume(id);
  }

  @Permission('sessions', 'write')
  @Post(':id/end')
  end(@Param('id') id: string) {
    return this.service.end(id);
  }
}
