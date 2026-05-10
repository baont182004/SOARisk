import { WorkflowExecutionStatus } from '@soc-soar/shared';
import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, Max, Min } from 'class-validator';

export class QueryWorkflowsDto {
  @IsOptional()
  recommendationId?: string;

  @IsOptional()
  playbookId?: string;

  @IsOptional()
  @IsEnum(WorkflowExecutionStatus)
  status?: WorkflowExecutionStatus;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 10;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;
}
