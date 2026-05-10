import {
  Controller,
  Get,
  Param,
  Post,
  Query,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';

import type { RawAlertMockScenario } from '../alerts/raw-alert-mock.factory';
import { PaginationQueryDto } from '../common/pagination-query.dto';
import { PcapDemoService } from './pcap-demo.service';

@Controller('pcap')
export class PcapController {
  constructor(private readonly pcapDemoService: PcapDemoService) {}

  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  upload(@UploadedFile() file: { originalname: string; size: number; buffer?: Buffer }) {
    return this.pcapDemoService.uploadPcap(file);
  }

  @Get('jobs')
  findJobs(@Query() query: PaginationQueryDto) {
    return this.pcapDemoService.findJobs(query);
  }

  @Get('jobs/:id')
  findJob(@Param('id') id: string) {
    return this.pcapDemoService.findJob(id);
  }

  @Post('jobs/:id/process')
  processJob(@Param('id') id: string) {
    return this.pcapDemoService.processJob(id);
  }

  @Get('jobs/:id/pipeline')
  getPipeline(@Param('id') id: string) {
    return this.pcapDemoService.getPipeline(id);
  }

  @Post('sample/:scenario')
  processSample(@Param('scenario') scenario: RawAlertMockScenario) {
    return this.pcapDemoService.processSampleScenario(scenario);
  }
}

@Controller('pcap-demo')
export class PcapDemoController {
  constructor(private readonly pcapDemoService: PcapDemoService) {}

  @Post('upload-placeholder')
  uploadPlaceholder() {
    return this.pcapDemoService.uploadPlaceholder();
  }

  @Get('jobs')
  findJobs(@Query() query: PaginationQueryDto) {
    return this.pcapDemoService.findJobs(query);
  }

  @Post('generate-alert/:scenario')
  generateScenarioAlert(@Param('scenario') scenario: RawAlertMockScenario) {
    return this.pcapDemoService.generateScenarioAlert(scenario);
  }
}
