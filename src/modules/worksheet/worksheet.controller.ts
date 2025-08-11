import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  UseGuards,
  Query,
  Put,
  Patch
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { WorksheetService } from './worksheet.service';
import { CreateWorksheetDto } from './dto/create-worksheet.dto';
import { UpdateWorksheetDto } from './dto/update-worksheet.dto';
import { UpdateWorksheetRecordDto } from './dto/update-worksheet-record.dto';
import { BatchUpdateRecordsDto } from './dto/batch-update-records.dto';
import { QuickUpdateRecordDto } from './dto/quick-update-record.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { GetUser } from '../../common/decorators/get-user.decorator';
import { Role } from '@prisma/client';

@ApiTags('worksheets')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
@Controller('worksheets')
export class WorksheetController {
  constructor(private readonly worksheetService: WorksheetService) {}

  @Post()
  @UseGuards(RolesGuard)
  @Roles(Role.SUPERADMIN, Role.ADMIN, Role.USER)
  @ApiOperation({ summary: 'Create new worksheet' })
  @ApiResponse({ status: 201, description: 'Worksheet created successfully' })
  create(@Body() createWorksheetDto: CreateWorksheetDto, @GetUser() user: any) {
    return this.worksheetService.createWorksheet(createWorksheetDto, user.id);
  }

  @Get()
  @ApiOperation({ summary: 'Get all worksheets' })
  @ApiQuery({ name: 'factoryId', required: false, type: String })
  @ApiQuery({ name: 'groupId', required: false, type: String })
  @ApiQuery({ name: 'date', required: false, type: String })
  @ApiQuery({ name: 'status', required: false, type: String })
  @ApiResponse({ status: 200, description: 'Worksheets retrieved successfully' })
  findAll(
    @Query('factoryId') factoryId?: string,
    @Query('groupId') groupId?: string,
    @Query('date') date?: string,
    @Query('status') status?: string,
    @GetUser() user?: any
  ) {
    const dateFilter = date ? new Date(date) : undefined;
    return this.worksheetService.findAll({
      factoryId,
      groupId,
      date: dateFilter,
      status,
      userId: user.id,
      userRole: user.role
    });
  }

  @Get('group/:groupId')
  @ApiOperation({ summary: 'Get worksheets for specific group' })
  @ApiQuery({ name: 'date', required: false, type: String })
  @ApiResponse({ status: 200, description: 'Group worksheets retrieved successfully' })
  getGroupWorksheets(
    @Param('groupId') groupId: string,
    @Query('date') date?: string,
    @GetUser() user?: any
  ) {
    const dateFilter = date ? new Date(date) : new Date();
    return this.worksheetService.getGroupWorksheets(groupId, dateFilter, user);
  }

  @Get('my-groups')
  @ApiOperation({ summary: 'Get worksheets for groups led by current user' })
  @ApiQuery({ name: 'date', required: false, type: String })
  @ApiResponse({ status: 200, description: 'My group worksheets retrieved successfully' })
  getMyGroupWorksheets(
    @Query('date') date?: string,
    @GetUser() user?: any
  ) {
    const dateFilter = date ? new Date(date) : new Date();
    return this.worksheetService.getMyGroupWorksheets(user.id, dateFilter);
  }

  @Get('my-today')
  @ApiOperation({ summary: 'Get today worksheets for current group leader' })
  @ApiResponse({ status: 200, description: 'Today worksheets retrieved' })
  async getMyTodayWorksheets(@GetUser() user: any) {
    const today = new Date();
    return this.worksheetService.getMyGroupWorksheets(user.id, today);
  }

  @Get('dashboard/today')
  @UseGuards(RolesGuard)
  @Roles(Role.SUPERADMIN, Role.ADMIN)
  @ApiOperation({ summary: 'Today production dashboard' })
  @ApiResponse({ status: 200, description: 'Dashboard data retrieved' })
  async getTodayDashboard(@GetUser() user: any) {
    const today = new Date();
    return this.worksheetService.getTodayProductionDashboard(today, user);
  }

  @Get('dashboard/factory/:factoryId')
  @UseGuards(RolesGuard)
  @Roles(Role.SUPERADMIN, Role.ADMIN)
  @ApiOperation({ summary: 'Factory production dashboard' })
  async getFactoryDashboard(
    @Param('factoryId') factoryId: string,
    @Query('date') date?: string,
    @GetUser() user?: any
  ) {
    const targetDate = date ? new Date(date) : new Date();
    return this.worksheetService.getFactoryDashboard(factoryId, targetDate, user);
  }

  @Get('analytics/realtime')
  @UseGuards(RolesGuard)
  @Roles(Role.SUPERADMIN, Role.ADMIN, Role.USER)
  @ApiOperation({ summary: 'Get real-time analytics' })
  @ApiQuery({ name: 'factoryId', required: false, type: String })
  @ApiQuery({ name: 'date', required: false, type: String })
  @ApiResponse({ status: 200, description: 'Real-time analytics retrieved' })
  getRealtimeAnalytics(
    @Query('factoryId') factoryId?: string,
    @Query('date') date?: string,
    @GetUser() user?: any
  ) {
    const dateFilter = date ? new Date(date) : undefined;
    return this.worksheetService.getRealtimeAnalytics({
      factoryId,
      date: dateFilter,
      userId: user.id,
      userRole: user.role
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get worksheet by ID' })
  @ApiResponse({ status: 200, description: 'Worksheet retrieved successfully' })
  findOne(@Param('id') id: string, @GetUser() user: any) {
    return this.worksheetService.findOne(id, user);
  }

  @Get(':id/analytics')
  @ApiOperation({ summary: 'Get worksheet analytics' })
  @ApiResponse({ status: 200, description: 'Analytics retrieved successfully' })
  getAnalytics(@Param('id') id: string, @GetUser() user: any) {
    return this.worksheetService.getAnalytics(id, user);
  }

  @Put(':id')
  @UseGuards(RolesGuard)
  @Roles(Role.SUPERADMIN, Role.ADMIN, Role.USER)
  @ApiOperation({ summary: 'Update worksheet' })
  @ApiResponse({ status: 200, description: 'Worksheet updated successfully' })
  update(
    @Param('id') id: string,
    @Body() updateWorksheetDto: UpdateWorksheetDto,
    @GetUser() user: any
  ) {
    return this.worksheetService.update(id, updateWorksheetDto, user);
  }

  @Patch(':id/records/:recordId')
  @UseGuards(RolesGuard)
  @Roles(Role.SUPERADMIN, Role.ADMIN, Role.USER)
  @ApiOperation({ summary: 'Update worksheet record' })
  @ApiResponse({ status: 200, description: 'Record updated successfully' })
  updateRecord(
    @Param('id') worksheetId: string,
    @Param('recordId') recordId: string,
    @Body() updateRecordDto: UpdateWorksheetRecordDto,
    @GetUser() user: any
  ) {
    return this.worksheetService.updateRecord(worksheetId, recordId, updateRecordDto, user);
  }

  @Patch(':id/records/:recordId/quick-update')
  @UseGuards(RolesGuard)
  @Roles(Role.SUPERADMIN, Role.ADMIN, Role.USER)
  @ApiOperation({ summary: 'Quick update record for mobile (group leaders)' })
  @ApiResponse({ status: 200, description: 'Record updated successfully' })
  async quickUpdateRecord(
    @Param('id') worksheetId: string,
    @Param('recordId') recordId: string,
    @Body() quickUpdateDto: QuickUpdateRecordDto,
    @GetUser() user: any
  ) {
    return this.worksheetService.quickUpdateRecord(
      worksheetId,
      recordId,
      quickUpdateDto,
      user
    );
  }

  @Patch(':id/batch-update')
  @UseGuards(RolesGuard)
  @Roles(Role.SUPERADMIN, Role.ADMIN, Role.USER)
  @ApiOperation({ summary: 'Batch update multiple records' })
  @ApiResponse({ status: 200, description: 'Records updated successfully' })
  batchUpdateRecords(
    @Param('id') worksheetId: string,
    @Body() batchUpdateDto: BatchUpdateRecordsDto,
    @GetUser() user: any
  ) {
    return this.worksheetService.batchUpdateRecords(worksheetId, batchUpdateDto, user);
  }

  @Post(':id/complete')
  @UseGuards(RolesGuard)
  @Roles(Role.SUPERADMIN, Role.ADMIN, Role.USER)
  @ApiOperation({ summary: 'Complete worksheet' })
  @ApiResponse({ status: 200, description: 'Worksheet completed successfully' })
  completeWorksheet(@Param('id') id: string, @GetUser() user: any) {
    return this.worksheetService.completeWorksheet(id, user);
  }

  @Post('archive-old')
  @UseGuards(RolesGuard)
  @Roles(Role.SUPERADMIN, Role.ADMIN)
  @ApiOperation({ summary: 'Archive old worksheets' })
  @ApiQuery({ name: 'beforeDate', required: false, type: String })
  @ApiResponse({ status: 200, description: 'Old worksheets archived successfully' })
  archiveOldWorksheets(
    @Query('beforeDate') beforeDate?: string,
    @GetUser() user?: any
  ) {
    const archiveDate = beforeDate ? new Date(beforeDate) : undefined;
    return this.worksheetService.archiveOldWorksheets(archiveDate, user);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles(Role.SUPERADMIN, Role.ADMIN)
  @ApiOperation({ summary: 'Delete worksheet' })
  @ApiResponse({ status: 200, description: 'Worksheet deleted successfully' })
  remove(@Param('id') id: string, @GetUser() user: any) {
    return this.worksheetService.remove(id, user);
  }
}
