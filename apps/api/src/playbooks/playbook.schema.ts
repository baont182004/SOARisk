import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import {
  AlertType,
  ApprovalPolicy,
  AutomationLevel,
  IncidentCategory,
  PlaybookActionType,
  PlaybookStatus,
  PlaybookStepRisk,
  Severity,
} from '@soc-soar/shared';
import { SchemaTypes, type HydratedDocument } from 'mongoose';

export type PlaybookDocument = HydratedDocument<Playbook>;

@Schema({ _id: false, versionKey: false })
class PlaybookConditionEntry {
  @Prop({ required: true })
  field!: string;

  @Prop({ required: true, enum: ['equals', 'includes', 'exists', 'in', 'gte', 'lte'] })
  operator!: string;

  @Prop({ type: SchemaTypes.Mixed })
  value?: string | string[] | number;

  @Prop()
  weightHint?: number;

  @Prop({ required: true })
  description!: string;
}

const PlaybookConditionEntrySchema = SchemaFactory.createForClass(PlaybookConditionEntry);

@Schema({ _id: false, versionKey: false })
class PlaybookReferenceEntry {
  @Prop({ required: true })
  name!: string;

  @Prop({
    required: true,
    enum: ['standard', 'guideline', 'tool_reference', 'internal_design'],
  })
  type!: string;

  @Prop({ required: true })
  note!: string;
}

const PlaybookReferenceEntrySchema = SchemaFactory.createForClass(PlaybookReferenceEntry);

@Schema({ _id: false, versionKey: false })
class PlaybookActionEntry {
  @Prop({ required: true })
  step!: number;

  @Prop({ required: true })
  action!: string;

  @Prop({ required: true, enum: Object.values(PlaybookActionType) })
  type!: PlaybookActionType;

  @Prop({ required: true })
  description!: string;

  @Prop({ type: [String], default: [] })
  requiredFields!: string[];

  @Prop({ type: [String], default: [] })
  produces!: string[];

  @Prop({ required: true, default: false })
  approvalRequired!: boolean;

  @Prop({ required: true, enum: Object.values(PlaybookStepRisk) })
  risk!: PlaybookStepRisk;

  @Prop({ required: true, default: true })
  mockOnly!: boolean;
}

const PlaybookActionEntrySchema = SchemaFactory.createForClass(PlaybookActionEntry);

@Schema({
  collection: 'playbooks',
  versionKey: false,
  timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' },
})
export class Playbook {
  @Prop({ required: true, unique: true, index: true })
  playbookId!: string;

  @Prop({ required: true })
  name!: string;

  @Prop({ required: true })
  description!: string;

  @Prop({ required: true, enum: Object.values(IncidentCategory), index: true })
  incidentCategory!: IncidentCategory;

  @Prop({ type: [String], enum: Object.values(AlertType), default: [], index: true })
  supportedAlertTypes!: AlertType[];

  @Prop({ type: [String], default: [] })
  requiredFields!: string[];

  @Prop({ type: [String], default: [] })
  optionalFields!: string[];

  @Prop({ type: [String], enum: Object.values(Severity), default: [] })
  severityRange!: Severity[];

  @Prop({ type: [String], default: [] })
  assetContext!: string[];

  @Prop({ type: [PlaybookConditionEntrySchema], default: [] })
  conditions!: PlaybookConditionEntry[];

  @Prop({ type: [PlaybookActionEntrySchema], default: [] })
  actions!: PlaybookActionEntry[];

  @Prop({ required: true, default: false })
  approvalRequired!: boolean;

  @Prop({
    required: true,
    enum: Object.values(ApprovalPolicy),
    default: ApprovalPolicy.NONE,
  })
  approvalPolicy!: ApprovalPolicy;

  @Prop({
    required: true,
    enum: Object.values(AutomationLevel),
    default: AutomationLevel.MANUAL,
    index: true,
  })
  automationLevel!: AutomationLevel;

  @Prop({
    required: true,
    enum: Object.values(PlaybookStatus),
    default: PlaybookStatus.ACTIVE,
    index: true,
  })
  status!: PlaybookStatus;

  @Prop({ type: [PlaybookReferenceEntrySchema], default: [] })
  references!: PlaybookReferenceEntry[];

  @Prop({ required: true, default: '1.0.0' })
  version!: string;

  @Prop({ type: [String], default: [] })
  tags!: string[];

  @Prop()
  createdAt!: Date;

  @Prop()
  updatedAt!: Date;
}

export const PlaybookSchema = SchemaFactory.createForClass(Playbook);
