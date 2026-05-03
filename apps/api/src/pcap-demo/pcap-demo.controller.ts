import { Controller, Get, Post } from '@nestjs/common';

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
}
