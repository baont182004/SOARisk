import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { ApprovalStatus } from '@soc-soar/shared';
import type { HydratedDocument } from 'mongoose';

export type RecommendationDocument = HydratedDocument<Recommendation>;

@Schema({ _id: false, versionKey: false })
class TopPlaybookEntry {
  @Prop({ required: true })
  playbookId!: string;

  @Prop({ required: true })
  score!: number;

  @Prop({
    required: true,
    enum: Object.values(ApprovalStatus),
    default: ApprovalStatus.PENDING,
  })
  approvalStatus!: ApprovalStatus;
}

const TopPlaybookEntrySchema = SchemaFactory.createForClass(TopPlaybookEntry);

@Schema({
  collection: 'recommendations',
  versionKey: false,
  timestamps: { createdAt: 'createdAt', updatedAt: false },
})
export class Recommendation {
  @Prop({ required: true, unique: true, index: true })
  recommendationId!: string;

  @Prop({ required: true, index: true })
  normalizedAlertId!: string;

  @Prop({ type: [TopPlaybookEntrySchema], default: [] })
  topPlaybooks!: TopPlaybookEntry[];

  @Prop()
  selectedPlaybookId?: string;

  @Prop({ type: Map, of: Number, default: {} })
  scoreBreakdown!: Record<string, number>;

  @Prop({ required: true })
  explanationSummary!: string;

  @Prop({ index: true })
  createdAt!: Date;
}

export const RecommendationSchema = SchemaFactory.createForClass(Recommendation);
