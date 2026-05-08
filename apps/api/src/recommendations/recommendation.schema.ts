import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import {
  AlertType,
  AutomationLevel,
  IncidentCategory,
  RecommendationStatus,
  Severity,
  type ApprovalRisk,
  type MitreTechnique,
  type RecommendationCriterionBreakdown,
} from '@soc-soar/shared';
import { SchemaTypes, type HydratedDocument } from 'mongoose';

export type RecommendationDocument = HydratedDocument<Recommendation>;

@Schema({ _id: false, versionKey: false })
class RecommendationScoreBreakdownEntry {
  @Prop({ required: true })
  alertTypeScore!: number;

  @Prop()
  mitreTechniqueScore?: number;

  @Prop({ required: true })
  requiredFieldsScore!: number;

  @Prop({ required: true })
  severityScore!: number;

  @Prop({ required: true })
  assetContextScore!: number;

  @Prop()
  conditionScore?: number;

  @Prop()
  indicatorContextScore?: number;

  @Prop()
  alertConfidenceScore?: number;

  @Prop()
  sourceReliabilityScore?: number;

  @Prop({ required: true })
  automationScore!: number;

  @Prop()
  historicalPerformanceScore?: number;

  @Prop()
  penaltyScore?: number;

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

  @Prop()
  finalScore?: number;

  @Prop({ enum: ['high', 'medium', 'low'] })
  confidenceBand?: 'high' | 'medium' | 'low';

  @Prop({ type: [String], default: [] })
  matchedReasons!: string[];

  @Prop({ type: [String], default: [] })
  missingFields!: string[];

  @Prop({ type: [String], default: [] })
  matchedCriteria!: string[];

  @Prop({ type: [String], default: [] })
  missingCriteria!: string[];

  @Prop()
  explanation?: string;

  @Prop({ type: [SchemaTypes.Mixed], default: [] })
  criteriaBreakdown!: RecommendationCriterionBreakdown[];

  @Prop({ type: RecommendationScoreBreakdownEntrySchema, required: true })
  scoreBreakdown!: RecommendationScoreBreakdownEntry;

  @Prop({ required: true, default: false })
  approvalRequired!: boolean;

  @Prop({ required: true, enum: Object.values(AutomationLevel) })
  automationLevel!: AutomationLevel;

  @Prop({ enum: ['low', 'medium', 'high', 'critical'] })
  approvalRisk?: ApprovalRisk;

  @Prop()
  automationSuitability?: number;

  @Prop({ type: [SchemaTypes.Mixed], default: [] })
  mitreTechniques!: MitreTechnique[];
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
