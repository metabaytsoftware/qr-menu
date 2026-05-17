import { Controller, Get, Param } from '@nestjs/common';
import { MenuService } from './menu.service';

@Controller('menu')
export class MenuController {
  constructor(private readonly menuService: MenuService) {}

  @Get(':stationQr')
  getMenu(@Param('stationQr') stationQr: string) {
    return this.menuService.getByStationQr(stationQr);
  }
}
