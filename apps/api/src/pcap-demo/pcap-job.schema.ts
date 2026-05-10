import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { PcapJobStatus } from '@soc-soar/shared';
import type { HydratedDocument } from 'mongoose';

export type PcapJobDocument = HydratedDocument<PcapJob>;

@Schema({ _id: false, versionKey: false })
class PcapPipelineEvent {
  @Prop({ default: Date.now })
  timestamp!: Date;

  @Prop({ required: true })
  status!: string;

  @Prop({ required: true })
  message!: string;
}

const PcapPipelineEventSchema = SchemaFactory.createForClass(PcapPipelineEvent);

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

  @Prop({ index: true })
  rawAlertId?: string;

  @Prop({ index: true })
  normalizedAlertId?: string;

  @Prop({ index: true })
  recommendationId?: string;

  @Prop({ index: true })
  explanationId?: string;

  @Prop()
  selectedPlaybookId?: string;

  @Prop({ index: true })
  reviewId?: string;

  @Prop({ index: true })
  approvalId?: string;

  @Prop({ index: true })
  executionId?: string;

  @Prop({ index: true })
  incidentId?: string;

  @Prop({ index: true })
  reportId?: string;

  @Prop({ type: [PcapPipelineEventSchema], default: [] })
  pipelineEvents!: PcapPipelineEvent[];

  @Prop({ default: Date.now, index: true })
  createdAt!: Date;

  @Prop()
  completedAt?: Date;
}

export const PcapJobSchema = SchemaFactory.createForClass(PcapJob);
