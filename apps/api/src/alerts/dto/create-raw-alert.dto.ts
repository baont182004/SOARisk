import {
  AlertSource,
  AlertType,
  Severity,
} from '@soc-soar/shared';
import { Type } from 'class-transformer';
import {
  IsDateString,
  IsEnum,
  IsInt,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';

export class CreateRawAlertDto {
  @IsEnum(AlertSource)
  source!: AlertSource;

  @IsOptional()
  @IsString()
  sourceAlertId?: string;

  @IsString()
  title!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsEnum(AlertType)
  alertType?: AlertType;

  @IsOptional()
  @IsEnum(Severity)
  severity?: Severity;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(100)
  confidence?: number;

  @IsOptional()
  @IsDateString()
  observedAt?: string;

  @IsOptional()
  @IsString()
  sourceIp?: string;

  @IsOptional()
  @IsString()
  targetIp?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(65535)
  sourcePort?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(65535)
  targetPort?: number;

  @IsOptional()
  @IsString()
  protocol?: string;

  @IsOptional()
  @IsString()
  dnsQuery?: string;

  @IsOptional()
  @IsString()
  httpUri?: string;

  @IsOptional()
  @IsString()
  username?: string;

  @IsOptional()
  @IsString()
  hostname?: string;

  @IsOptional()
  @IsString()
  assetId?: string;

  @IsOptional()
  @IsObject()
  rawPayload?: Record<string, unknown>;

  @IsOptional()
  @IsString({ each: true })
  tags?: string[];
}
