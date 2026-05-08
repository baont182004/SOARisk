import { Controller, Get, Param, Post } from '@nestjs/common';

import type { RawAlertMockScenario } from '../alerts/raw-alert-mock.factory';
import { PcapDemoService } from './pcap-demo.service';

@Controller('pcap-demo')
export class PcapDemoController {
  constructor(private readonly pcapDemoService: PcapDemoService) {}

  @Post('upload-placeholder')
  uploadPlaceholder() {
    return this.pcapDemoService.uploadPlaceholder();
  }

  @Get('jobs')
  findJobs() {
    return this.pcapDemoService.findJobs();
  }

  @Post('generate-alert/:scenario')
  generateScenarioAlert(@Param('scenario') scenario: RawAlertMockScenario) {
    return this.pcapDemoService.generateScenarioAlert(scenario);
  }
}
