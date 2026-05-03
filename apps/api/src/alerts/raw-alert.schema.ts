import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { AlertType, Severity } from '@soc-soar/shared';
import type { HydratedDocument } from 'mongoose';
import { SchemaTypes } from 'mongoose';

export type RawAlertDocument = HydratedDocument<RawAlert>;

@Schema({
  collection: 'raw_alerts',
  versionKey: false,
  timestamps: { createdAt: 'createdAt', updatedAt: false },
})
export class RawAlert {
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

  @Prop({ type: SchemaTypes.Mixed, default: {} })
  payload!: Record<string, unknown>;

  @Prop()
  sourceIp?: string;

  @Prop()
  targetIp?: string;

  @Prop({ index: true })
  createdAt!: Date;
}

export const RawAlertSchema = SchemaFactory.createForClass(RawAlert);
