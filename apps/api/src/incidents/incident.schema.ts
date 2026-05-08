import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { IncidentStatus, Severity } from '@soc-soar/shared';
import type { HydratedDocument } from 'mongoose';

export type IncidentDocument = HydratedDocument<Incident>;

@Schema({ _id: false, versionKey: false })
class TimelineEntry {
  @Prop({ default: Date.now })
  timestamp!: Date;

  @Prop({ required: true })
  message!: string;

  @Prop({ required: true, enum: Object.values(IncidentStatus) })
  status!: IncidentStatus;
}

const TimelineEntrySchema = SchemaFactory.createForClass(TimelineEntry);

@Schema({
  collection: 'incidents',
  versionKey: false,
  timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' },
})
export class Incident {
  @Prop({ required: true, unique: true, index: true })
  incidentId!: string;

  @Prop({ required: true })
  title!: string;

  @Prop({
    required: true,
    enum: Object.values(IncidentStatus),
    default: IncidentStatus.NEW,
  })
  status!: IncidentStatus;

  @Prop({ required: true, enum: Object.values(Severity), index: true })
  severity!: Severity;

  @Prop({ required: true, index: true })
  normalizedAlertId!: string;

  @Prop({ index: true })
  alertId?: string;

  @Prop()
  selectedPlaybookId?: string;

  @Prop({ index: true })
  recommendationId?: string;

  @Prop({ index: true })
  executionId?: string;

  @Prop({ type: [TimelineEntrySchema], default: [] })
  timeline!: TimelineEntry[];

  @Prop()
  createdAt!: Date;

  @Prop()
  updatedAt!: Date;
}

export const IncidentSchema = SchemaFactory.createForClass(Incident);
