import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import {
  AlertType,
  AutomationLevel,
  IncidentCategory,
  RecommendationStatus,
  Severity,
} from '@soc-soar/shared';
import type { HydratedDocument } from 'mongoose';

export type RecommendationDocument = HydratedDocument<Recommendation>;

@Schema({ _id: false, versionKey: false })
class RecommendationScoreBreakdownEntry {
  @Prop({ required: true })
  alertTypeScore!: number;

  @Prop({ required: true })
  requiredFieldsScore!: number;

  @Prop({ required: true })
  severityScore!: number;

  @Prop({ required: true })
  assetContextScore!: number;

  @Prop({ required: true })
  conditionScore!: number;

  @Prop({ required: true })
  automationScore!: number;

  @Prop({ required: true })
  totalScore!: number;
}

const RecommendationScoreBreakdownEntrySchema = SchemaFactory.createForClass(
  RecommendationScoreBreakdownEntry,
);

@Schema({ _id: false, versionKey: false })
class TopPlaybookEntry {
  @Prop({ required: true })
  rank!: number;

  @Prop({ required: true })
  playbookId!: string;

  @Prop({ required: true })
  name!: string;

  @Prop({ required: true, enum: Object.values(IncidentCategory) })
  incidentCategory!: IncidentCategory;

  @Prop({ required: true })
  totalScore!: number;

  @Prop({ type: [String], default: [] })
  matchedReasons!: string[];

  @Prop({ type: [String], default: [] })
  missingFields!: string[];

  @Prop({ type: RecommendationScoreBreakdownEntrySchema, required: true })
  scoreBreakdown!: RecommendationScoreBreakdownEntry;

  @Prop({ required: true, default: false })
  approvalRequired!: boolean;

  @Prop({ required: true, enum: Object.values(AutomationLevel) })
  automationLevel!: AutomationLevel;
}

const TopPlaybookEntrySchema = SchemaFactory.createForClass(TopPlaybookEntry);

@Schema({
  collection: 'recommendations',
  versionKey: false,
  timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' },
})
export class Recommendation {
  @Prop({ required: true, unique: true, index: true })
  recommendationId!: string;

  @Prop({ required: true, index: true })
  normalizedAlertId!: string;

  @Prop({ required: true, index: true })
  alertId!: string;

  @Prop({ required: true, enum: Object.values(AlertType), index: true })
  alertType!: AlertType;

  @Prop({ required: true, enum: Object.values(Severity), index: true })
  severity!: Severity;

  @Prop({
    required: true,
    enum: Object.values(RecommendationStatus),
    default: RecommendationStatus.GENERATED,
    index: true,
  })
  status!: RecommendationStatus;

  @Prop({ type: [TopPlaybookEntrySchema], default: [] })
  topPlaybooks!: TopPlaybookEntry[];

  @Prop({ required: true, min: 0 })
  evaluatedPlaybookCount!: number;

  @Prop()
  selectedPlaybookId?: string;

  @Prop({ index: true })
  createdAt!: Date;

  @Prop()
  updatedAt!: Date;
}

export const RecommendationSchema = SchemaFactory.createForClass(Recommendation);
