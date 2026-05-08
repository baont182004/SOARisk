import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { AlertsModule } from '../alerts/alerts.module';
import { PcapDemoController } from './pcap-demo.controller';
import { PcapDemoService } from './pcap-demo.service';
import { PcapFile, PcapFileSchema } from './pcap-file.schema';
import { PcapJob, PcapJobSchema } from './pcap-job.schema';

@Module({
  imports: [
    AlertsModule,
    MongooseModule.forFeature([
      { name: PcapFile.name, schema: PcapFileSchema },
      { name: PcapJob.name, schema: PcapJobSchema },
    ]),
  ],
  controllers: [PcapDemoController],
  providers: [PcapDemoService],
  exports: [PcapDemoService],
})
export class PcapDemoModule {}
