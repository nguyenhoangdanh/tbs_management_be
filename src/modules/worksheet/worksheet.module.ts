import { Module } from '@nestjs/common';
import { WorksheetController } from './worksheet.controller';
import { WorksheetService } from './worksheet.service';
import { PrismaService } from '../../common/prisma.service';

@Module({
  controllers: [WorksheetController],
  providers: [WorksheetService, PrismaService],
  exports: [WorksheetService],
})
export class WorksheetModule {}
