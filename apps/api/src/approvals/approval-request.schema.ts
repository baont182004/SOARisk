import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { ApprovalStatus, PlaybookStepRisk } from '@soc-soar/shared';
import type { HydratedDocument } from 'mongoose';

export type ApprovalRequestDocument = HydratedDocument<ApprovalRequest>;

@Schema({
  collection: 'approval_requests',
  versionKey: false,
  timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' },
})
export class ApprovalRequest {
  @Prop({ required: true, unique: true, index: true })
  approvalId!: string;

  @Prop({ required: true, index: true })
  executionId!: string;

  @Prop({ required: true })
  step!: number;

  @Prop({ required: true })
  action!: string;

  @Prop({ required: true, enum: Object.values(PlaybookStepRisk) })
  risk!: PlaybookStepRisk;

  @Prop({
    required: true,
    enum: Object.values(ApprovalStatus),
    default: ApprovalStatus.PENDING,
    index: true,
  })
  status!: ApprovalStatus;

  @Prop({ required: true })
  requestedAt!: Date;

  @Prop()
  decidedAt?: Date;

  @Prop()
  decidedBy?: string;

  @Prop()
  decisionReason?: string;

  @Prop({ index: true })
  createdAt!: Date;

  @Prop()
  updatedAt!: Date;
}

export const ApprovalRequestSchema = SchemaFactory.createForClass(ApprovalRequest);

ApprovalRequestSchema.index({ executionId: 1, step: 1 }, { unique: true });
