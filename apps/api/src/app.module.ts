import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';

import { AlertsModule } from './alerts/alerts.module';
import { ApprovalsModule } from './approvals/approvals.module';
import { AssetsModule } from './assets/assets.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { DemoModule } from './demo/demo.module';
import { EvaluationModule } from './evaluation/evaluation.module';
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
    MongooseModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const uri = configService.get<string>('MONGODB_URI');

        if (!uri) {
          throw new Error('MONGODB_URI environment variable is required.');
        }

        const dbName = configService.get<string>('MONGODB_DB_NAME');

        return {
          uri,
          ...(dbName ? { dbName } : {}),
        };
      },
    }),
    HealthModule,
    AlertsModule,
    ApprovalsModule,
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
    DashboardModule,
    EvaluationModule,
    DemoModule,
  ],
})
export class AppModule {}
