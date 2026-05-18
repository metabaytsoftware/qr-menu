import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { CurrentUser } from '@meta-repo/auth-api';
import { Permission } from '../permissions/permission.decorator';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Controller('users')
export class UsersController {
  constructor(private readonly service: UsersService) {}

  @Permission('users', 'read')
  @Get()
  findAll(@Query('venueId') venueId?: string) {
    return this.service.findAll(venueId);
  }

  @Permission('users', 'write')
  @Post()
  create(@Body() dto: CreateUserDto) {
    return this.service.create(dto);
  }

  @Permission('users', 'write')
  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateUserDto,
    @CurrentUser() user: any,
  ) {
    return this.service.update(id, dto, user.sub);
  }

  @Permission('users', 'write')
  @Patch(':id/password')
  resetPassword(
    @Param('id') id: string,
    @Body() body: { password: string },
  ) {
    return this.service.resetPassword(id, body.password);
  }

  @Permission('users', 'write')
  @Delete(':id')
  remove(@Param('id') id: string, @CurrentUser() user: any) {
    return this.service.remove(id, user.sub);
  }
}
