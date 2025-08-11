import { IsArray, IsInt, IsOptional, IsString, IsUUID, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class QuickUpdateItemDto {
  @ApiProperty({ description: 'WorkSheet Item ID' })
  @IsUUID()
  itemId: string;

  @ApiProperty({ description: 'Actual output produced', minimum: 0 })
  @IsInt()
  @Min(0)
  actualOutput: number;

  @ApiProperty({ description: 'Optional notes', required: false })
  @IsOptional()
  @IsString()
  note?: string;
}

export class QuickUpdateRecordDto {
  @ApiProperty({ type: [QuickUpdateItemDto] })
  @IsArray()
  itemOutputs: QuickUpdateItemDto[];
}
