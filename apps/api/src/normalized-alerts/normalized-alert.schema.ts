import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { AlertType, Severity } from '@soc-soar/shared';
import type { HydratedDocument } from 'mongoose';
import { SchemaTypes } from 'mongoose';

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

@Schema({
  collection: 'normalized_alerts',
  versionKey: false,
  timestamps: { createdAt: 'createdAt', updatedAt: false },
})
export class NormalizedAlert {
  @Prop({ required: true, unique: true, index: true })
  alertId!: string;

  @Prop({ required: true })
  source!: string;

  @Prop({ required: true, enum: Object.values(AlertType), index: true })
  alertType!: AlertType;

  @Prop({ required: true })
  title!: string;

  @Prop({ required: true, enum: Object.values(Severity), index: true })
  severity!: Severity;

  @Prop({ required: true, min: 0, max: 1 })
  confidence!: number;

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

  @Prop({ type: [SchemaTypes.Mixed], default: [] })
  evidence!: Record<string, unknown>[];

  @Prop({ type: [AssetContextEntrySchema], default: [] })
  assetContext!: AssetContextEntry[];

  @Prop({ index: true })
  rawAlertId?: string;

  @Prop({ index: true })
  createdAt!: Date;
}

export const NormalizedAlertSchema = SchemaFactory.createForClass(NormalizedAlert);
