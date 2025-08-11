import { Controller, Get, Patch, Param, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { GetUser } from '../../common/decorators/get-user.decorator';
import { WorksheetService } from '../worksheet/worksheet.service';
import { QuickUpdateRecordDto } from '../worksheet/dto/quick-update-record.dto';

@ApiTags('mobile')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
@Controller('mobile')
export class MobileController {
  constructor(private readonly worksheetService: WorksheetService) {}

  @Get('my-worksheets-today')
  @ApiOperation({ summary: 'Get today worksheets for mobile (group leaders)' })
  async getMyWorksheetsToday(@GetUser() user: any) {
    const today = new Date();
    const worksheets = await this.worksheetService.getMyGroupWorksheets(user.id, today);
    
    // Simplify response for mobile
    return worksheets.map(ws => ({
      id: ws.id,
      groupName: ws.group.name,
      factoryCode: ws.factory.code,
      shiftType: ws.shiftType,
      totalWorkers: ws.totalWorkers,
      completedRecords: ws._count?.records || 0,
      totalRecords: 7, // This should be calculated based on shift type
      status: ws.status,
    }));
  }

  @Get('worksheet/:id/mobile-view')
  @ApiOperation({ summary: 'Get worksheet optimized for mobile view' })
  async getWorksheetMobileView(
    @Param('id') id: string,
    @GetUser() user: any
  ) {
    const worksheet = await this.worksheetService.findOne(id, user);
    
    // Transform for mobile-friendly response
    return {
      id: worksheet.id,
      date: worksheet.date,
      group: {
        name: worksheet.group.name,
        totalMembers: worksheet.items.length,
      },
      records: worksheet.records.map(record => ({
        id: record.id,
        workHour: record.workHour,
        timeSlot: `${record.startTime}-${record.endTime}`,
        status: record.status,
        completedWorkers: record.itemRecords.length,
        totalOutput: record.itemRecords.reduce((sum, item) => sum + item.actualOutput, 0),
      })),
      workers: worksheet.items.map(item => ({
        id: item.id,
        workerId: item.workerId,
        name: `${item.worker.firstName} ${item.worker.lastName}`,
        employeeCode: item.worker.employeeCode,
      })),
    };
  }

  @Patch('worksheet/:id/records/:recordId/quick-entry')
  @ApiOperation({ summary: 'Quick entry for mobile group leaders' })
  async quickEntry(
    @Param('id') worksheetId: string,
    @Param('recordId') recordId: string,
    @Body() quickUpdateDto: QuickUpdateRecordDto,
    @GetUser() user: any
  ) {
    const result = await this.worksheetService.quickUpdateRecord(
      worksheetId,
      recordId,
      quickUpdateDto,
      user
    );

    // Return simplified response for mobile
    return {
      success: true,
      recordId: result.id,
      updatedWorkers: result.itemRecords.length,
      totalOutput: result.itemRecords.reduce((sum, item) => sum + item.actualOutput, 0),
    };
  }
}
