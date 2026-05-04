import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import {
  ExplanationRiskLevel,
  ExplanationSectionType,
  ExplanationStatus,
} from '@soc-soar/shared';
import type { HydratedDocument } from 'mongoose';

export type RecommendationExplanationDocument = HydratedDocument<RecommendationExplanation>;

@Schema({ _id: false, versionKey: false })
class ExplanationSectionEntry {
  @Prop({ required: true, enum: Object.values(ExplanationSectionType) })
  type!: ExplanationSectionType;

  @Prop({ required: true })
  title!: string;

  @Prop({ required: true })
  content!: string;

  @Prop({ type: [String], default: [] })
  evidenceRefs!: string[];

  @Prop({ enum: Object.values(ExplanationRiskLevel) })
  severity?: ExplanationRiskLevel;
}

const ExplanationSectionEntrySchema = SchemaFactory.createForClass(ExplanationSectionEntry);

@Schema({ _id: false, versionKey: false })
class PlaybookExplanationEntry {
  @Prop({ required: true })
  playbookId!: string;

  @Prop({ required: true })
  rank!: number;

  @Prop({ required: true })
  totalScore!: number;

  @Prop({ required: true, enum: ['recommended', 'alternative', 'not_selected'] })
  decision!: 'recommended' | 'alternative' | 'not_selected';

  @Prop({ required: true })
  summary!: string;

  @Prop({ type: [String], default: [] })
  scoreExplanation!: string[];

  @Prop({ type: [String], default: [] })
  matchedReasons!: string[];

  @Prop({ type: [String], default: [] })
  missingFields!: string[];

  @Prop({ type: [String], default: [] })
  approvalNotes!: string[];

  @Prop({ type: [String], default: [] })
  limitations!: string[];
}

const PlaybookExplanationEntrySchema = SchemaFactory.createForClass(PlaybookExplanationEntry);

@Schema({
  collection: 'recommendation_explanations',
  versionKey: false,
  timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' },
})
export class RecommendationExplanation {
  @Prop({ required: true, unique: true, index: true })
  explanationId!: string;

  @Prop({ required: true, index: true })
  recommendationId!: string;

  @Prop({ required: true, index: true })
  normalizedAlertId!: string;

  @Prop({ required: true, index: true })
  alertId!: string;

  @Prop()
  selectedPlaybookId?: string;

  @Prop({ required: true })
  topPlaybookId!: string;

  @Prop({
    required: true,
    enum: Object.values(ExplanationStatus),
    default: ExplanationStatus.GENERATED,
    index: true,
  })
  status!: ExplanationStatus;

  @Prop({ required: true })
  summary!: string;

  @Prop({ type: [ExplanationSectionEntrySchema], default: [] })
  sections!: ExplanationSectionEntry[];

  @Prop({ type: [PlaybookExplanationEntrySchema], default: [] })
  playbookExplanations!: PlaybookExplanationEntry[];

  @Prop({ type: [String], default: [] })
  limitations!: string[];

  @Prop({ type: [String], default: [] })
  analystGuidance!: string[];

  @Prop({ index: true })
  createdAt!: Date;

  @Prop()
  updatedAt!: Date;
}

export const RecommendationExplanationSchema =
  SchemaFactory.createForClass(RecommendationExplanation);
