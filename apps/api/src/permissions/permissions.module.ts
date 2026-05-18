import { Global, Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { PermissionsService } from './permissions.service';
import { PermissionsGuard } from './permissions.guard';
import { PermissionsController } from './permissions.controller';

@Global()
@Module({
  imports: [PrismaModule],
  providers: [PermissionsService, PermissionsGuard],
  controllers: [PermissionsController],
  exports: [PermissionsService, PermissionsGuard],
})
export class PermissionsModule {}
