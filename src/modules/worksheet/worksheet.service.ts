import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../../common/prisma.service';
import { CreateWorksheetDto } from './dto/create-worksheet.dto';
import { Role, WorkSheetStatus, WorkRecordStatus, ShiftType } from '@prisma/client';
import { UpdateWorksheetRecordDto } from './dto/update-worksheet-record.dto';
import { BatchUpdateRecordsDto } from './dto/batch-update-records.dto';
import { UpdateWorksheetDto } from './dto/update-worksheet.dto';
import { QuickUpdateRecordDto } from './dto/quick-update-record.dto';

@Injectable()
export class WorksheetService {
  constructor(private prisma: PrismaService) {}

  async createWorksheet(createWorksheetDto: CreateWorksheetDto, createdById: string) {
    const { groupId, date, shiftType, productId, processId } = createWorksheetDto;

    // Validate group exists and get group info with factory
    const group = await this.prisma.group.findUnique({
      where: { id: groupId },
      include: {
        team: {
          include: {
            line: {
              include: { factory: true }
            }
          }
        },
        members: {
          where: { isActive: true, role: Role.WORKER },
          select: { id: true, employeeCode: true, firstName: true, lastName: true }
        }
      }
    });

    if (!group) {
      throw new NotFoundException('Group not found');
    }

    if (!group.team?.line?.factory) {
      throw new BadRequestException('Group must belong to a valid factory structure');
    }

    // Check if worksheet already exists for this group and date
    const existingWorksheet = await this.prisma.workSheet.findUnique({
      where: {
        date_groupId: { date: new Date(date), groupId }
      }
    });

    if (existingWorksheet) {
      throw new ConflictException('Worksheet already exists for this group and date');
    }

    // Validate product-process combination
    const productProcess = await this.prisma.productProcess.findUnique({
      where: {
        productId_processId: { productId, processId }
      },
      include: {
        product: { select: { name: true, code: true } },
        process: { select: { name: true, code: true } }
      }
    });

    if (!productProcess) {
      throw new BadRequestException('Invalid product-process combination');
    }

    const totalWorkers = group.members.length;
    if (totalWorkers === 0) {
      throw new BadRequestException('Group has no active workers');
    }

    // Calculate target output per hour based on standard output and actual workers
    const targetOutputPerHour = Math.floor(
      (productProcess.standardOutputPerHour * totalWorkers) / 5 // Assume standard is for 5 workers
    );

    // Create worksheet with transaction
    const worksheet = await this.prisma.$transaction(async (tx) => {
      // Create main worksheet
      const newWorksheet = await tx.workSheet.create({
        data: {
          date: new Date(date),
          factoryId: group.team.line.factory.id,
          groupId,
          shiftType,
          totalWorkers,
          targetOutputPerHour,
          createdById,
          status: WorkSheetStatus.ACTIVE,
        },
        include: {
          factory: { select: { name: true, code: true } },
          group: { 
            select: { 
              name: true, 
              code: true,
              team: {
                select: {
                  name: true,
                  line: { select: { name: true } }
                }
              }
            }
          },
          createdBy: { select: { firstName: true, lastName: true, employeeCode: true } }
        }
      });

      // Create worksheet items for each worker
      const worksheetItems = await Promise.all(
        group.members.map(worker =>
          tx.workSheetItem.create({
            data: {
              worksheetId: newWorksheet.id,
              workerId: worker.id,
              productId,
              processId,
            }
          })
        )
      );

      // Create worksheet records for each hour based on shift type
      const workHours = this.getWorkHoursForShift(shiftType);
      const worksheetRecords = await Promise.all(
        workHours.map(({ hour, startTime, endTime }) =>
          tx.workSheetRecord.create({
            data: {
              worksheetId: newWorksheet.id,
              workHour: hour,
              startTime: new Date(`1970-01-01T${startTime}:00Z`),
              endTime: new Date(`1970-01-01T${endTime}:00Z`),
              status: WorkRecordStatus.PENDING,
            }
          })
        )
      );

      return { ...newWorksheet, items: worksheetItems, records: worksheetRecords };
    });

    return {
      ...worksheet,
      summary: {
        totalWorkers,
        totalHours: this.getWorkHoursForShift(shiftType).length,
        targetOutputPerHour,
        productProcess: {
          product: productProcess.product,
          process: productProcess.process,
          standardOutput: productProcess.standardOutputPerHour
        }
      }
    };
  }

  async findAll(filters: {
    factoryId?: string;
    groupId?: string;
    date?: Date;
    status?: string;
    userId?: string;
    userRole?: Role;
  }) {
    const where: any = {};

    if (filters.factoryId) {
      where.factoryId = filters.factoryId;
    }

    if (filters.groupId) {
      where.groupId = filters.groupId;
    }

    if (filters.date) {
      where.date = filters.date;
    }

    if (filters.status) {
      where.status = filters.status;
    }

    // Apply role-based filtering
    if (filters.userRole === Role.USER) {
      // Regular users can only see worksheets they created
      where.createdById = filters.userId;
    }

    return this.prisma.workSheet.findMany({
      where,
      include: {
        factory: { select: { name: true, code: true } },
        group: {
          select: {
            name: true,
            code: true,
            team: {
              select: {
                name: true,
                line: { select: { name: true } }
              }
            }
          }
        },
        createdBy: { select: { firstName: true, lastName: true, employeeCode: true } },
        _count: {
          select: {
            items: true,
            records: { where: { status: WorkRecordStatus.COMPLETED } }
          }
        }
      },
      orderBy: [
        { date: 'desc' },
        { createdAt: 'desc' }
      ]
    });
  }

  async findAllPaginated(filters: {
    factoryId?: string;
    groupId?: string;
    date?: Date;
    status?: string;
    userId?: string;
    userRole?: Role;
    page?: number;
    limit?: number;
  }) {
    const { page = 1, limit = 10, ...filterOptions } = filters;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (filterOptions.factoryId) {
      where.factoryId = filterOptions.factoryId;
    }

    if (filterOptions.groupId) {
      where.groupId = filterOptions.groupId;
    }

    if (filterOptions.date) {
      where.date = filterOptions.date;
    }

    if (filterOptions.status) {
      where.status = filterOptions.status;
    }

    // Apply role-based filtering
    if (filterOptions.userRole === Role.USER) {
      where.createdById = filterOptions.userId;
    }

    const [worksheets, total] = await Promise.all([
      this.prisma.workSheet.findMany({
        where,
        include: {
          factory: { select: { name: true, code: true } },
          group: {
            select: {
              name: true,
              code: true,
              team: {
                select: {
                  name: true,
                  line: { select: { name: true } }
                }
              }
            }
          },
          createdBy: { select: { firstName: true, lastName: true, employeeCode: true } },
          _count: {
            select: {
              items: true,
              records: { where: { status: WorkRecordStatus.COMPLETED } }
            }
          }
        },
        orderBy: [
          { date: 'desc' },
          { createdAt: 'desc' }
        ],
        skip,
        take: limit,
      }),
      this.prisma.workSheet.count({ where }),
    ]);

    return {
      data: worksheets,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getGroupWorksheets(groupId: string, date: Date, user: any) {
    // Check if user has access to this group
    const group = await this.prisma.group.findUnique({
      where: { id: groupId },
      select: {
        id: true,
        name: true,
        leaderId: true,
        team: {
          select: {
            line: {
              select: {
                factory: { select: { id: true, name: true } }
              }
            }
          }
        }
      }
    });

    if (!group) {
      throw new NotFoundException('Group not found');
    }

    // Check permissions
    const canAccess = 
      user.role === Role.SUPERADMIN ||
      user.role === Role.ADMIN ||
      group.leaderId === user.id;

    if (!canAccess) {
      throw new ForbiddenException('You do not have access to this group');
    }

    return this.prisma.workSheet.findMany({
      where: {
        groupId,
        date: {
          gte: new Date(date.getFullYear(), date.getMonth(), date.getDate()),
          lt: new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1),
        }
      },
      include: {
        factory: { select: { name: true, code: true } },
        group: {
          select: {
            name: true,
            code: true,
            team: {
              select: {
                name: true,
                line: { select: { name: true } }
              }
            }
          }
        },
        items: {
          include: {
            worker: { select: { firstName: true, lastName: true, employeeCode: true } },
            product: { select: { name: true, code: true } },
            process: { select: { name: true, code: true } },
            _count: {
              select: { records: { where: { actualOutput: { gt: 0 } } } }
            }
          }
        },
        records: {
          include: {
            _count: {
              select: {
                itemRecords: { where: { actualOutput: { gt: 0 } } }
              }
            }
          },
          orderBy: { workHour: 'asc' }
        }
      }
    });
  }

  async getMyGroupWorksheets(userId: string, date: Date) {
    // Find groups where user is the leader
    const myGroups = await this.prisma.group.findMany({
      where: { leaderId: userId },
      select: { id: true }
    });

    const groupIds = myGroups.map(g => g.id);

    if (groupIds.length === 0) {
      return [];
    }

    return this.prisma.workSheet.findMany({
      where: {
        groupId: { in: groupIds },
        date: {
          gte: new Date(date.getFullYear(), date.getMonth(), date.getDate()),
          lt: new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1),
        }
      },
      include: {
        factory: { select: { name: true, code: true } },
        group: {
          select: {
            name: true,
            code: true,
            team: {
              select: {
                name: true,
                line: { select: { name: true } }
              }
            }
          }
        },
        _count: {
          select: {
            items: true,
            records: { where: { status: WorkRecordStatus.COMPLETED } }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  async findOne(id: string, user: any) {
    const worksheet = await this.prisma.workSheet.findUnique({
      where: { id },
      include: {
        factory: { select: { name: true, code: true } },
        group: {
          include: {
            team: {
              include: {
                line: { select: { name: true } }
              }
            }
          }
        },
        createdBy: { select: { firstName: true, lastName: true, employeeCode: true } },
        items: {
          include: {
            worker: { select: { firstName: true, lastName: true, employeeCode: true } },
            product: { select: { name: true, code: true } },
            process: { select: { name: true, code: true } },
            records: {
              include: {
                record: { select: { workHour: true, startTime: true, endTime: true } }
              },
              orderBy: { record: { workHour: 'asc' } }
            }
          }
        },
        records: {
          include: {
            updatedBy: { select: { firstName: true, lastName: true, employeeCode: true } },
            itemRecords: {
              include: {
                item: {
                  include: {
                    worker: { select: { firstName: true, lastName: true, employeeCode: true } }
                  }
                }
              }
            }
          },
          orderBy: { workHour: 'asc' }
        }
      }
    });

    if (!worksheet) {
      throw new NotFoundException('Worksheet not found');
    }

    // Check permissions
    const canAccess = 
      user.role === Role.SUPERADMIN ||
      user.role === Role.ADMIN ||
      worksheet.createdById === user.id ||
      worksheet.group.leaderId === user.id;

    if (!canAccess) {
      throw new ForbiddenException('You do not have access to this worksheet');
    }

    return worksheet;
  }

  async updateRecord(
    worksheetId: string,
    recordId: string,
    updateRecordDto: UpdateWorksheetRecordDto,
    user: any
  ) {
    // Validate worksheet and record exist
    const worksheet = await this.prisma.workSheet.findUnique({
      where: { id: worksheetId },
      include: {
        group: { select: { leaderId: true } },
        records: { where: { id: recordId } }
      }
    });

    if (!worksheet) {
      throw new NotFoundException('Worksheet not found');
    }

    const record = worksheet.records[0];
    if (!record) {
      throw new NotFoundException('Worksheet record not found');
    }

    // Check permissions - only group leader or admin can update records
    const canUpdate = 
      user.role === Role.SUPERADMIN ||
      user.role === Role.ADMIN ||
      worksheet.group.leaderId === user.id;

    if (!canUpdate) {
      throw new ForbiddenException('You can only update records for groups you lead');
    }

    // Update record with transaction for item records
    return this.prisma.$transaction(async (tx) => {
      // Update main record
      const updatedRecord = await tx.workSheetRecord.update({
        where: { id: recordId },
        data: {
          status: updateRecordDto.status || WorkRecordStatus.IN_PROGRESS,
          updatedById: user.id,
        }
      });

      // Update item records if provided
      if (updateRecordDto.itemRecords && updateRecordDto.itemRecords.length > 0) {
        await Promise.all(
          updateRecordDto.itemRecords.map(async (itemRecord) => {
            await tx.workSheetItemRecord.upsert({
              where: {
                recordId_itemId: {
                  recordId: updatedRecord.id,
                  itemId: itemRecord.itemId
                }
              },
              update: {
                actualOutput: itemRecord.actualOutput,
                productId: itemRecord.productId,
                processId: itemRecord.processId,
                note: itemRecord.note,
              },
              create: {
                recordId: updatedRecord.id,
                itemId: itemRecord.itemId,
                actualOutput: itemRecord.actualOutput,
                productId: itemRecord.productId,
                processId: itemRecord.processId,
                note: itemRecord.note,
              }
            });
          })
        );
      }

      return tx.workSheetRecord.findUnique({
        where: { id: recordId },
        include: {
          itemRecords: {
            include: {
              item: {
                include: {
                  worker: { select: { firstName: true, lastName: true, employeeCode: true } }
                }
              },
              product: { select: { name: true, code: true } },
              process: { select: { name: true, code: true } }
            }
          }
        }
      });
    });
  }

  async batchUpdateRecords(
    worksheetId: string,
    batchUpdateDto: BatchUpdateRecordsDto,
    user: any
  ) {
    // Validate worksheet exists
    const worksheet = await this.prisma.workSheet.findUnique({
      where: { id: worksheetId },
      include: {
        group: { select: { leaderId: true } }
      }
    });

    if (!worksheet) {
      throw new NotFoundException('Worksheet not found');
    }

    // Check permissions
    const canUpdate = 
      user.role === Role.SUPERADMIN ||
      user.role === Role.ADMIN ||
      worksheet.group.leaderId === user.id;

    if (!canUpdate) {
      throw new ForbiddenException('You can only update records for groups you lead');
    }

    // Batch update with transaction
    return this.prisma.$transaction(async (tx) => {
      const results = await Promise.all(
        batchUpdateDto.records.map(async (recordUpdate) => {
          // Update record status
          const updatedRecord = await tx.workSheetRecord.update({
            where: { id: recordUpdate.recordId },
            data: {
              status: recordUpdate.status || WorkRecordStatus.IN_PROGRESS,
              updatedById: user.id,
            }
          });

          // Update item records
          if (recordUpdate.itemRecords) {
            await Promise.all(
              recordUpdate.itemRecords.map(async (itemRecord) => {
                await tx.workSheetItemRecord.upsert({
                  where: {
                    recordId_itemId: {
                      recordId: updatedRecord.id,
                      itemId: itemRecord.itemId
                    }
                  },
                  update: {
                    actualOutput: itemRecord.actualOutput,
                    note: itemRecord.note,
                  },
                  create: {
                    recordId: updatedRecord.id,
                    itemId: itemRecord.itemId,
                    actualOutput: itemRecord.actualOutput,
                    note: itemRecord.note,
                  }
                });
              })
            );
          }

          return updatedRecord;
        })
      );

      return {
        message: 'Batch update completed successfully',
        updatedRecords: results.length,
        records: results
      };
    });
  }

  async getAnalytics(worksheetId: string, user: any) {
    const worksheet = await this.prisma.workSheet.findUnique({
      where: { id: worksheetId },
      include: {
        group: { select: { leaderId: true } },
        items: {
          include: {
            records: {
              include: {
                record: { select: { workHour: true } }
              }
            }
          }
        },
        records: {
          include: {
            itemRecords: true
          }
        }
      }
    });

    if (!worksheet) {
      throw new NotFoundException('Worksheet not found');
    }

    // Check permissions
    const canAccess = 
      user.role === Role.SUPERADMIN ||
      user.role === Role.ADMIN ||
      worksheet.group.leaderId === user.id;

    if (!canAccess) {
      throw new ForbiddenException('You do not have access to this worksheet analytics');
    }

    // Calculate analytics
    const totalRecords = worksheet.records.length;
    const completedRecords = worksheet.records.filter(r => r.status === WorkRecordStatus.COMPLETED).length;
    const totalOutput = worksheet.records.reduce((sum, record) => 
      sum + record.itemRecords.reduce((itemSum, item) => itemSum + item.actualOutput, 0), 0
    );
    const targetOutput = worksheet.targetOutputPerHour * totalRecords;
    const efficiency = targetOutput > 0 ? (totalOutput / targetOutput) * 100 : 0;

    // Hourly breakdown
    const hourlyData = worksheet.records.map(record => {
      const hourOutput = record.itemRecords.reduce((sum, item) => sum + item.actualOutput, 0);
      return {
        workHour: record.workHour,
        targetOutput: worksheet.targetOutputPerHour,
        actualOutput: hourOutput,
        efficiency: worksheet.targetOutputPerHour > 0 ? (hourOutput / worksheet.targetOutputPerHour) * 100 : 0,
        status: record.status,
        workerCount: record.itemRecords.length
      };
    });

    // Worker performance
    const workerPerformance = worksheet.items.map(item => {
      const workerOutput = item.records.reduce((sum, record) => sum + record.actualOutput, 0);
      const workerHours = item.records.length;
      const expectedOutput = (worksheet.targetOutputPerHour / worksheet.totalWorkers) * workerHours;
      
      return {
        workerId: item.workerId,
        totalOutput: workerOutput,
        hoursWorked: workerHours,
        averagePerHour: workerHours > 0 ? workerOutput / workerHours : 0,
        efficiency: expectedOutput > 0 ? (workerOutput / expectedOutput) * 100 : 0
      };
    });

    return {
      summary: {
        totalRecords,
        completedRecords,
        completionRate: totalRecords > 0 ? (completedRecords / totalRecords) * 100 : 0,
        totalOutput,
        targetOutput,
        efficiency: Math.round(efficiency),
        totalWorkers: worksheet.totalWorkers
      },
      hourlyData,
      workerPerformance,
      trends: {
        peakHour: hourlyData.reduce((max, hour) => 
          hour.actualOutput > max.actualOutput ? hour : max, 
          { workHour: 0, actualOutput: 0 }
        ),
        lowestHour: hourlyData.reduce((min, hour) => 
          hour.actualOutput < min.actualOutput ? hour : min,
          { workHour: 0, actualOutput: Infinity }
        )
      }
    };
  }

  async getRealtimeAnalytics(filters: {
    factoryId?: string;
    date?: Date;
    userId?: string;
    userRole?: Role;
  }) {
    const where: any = {};

    if (filters.factoryId) {
      where.factoryId = filters.factoryId;
    }

    if (filters.date) {
      where.date = {
        gte: new Date(filters.date.getFullYear(), filters.date.getMonth(), filters.date.getDate()),
        lt: new Date(filters.date.getFullYear(), filters.date.getMonth(), filters.date.getDate() + 1),
      };
    }

    // Role-based filtering
    if (filters.userRole === Role.USER) {
      where.createdById = filters.userId;
    }

    const worksheets = await this.prisma.workSheet.findMany({
      where,
      include: {
        factory: { select: { name: true, code: true } },
        group: {
          select: {
            name: true,
            team: {
              select: {
                name: true,
                line: { select: { name: true } }
              }
            }
          }
        },
        records: {
          include: {
            itemRecords: true
          }
        }
      }
    });

    // Aggregate analytics
    const totalWorksheets = worksheets.length;
    const totalWorkers = worksheets.reduce((sum, ws) => sum + ws.totalWorkers, 0);
    const totalTargetOutput = worksheets.reduce((sum, ws) => 
      sum + (ws.targetOutputPerHour * ws.records.length), 0
    );
    const totalActualOutput = worksheets.reduce((sum, ws) => 
      sum + ws.records.reduce((recordSum, record) => 
        recordSum + record.itemRecords.reduce((itemSum, item) => itemSum + item.actualOutput, 0), 0
      ), 0
    );

    const overallEfficiency = totalTargetOutput > 0 ? (totalActualOutput / totalTargetOutput) * 100 : 0;

    // Factory breakdown
    const factoryStats = worksheets.reduce((acc, ws) => {
      const factoryCode = ws.factory.code;
      if (!acc[factoryCode]) {
        acc[factoryCode] = {
          name: ws.factory.name,
          code: factoryCode,
          worksheets: 0,
          workers: 0,
          targetOutput: 0,
          actualOutput: 0
        };
      }

      acc[factoryCode].worksheets += 1;
      acc[factoryCode].workers += ws.totalWorkers;
      acc[factoryCode].targetOutput += ws.targetOutputPerHour * ws.records.length;
      acc[factoryCode].actualOutput += ws.records.reduce((sum, record) => 
        sum + record.itemRecords.reduce((itemSum, item) => itemSum + item.actualOutput, 0), 0
      );

      return acc;
    }, {});

    return {
      summary: {
        totalWorksheets,
        totalWorkers,
        totalTargetOutput,
        totalActualOutput,
        overallEfficiency: Math.round(overallEfficiency),
        activeFactories: Object.keys(factoryStats).length
      },
      factoryBreakdown: Object.values(factoryStats).map((factory: any) => ({
        ...factory,
        efficiency: factory.targetOutput > 0 ? Math.round((factory.actualOutput / factory.targetOutput) * 100) : 0
      })),
      recentActivity: worksheets
        .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())
        .slice(0, 10)
        .map(ws => ({
          id: ws.id,
          factory: ws.factory.name,
          group: ws.group.name,
          status: ws.status,
          updatedAt: ws.updatedAt
        }))
    };
  }

  async update(id: string, updateWorksheetDto: UpdateWorksheetDto, user: any) {
    const worksheet = await this.prisma.workSheet.findUnique({
      where: { id },
      include: { group: { select: { leaderId: true } } }
    });

    if (!worksheet) {
      throw new NotFoundException('Worksheet not found');
    }

    // Check permissions
    const canUpdate = 
      user.role === Role.SUPERADMIN ||
      user.role === Role.ADMIN ||
      worksheet.createdById === user.id;

    if (!canUpdate) {
      throw new ForbiddenException('You can only update worksheets you created');
    }

    return this.prisma.workSheet.update({
      where: { id },
      data: updateWorksheetDto,
      include: {
        factory: { select: { name: true, code: true } },
        group: {
          select: {
            name: true,
            team: {
              select: {
                name: true,
                line: { select: { name: true } }
              }
            }
          }
        }
      }
    });
  }

  async remove(id: string, user: any) {
    const worksheet = await this.prisma.workSheet.findUnique({
      where: { id }
    });

    if (!worksheet) {
      throw new NotFoundException('Worksheet not found');
    }

    // Only admin can delete
    if (user.role !== Role.SUPERADMIN && user.role !== Role.ADMIN) {
      throw new ForbiddenException('Only administrators can delete worksheets');
    }

    return this.prisma.workSheet.delete({
      where: { id }
    });
  }

  async completeWorksheet(id: string, user: any) {
    const worksheet = await this.prisma.workSheet.findUnique({
      where: { id },
      include: { group: { select: { leaderId: true } } }
    });

    if (!worksheet) {
      throw new NotFoundException('Worksheet not found');
    }

    // Check permissions
    const canComplete = 
      user.role === Role.SUPERADMIN ||
      user.role === Role.ADMIN ||
      worksheet.group.leaderId === user.id;

    if (!canComplete) {
      throw new ForbiddenException('You can only complete worksheets for groups you lead');
    }

    return this.prisma.workSheet.update({
      where: { id },
      data: { status: WorkSheetStatus.COMPLETED }
    });
  }

  async archiveOldWorksheets(beforeDate?: Date, user?: any) {
    // Only admin can archive
    if (user.role !== Role.SUPERADMIN && user.role !== Role.ADMIN) {
      throw new ForbiddenException('Only administrators can archive worksheets');
    }

    const archiveDate = beforeDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // 30 days ago

    // Implementation for archiving - simplified
    const worksheetsToArchive = await this.prisma.workSheet.count({
      where: {
        date: { lt: archiveDate },
        status: { not: WorkSheetStatus.ARCHIVED }
      }
    });

    if (worksheetsToArchive === 0) {
      return { message: 'No worksheets to archive', count: 0 };
    }

    // Mark as archived (actual backup logic would be more complex)
    const result = await this.prisma.workSheet.updateMany({
      where: {
        date: { lt: archiveDate },
        status: { not: WorkSheetStatus.ARCHIVED }
      },
      data: { status: WorkSheetStatus.ARCHIVED }
    });

    return {
      message: 'Worksheets archived successfully',
      count: result.count,
      archiveDate: archiveDate.toISOString()
    };
  }

  // Helper method to get work hours based on shift type
  private getWorkHoursForShift(shiftType: ShiftType) {
    const baseHours = [
      { hour: 1, startTime: '07:30', endTime: '08:30' },
      { hour: 2, startTime: '08:30', endTime: '09:30' },
      { hour: 3, startTime: '09:30', endTime: '10:30' },
      { hour: 4, startTime: '10:30', endTime: '11:30' },
      // Lunch break 11:30-12:30
      { hour: 5, startTime: '12:30', endTime: '13:30' },
      { hour: 6, startTime: '13:30', endTime: '14:30' },
      { hour: 7, startTime: '14:30', endTime: '15:30' },
      { hour: 8, startTime: '15:30', endTime: '16:30' },
    ];

    switch (shiftType) {
      case ShiftType.NORMAL_8H:
        return baseHours; // 7 working hours

      case ShiftType.EXTENDED_9_5H:
        return [
          ...baseHours,
          { hour: 9, startTime: '16:30', endTime: '17:00' },
          { hour: 10, startTime: '17:00', endTime: '18:00' }, // 30 min
        ];

      case ShiftType.OVERTIME_11H:
        return [
          ...baseHours,
          // Dinner break 16:30-17:00
          { hour: 9, startTime: '17:00', endTime: '18:00' },
          { hour: 10, startTime: '18:00', endTime: '19:00' },
          { hour: 11, startTime: '19:00', endTime: '20:00' },
        ];

      default:
        return baseHours;
    }
  }

  async quickUpdateRecord(
    worksheetId: string,
    recordId: string,
    quickUpdateDto: QuickUpdateRecordDto,
    user: any
  ) {
    // Convert to standard update format
    const updateRecordDto: UpdateWorksheetRecordDto = {
      status: 'IN_PROGRESS' as WorkRecordStatus,
      itemRecords: quickUpdateDto.itemOutputs.map(item => ({
        itemId: item.itemId,
        actualOutput: item.actualOutput,
        note: item.note
      }))
    };

    return this.updateRecord(worksheetId, recordId, updateRecordDto, user);
  }

  async getTodayProductionDashboard(date: Date, user: any) {
    const startOfDay = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const endOfDay = new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000);

    const worksheets = await this.prisma.workSheet.findMany({
      where: {
        date: {
          gte: startOfDay,
          lt: endOfDay
        }
      },
      include: {
        factory: { select: { name: true, code: true } },
        group: {
          select: {
            name: true,
            team: {
              select: {
                name: true,
                line: { select: { name: true } }
              }
            }
          }
        },
        records: {
          include: {
            itemRecords: true
          }
        },
        _count: {
          select: { items: true }
        }
      }
    });

    // Calculate real-time metrics
    const totalWorksheets = worksheets.length;
    const totalWorkers = worksheets.reduce((sum, ws) => sum + ws.totalWorkers, 0);
    
    let totalTargetOutput = 0;
    let totalActualOutput = 0;
    let completedRecords = 0;
    let totalRecords = 0;

    const factoryStats = new Map<string, any>();

    worksheets.forEach(worksheet => {
      const factoryCode = worksheet.factory.code;
      
      if (!factoryStats.has(factoryCode)) {
        factoryStats.set(factoryCode, {
          name: worksheet.factory.name,
          code: factoryCode,
          worksheets: 0,
          workers: 0,
          targetOutput: 0,
          actualOutput: 0,
          completedRecords: 0,
          totalRecords: 0
        });
      }

      const factory = factoryStats.get(factoryCode);
      factory.worksheets += 1;
      factory.workers += worksheet.totalWorkers;

      worksheet.records.forEach(record => {
        totalRecords += 1;
        factory.totalRecords += 1;
        
        const recordTarget = worksheet.targetOutputPerHour;
        const recordActual = record.itemRecords.reduce((sum, item) => sum + item.actualOutput, 0);
        
        totalTargetOutput += recordTarget;
        totalActualOutput += recordActual;
        factory.targetOutput += recordTarget;
        factory.actualOutput += recordActual;
        
        if (record.status === 'COMPLETED') {
          completedRecords += 1;
          factory.completedRecords += 1;
        }
      });
    });

    const overallEfficiency = totalTargetOutput > 0 ? 
      Math.round((totalActualOutput / totalTargetOutput) * 100) : 0;

    return {
      summary: {
        date: date.toISOString().split('T')[0],
        totalWorksheets,
        totalWorkers,
        totalTargetOutput,
        totalActualOutput,
        overallEfficiency,
        completionRate: totalRecords > 0 ? 
          Math.round((completedRecords / totalRecords) * 100) : 0,
        activeFactories: factoryStats.size
      },
      factories: Array.from(factoryStats.values()).map(factory => ({
        ...factory,
        efficiency: factory.targetOutput > 0 ? 
          Math.round((factory.actualOutput / factory.targetOutput) * 100) : 0,
        completionRate: factory.totalRecords > 0 ? 
          Math.round((factory.completedRecords / factory.totalRecords) * 100) : 0
      })),
      recentActivity: worksheets
        .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())
        .slice(0, 10)
        .map(ws => ({
          id: ws.id,
          factory: ws.factory.name,
          group: ws.group.name,
          status: ws.status,
          updatedAt: ws.updatedAt
        }))
    };
  }

  async getFactoryDashboard(factoryId: string, date: Date, user: any) {
    const startOfDay = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const endOfDay = new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000);

    const worksheets = await this.prisma.workSheet.findMany({
      where: {
        factoryId,
        date: {
          gte: startOfDay,
          lt: endOfDay
        }
      },
      include: {
        factory: { select: { name: true, code: true } },
        group: {
          include: {
            team: {
              include: {
                line: true
              }
            },
            leader: {
              select: { firstName: true, lastName: true, employeeCode: true }
            }
          }
        },
        records: {
          include: {
            itemRecords: true
          },
          orderBy: { workHour: 'asc' }
        },
        items: {
          include: {
            worker: {
              select: { firstName: true, lastName: true, employeeCode: true }
            }
          }
        }
      }
    });

    return {
      factory: worksheets[0]?.factory || { name: 'Unknown', code: 'N/A' },
      date: date.toISOString().split('T')[0],
      worksheets: worksheets.map(worksheet => ({
        id: worksheet.id,
        group: worksheet.group,
        performance: this.calculateGroupPerformance(worksheet),
        records: worksheet.records,
        items: worksheet.items
      })),
      summary: {
        totalGroups: worksheets.length,
        totalWorkers: worksheets.reduce((sum, ws) => sum + ws.totalWorkers, 0),
        avgEfficiency: this.calculateAverageEfficiency(worksheets)
      }
    };
  }

  private calculateGroupPerformance(worksheet: any) {
    const totalTarget = worksheet.records.length * worksheet.targetOutputPerHour;
    const totalActual = worksheet.records.reduce((sum, record) => 
      sum + record.itemRecords.reduce((itemSum, item) => itemSum + item.actualOutput, 0), 0
    );
    const completedRecords = worksheet.records.filter(r => r.status === 'COMPLETED').length;
    
    return {
      efficiency: totalTarget > 0 ? Math.round((totalActual / totalTarget) * 100) : 0,
      completionRate: worksheet.records.length > 0 ? 
        Math.round((completedRecords / worksheet.records.length) * 100) : 0,
      totalOutput: totalActual,
      targetOutput: totalTarget
    };
  }

  private calculateAverageEfficiency(worksheets: any[]) {
    if (worksheets.length === 0) return 0;
    
    const totalEfficiency = worksheets.reduce((sum, worksheet) => {
      const performance = this.calculateGroupPerformance(worksheet);
      return sum + performance.efficiency;
    }, 0);
    
    return Math.round(totalEfficiency / worksheets.length);
  }
}
