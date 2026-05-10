import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Severity } from '@soc-soar/shared';
import type { HydratedDocument } from 'mongoose';
import { SchemaTypes } from 'mongoose';

export type AnalystReviewDocument = HydratedDocument<AnalystReview>;

@Schema({ _id: false, versionKey: false })
class ReviewAuditEntry {
  @Prop({ default: Date.now })
  timestamp!: Date;

  @Prop({ required: true })
  actor!: string;

  @Prop({ required: true })
  action!: string;

  @Prop({ type: SchemaTypes.Mixed, default: {} })
  changes!: Record<string, unknown>;
}

const ReviewAuditEntrySchema = SchemaFactory.createForClass(ReviewAuditEntry);

@Schema({
  collection: 'analyst_reviews',
  versionKey: false,
  timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' },
})
export class AnalystReview {
  @Prop({ required: true, unique: true, index: true })
  reviewId!: string;

  @Prop({ required: true, index: true })
  recommendationId!: string;

  @Prop({ required: true, index: true })
  normalizedAlertId!: string;

  @Prop({ required: true, index: true })
  alertId!: string;

  @Prop({ index: true })
  pcapJobId?: string;

  @Prop({ required: true })
  selectedPlaybookId!: string;

  @Prop({ enum: Object.values(Severity) })
  severity?: Severity;

  @Prop({ min: 0, max: 100 })
  confidence?: number;

  @Prop()
  assetContext?: string;

  @Prop()
  recommendedAction?: string;

  @Prop()
  analystNote?: string;

  @Prop({ enum: ['unknown', 'true_positive', 'false_positive'], default: 'unknown' })
  verdict!: 'unknown' | 'true_positive' | 'false_positive';

  @Prop({
    enum: ['review', 'approval', 'changes_requested', 'approved', 'rejected'],
    default: 'review',
    index: true,
  })
  status!: 'review' | 'approval' | 'changes_requested' | 'approved' | 'rejected';

  @Prop({ index: true })
  approvalId?: string;

  @Prop({ index: true })
  executionId?: string;

  @Prop({ type: [ReviewAuditEntrySchema], default: [] })
  auditLog!: ReviewAuditEntry[];

  @Prop()
  createdAt!: Date;

  @Prop()
  updatedAt!: Date;
}

export const AnalystReviewSchema = SchemaFactory.createForClass(AnalystReview);
