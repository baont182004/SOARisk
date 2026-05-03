import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';

import { AlertsModule } from './alerts/alerts.module';
import { AssetsModule } from './assets/assets.module';
import { ExplanationsModule } from './explanations/explanations.module';
import { HealthModule } from './health/health.module';
import { IncidentsModule } from './incidents/incidents.module';
import { JobsModule } from './jobs/jobs.module';
import { NormalizedAlertsModule } from './normalized-alerts/normalized-alerts.module';
import { PcapDemoModule } from './pcap-demo/pcap-demo.module';
import { PlaybooksModule } from './playbooks/playbooks.module';
import { RecommendationsModule } from './recommendations/recommendations.module';
import { ReportsModule } from './reports/reports.module';
import { WorkflowsModule } from './workflows/workflows.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    MongooseModule.forRoot(
      process.env.MONGODB_URI ?? 'mongodb://localhost:27017/soc_soar_platform',
    ),
    HealthModule,
    AlertsModule,
    NormalizedAlertsModule,
    PlaybooksModule,
    RecommendationsModule,
    ExplanationsModule,
    WorkflowsModule,
    IncidentsModule,
    ReportsModule,
    AssetsModule,
    PcapDemoModule,
    JobsModule,
  ],
})
export class AppModule {}
