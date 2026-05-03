import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Severity } from '@soc-soar/shared';
import type { HydratedDocument } from 'mongoose';

export type AssetDocument = HydratedDocument<Asset>;

@Schema({
  collection: 'assets',
  versionKey: false,
  timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' },
})
export class Asset {
  @Prop({ required: true, unique: true, index: true })
  assetId!: string;

  @Prop({ index: true })
  hostname?: string;

  @Prop({ index: true })
  ipAddress?: string;

  @Prop()
  owner?: string;

  @Prop()
  environment?: string;

  @Prop({ enum: Object.values(Severity) })
  criticality?: Severity;

  @Prop({ type: [String], default: [] })
  tags!: string[];

  @Prop()
  createdAt!: Date;

  @Prop()
  updatedAt!: Date;
}

export const AssetSchema = SchemaFactory.createForClass(Asset);
