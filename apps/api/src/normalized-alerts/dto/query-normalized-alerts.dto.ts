import {
  AlertSource,
  AlertType,
  NormalizedAlertStatus,
  Severity,
} from '@soc-soar/shared';
import { Type } from 'class-transformer';
import {
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';

export class QueryNormalizedAlertsDto {
  @IsOptional()
  @IsEnum(AlertType)
  alertType?: AlertType;

  @IsOptional()
  @IsEnum(Severity)
  severity?: Severity;

  @IsOptional()
  @IsEnum(AlertSource)
  source?: AlertSource;

  @IsOptional()
  @IsEnum(NormalizedAlertStatus)
  normalizationStatus?: NormalizedAlertStatus;

  @IsOptional()
  @IsString()
  rawAlertId?: string;

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
