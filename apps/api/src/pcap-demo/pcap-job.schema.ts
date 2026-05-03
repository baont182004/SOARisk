import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { PcapJobStatus } from '@soc-soar/shared';
import type { HydratedDocument } from 'mongoose';

export type PcapJobDocument = HydratedDocument<PcapJob>;

@Schema({
  collection: 'pcap_jobs',
  versionKey: false,
})
export class PcapJob {
  @Prop({ required: true, unique: true, index: true })
  jobId!: string;

  @Prop({ required: true, index: true })
  fileId!: string;

  @Prop({
    required: true,
    enum: Object.values(PcapJobStatus),
    default: PcapJobStatus.PENDING,
    index: true,
  })
  status!: PcapJobStatus;

  @Prop({ required: true })
  message!: string;

  @Prop({ default: Date.now, index: true })
  createdAt!: Date;

  @Prop()
  completedAt?: Date;
}

export const PcapJobSchema = SchemaFactory.createForClass(PcapJob);
