import { Controller, Get } from '@nestjs/common';

import { EvaluationService } from './evaluation.service';

@Controller('evaluation')
export class EvaluationController {
  constructor(private readonly evaluationService: EvaluationService) {}

  @Get('summary')
  getSummary() {
    return this.evaluationService.getSummary();
  }
}
