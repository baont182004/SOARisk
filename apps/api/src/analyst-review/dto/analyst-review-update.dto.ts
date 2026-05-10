import { Severity } from '@soc-soar/shared';
import { IsEnum, IsIn, IsNumber, IsOptional, IsString, Max, Min } from 'class-validator';

export class AnalystReviewUpdateDto {
  @IsOptional()
  @IsEnum(Severity)
  severity?: Severity;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  confidence?: number;

  @IsOptional()
  @IsString()
  assetContext?: string;

  @IsOptional()
  @IsString()
  selectedPlaybookId?: string;

  @IsOptional()
  @IsString()
  recommendedAction?: string;

  @IsOptional()
  @IsString()
  analystNote?: string;

  @IsOptional()
  @IsIn(['unknown', 'true_positive', 'false_positive'])
  verdict?: 'unknown' | 'true_positive' | 'false_positive';

  @IsOptional()
  @IsString()
  actor?: string;
}
