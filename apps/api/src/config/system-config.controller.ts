import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
} from '@nestjs/common';
import { Permission } from '../permissions/permission.decorator';
import { SystemConfigService } from './system-config.service';
import { UpsertConfigDto } from './dto/upsert-config.dto';
import { TestSmtpDto } from './dto/test-smtp.dto';

@Controller('config')
export class SystemConfigController {
  constructor(private readonly service: SystemConfigService) {}

  /** GET /config — list all system config entries (secrets masked) */
  @Permission('config', 'read')
  @Get()
  findAll() {
    return this.service.findAll();
  }

  /** PUT /config — upsert a single key */
  @Permission('config', 'write')
  @Put()
  upsert(@Body() dto: UpsertConfigDto) {
    return this.service.upsert(dto);
  }

  /** PUT /config/bulk — upsert multiple keys at once (e.g. SMTP form) */
  @Permission('config', 'write')
  @Put('bulk')
  bulkUpsert(@Body() body: { configs: UpsertConfigDto[] }) {
    return this.service.bulkUpsert(body.configs);
  }

  /** POST /config/smtp/test — send a test e-mail using stored SMTP config */
  @Permission('config', 'write')
  @Post('smtp/test')
  testSmtp(@Body() dto: TestSmtpDto) {
    return this.service.testSmtp(dto.to, dto.subject);
  }

  /** DELETE /config/:key */
  @Permission('config', 'write')
  @Delete(':key')
  remove(@Param('key') key: string) {
    return this.service.remove(key);
  }
}
