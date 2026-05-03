import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { IncidentStatus } from '@soc-soar/shared';
import type { HydratedDocument } from 'mongoose';

export type ReportDocument = HydratedDocument<Report>;

@Schema({
  collection: 'reports',
  versionKey: false,
  timestamps: { createdAt: 'createdAt', updatedAt: false },
})
export class Report {
  @Prop({ required: true, unique: true, index: true })
  reportId!: string;

  @Prop({ required: true, index: true })
  incidentId!: string;

  @Prop({ required: true })
  alertSummary!: string;

  @Prop({ required: true })
  playbookSummary!: string;

  @Prop({ required: true })
  recommendationSummary!: string;

  @Prop({ required: true })
  executionSummary!: string;

  @Prop({ required: true, enum: Object.values(IncidentStatus) })
  finalStatus!: IncidentStatus;

  @Prop({ index: true })
  createdAt!: Date;
}

export const ReportSchema = SchemaFactory.createForClass(Report);
