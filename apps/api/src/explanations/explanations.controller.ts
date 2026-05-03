import { Controller, Get } from '@nestjs/common';

import { ExplanationsService } from './explanations.service';

@Controller('explanations')
export class ExplanationsController {
  constructor(private readonly explanationsService: ExplanationsService) {}

  @Get()
  findAll() {
    return this.explanationsService.findAll();
  }
}
