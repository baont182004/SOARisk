import { ExplanationStatus } from '@soc-soar/shared';
import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, Max, Min } from 'class-validator';

export class QueryExplanationsDto {
  @IsOptional()
  recommendationId?: string;

  @IsOptional()
  normalizedAlertId?: string;

  @IsOptional()
  @IsEnum(ExplanationStatus)
  status?: ExplanationStatus;

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
