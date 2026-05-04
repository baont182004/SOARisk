import { Transform } from 'class-transformer';
import { IsBoolean, IsOptional } from 'class-validator';

export class CreateWorkflowQueryDto {
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  force?: boolean = false;

  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  autoStart?: boolean = false;
}
