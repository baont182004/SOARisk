import {
  AlertType,
  AutomationLevel,
  IncidentCategory,
  PlaybookStatus,
  Severity,
} from '@soc-soar/shared';
import { Transform, Type } from 'class-transformer';
import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';

export class QueryPlaybooksDto {
  @IsOptional()
  @IsEnum(IncidentCategory)
  incidentCategory?: IncidentCategory;

  @IsOptional()
  @IsEnum(AlertType)
  alertType?: AlertType;

  @IsOptional()
  @IsEnum(PlaybookStatus)
  status?: PlaybookStatus;

  @IsOptional()
  @IsEnum(AutomationLevel)
  automationLevel?: AutomationLevel;

  @IsOptional()
  @IsEnum(Severity)
  severitySupported?: Severity;

  @IsOptional()
  @Transform(({ value }) => value === true || value === 'true')
  @IsBoolean()
  approvalRequired?: boolean;

  @IsOptional()
  @IsString()
  search?: string;

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
