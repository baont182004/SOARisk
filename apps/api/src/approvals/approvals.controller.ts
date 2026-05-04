import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';

import { ApprovalDecisionDto } from './dto/approval-decision.dto';
import { QueryApprovalsDto } from './dto/query-approvals.dto';
import { ApprovalsService } from './approvals.service';

@Controller('approvals')
export class ApprovalsController {
  constructor(private readonly approvalsService: ApprovalsService) {}

  @Get()
  findAll(@Query() query: QueryApprovalsDto) {
    return this.approvalsService.findAll(query);
  }

  @Get(':approvalId')
  findOne(@Param('approvalId') approvalId: string) {
    return this.approvalsService.findOne(approvalId);
  }

  @Post(':approvalId/approve')
  approve(
    @Param('approvalId') approvalId: string,
    @Body() decision: ApprovalDecisionDto,
  ) {
    return this.approvalsService.approve(approvalId, decision);
  }

  @Post(':approvalId/reject')
  reject(
    @Param('approvalId') approvalId: string,
    @Body() decision: ApprovalDecisionDto,
  ) {
    return this.approvalsService.reject(approvalId, decision);
  }
}
