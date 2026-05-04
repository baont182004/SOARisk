import { IsOptional, IsString, MaxLength } from 'class-validator';

export class ApprovalDecisionDto {
  @IsOptional()
  @IsString()
  @MaxLength(120)
  decidedBy?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  decisionReason?: string;
}
