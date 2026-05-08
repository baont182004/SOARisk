import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import {
  AlertSource,
  AlertType,
  NormalizedAlertStatus,
  Severity,
} from '@soc-soar/shared';
import { SchemaTypes } from 'mongoose';
import type { HydratedDocument } from 'mongoose';

export type NormalizedAlertDocument = HydratedDocument<NormalizedAlert>;

@Schema({ _id: false, versionKey: false })
class AssetContextEntry {
  @Prop()
  assetId?: string;

  @Prop()
  hostname?: string;

  @Prop()
  ipAddress?: string;

  @Prop()
  owner?: string;

  @Prop()
  environment?: string;

  @Prop({ enum: Object.values(Severity) })
  criticality?: Severity;

  @Prop({ type: [String], default: [] })
  tags!: string[];
}

const AssetContextEntrySchema = SchemaFactory.createForClass(AssetContextEntry);

@Schema({ _id: false, versionKey: false })
class AlertEvidenceEntry {
  @Prop({ required: true })
  key!: string;

  @Prop({ required: true })
  value!: string;

  @Prop({ required: true })
  sourceField!: string;

  @Prop({ required: true })
  description!: string;
}

const AlertEvidenceEntrySchema = SchemaFactory.createForClass(AlertEvidenceEntry);

@Schema({
  collection: 'normalized_alerts',
  versionKey: false,
  timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' },
})
export class NormalizedAlert {
  @Prop({ required: true, unique: true, index: true })
  normalizedAlertId!: string;

  @Prop({ required: true, index: true })
  alertId!: string;

  @Prop({ required: true, enum: Object.values(AlertSource), index: true })
  source!: AlertSource;

  @Prop({ required: true, enum: Object.values(AlertType), index: true })
  alertType!: AlertType;

  @Prop({ required: true })
  title!: string;

  @Prop()
  description?: string;

  @Prop({ required: true, enum: Object.values(Severity), index: true })
  severity!: Severity;

  @Prop({ required: true, min: 0, max: 100 })
  confidence!: number;

  @Prop({ index: true })
  observedAt?: Date;

  @Prop()
  sourceIp?: string;

  @Prop()
  targetIp?: string;

  @Prop()
  sourcePort?: number;

  @Prop()
  targetPort?: number;

  @Prop()
  protocol?: string;

  @Prop()
  dnsQuery?: string;

  @Prop()
  httpUri?: string;

  @Prop()
  username?: string;

  @Prop()
  hostname?: string;

  @Prop({ index: true })
  assetId?: string;

  @Prop({ type: [AssetContextEntrySchema], default: [] })
  assetContext!: AssetContextEntry[];

  @Prop({ type: SchemaTypes.Mixed })
  additionalContext?: Record<string, unknown>;

  @Prop({ type: [AlertEvidenceEntrySchema], default: [] })
  evidence!: AlertEvidenceEntry[];

  @Prop({
    required: true,
    enum: Object.values(NormalizedAlertStatus),
    default: NormalizedAlertStatus.PENDING,
    index: true,
  })
  normalizationStatus!: NormalizedAlertStatus;

  @Prop({ type: [String], default: [] })
  normalizationNotes!: string[];

  @Prop({ index: true })
  createdAt!: Date;

  @Prop()
  updatedAt!: Date;
}

export const NormalizedAlertSchema = SchemaFactory.createForClass(NormalizedAlert);
