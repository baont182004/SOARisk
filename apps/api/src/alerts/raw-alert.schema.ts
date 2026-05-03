import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { AlertSource, AlertType, Severity } from '@soc-soar/shared';
import type { HydratedDocument } from 'mongoose';
import { SchemaTypes } from 'mongoose';

export type RawAlertDocument = HydratedDocument<RawAlert>;

@Schema({
  collection: 'raw_alerts',
  versionKey: false,
  timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' },
})
export class RawAlert {
  @Prop({ required: true, unique: true, index: true })
  alertId!: string;

  @Prop({ required: true, enum: Object.values(AlertSource), index: true })
  source!: AlertSource;

  @Prop()
  sourceAlertId?: string;

  @Prop({ required: true })
  title!: string;

  @Prop()
  description?: string;

  @Prop({ enum: Object.values(AlertType), index: true })
  alertType?: AlertType;

  @Prop({ enum: Object.values(Severity), index: true })
  severity?: Severity;

  @Prop({ min: 0, max: 100 })
  confidence?: number;

  @Prop({ index: true })
  observedAt?: Date;

  @Prop()
  sourceIp?: string;

  @Prop()
  targetIp?: string;

  @Prop({ min: 1, max: 65535 })
  sourcePort?: number;

  @Prop({ min: 1, max: 65535 })
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

  @Prop({ type: SchemaTypes.Mixed, default: {} })
  rawPayload!: Record<string, unknown>;

  @Prop({ type: [String], default: [] })
  tags!: string[];

  @Prop({ index: true })
  createdAt!: Date;

  @Prop()
  updatedAt!: Date;
}

export const RawAlertSchema = SchemaFactory.createForClass(RawAlert);
