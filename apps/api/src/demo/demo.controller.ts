import { Controller, Get, Param, Post } from '@nestjs/common';

import type { RawAlertMockScenario } from '../alerts/raw-alert-mock.factory';
import { DemoService } from './demo.service';

@Controller('demo')
export class DemoController {
  constructor(private readonly demoService: DemoService) {}

  @Get('scenarios')
  getScenarios() {
    return this.demoService.getScenarios();
  }

  @Post('run/:scenario')
  runScenario(@Param('scenario') scenario: RawAlertMockScenario) {
    return this.demoService.runScenario(scenario);
  }
}
