import { Body, Controller, Get, Param, Patch } from '@nestjs/common';
import { CurrentUser } from '@meta-repo/auth-api';
import { Permission } from '../permissions/permission.decorator';
import { NotificationsService } from './notifications.service';
import { UpdateNotificationPrefsDto } from './dto/update-notification-prefs.dto';

@Controller('notifications')
export class NotificationsController {
  constructor(private readonly service: NotificationsService) {}

  /** GET /notifications/prefs — current user's own prefs */
  @Permission('notifications', 'read')
  @Get('prefs')
  getMyPrefs(@CurrentUser() user: any) {
    return this.service.getPrefs(user.sub);
  }

  /** PATCH /notifications/prefs — update current user's prefs */
  @Permission('notifications', 'write')
  @Patch('prefs')
  updateMyPrefs(
    @CurrentUser() user: any,
    @Body() dto: UpdateNotificationPrefsDto,
  ) {
    return this.service.updatePrefs(user.sub, dto);
  }

  /** GET /notifications/prefs/all — admin: all users' prefs */
  @Permission('notifications', 'admin')
  @Get('prefs/all')
  findAll() {
    return this.service.findAll();
  }

  /** GET /notifications/prefs/:userId — admin: specific user's prefs */
  @Permission('notifications', 'admin')
  @Get('prefs/:userId')
  getUserPrefs(@Param('userId') userId: string) {
    return this.service.getPrefs(userId);
  }

  /** PATCH /notifications/prefs/:userId — admin: update specific user's prefs */
  @Permission('notifications', 'admin')
  @Patch('prefs/:userId')
  updateUserPrefs(
    @Param('userId') userId: string,
    @Body() dto: UpdateNotificationPrefsDto,
  ) {
    return this.service.updatePrefs(userId, dto);
  }
}
