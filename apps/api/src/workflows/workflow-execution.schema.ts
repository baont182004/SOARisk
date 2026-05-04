import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import {
  ApprovalStatus,
  PlaybookActionType,
  PlaybookStepRisk,
  WorkflowExecutionStatus,
  WorkflowStepStatus,
} from '@soc-soar/shared';
import type { HydratedDocument } from 'mongoose';

export type WorkflowExecutionDocument = HydratedDocument<WorkflowExecution>;

@Schema({ _id: false, versionKey: false })
class WorkflowStepEntry {
  @Prop({ required: true })
  step!: number;

  @Prop({ required: true })
  action!: string;

  @Prop({ required: true, enum: Object.values(PlaybookActionType) })
  type!: PlaybookActionType;

  @Prop({ required: true })
  description!: string;

  @Prop({ required: true, default: false })
  approvalRequired!: boolean;

  @Prop({
    required: true,
    enum: Object.values(ApprovalStatus),
    default: ApprovalStatus.NOT_REQUIRED,
  })
  approvalStatus!: ApprovalStatus;

  @Prop({ required: true, enum: Object.values(PlaybookStepRisk) })
  risk!: PlaybookStepRisk;

  @Prop({ required: true, default: true })
  mockOnly!: boolean;

  @Prop({
    required: true,
    enum: Object.values(WorkflowStepStatus),
    default: WorkflowStepStatus.PENDING,
  })
  status!: WorkflowStepStatus;

  @Prop()
  startedAt?: Date;

  @Prop()
  finishedAt?: Date;

  @Prop()
  result?: string;
}

const WorkflowStepEntrySchema = SchemaFactory.createForClass(WorkflowStepEntry);

@Schema({
  collection: 'workflow_executions',
  versionKey: false,
  timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' },
})
export class WorkflowExecution {
  @Prop({ required: true, unique: true, index: true })
  executionId!: string;

  @Prop({ required: true, index: true })
  recommendationId!: string;

  @Prop({ required: true, index: true })
  normalizedAlertId!: string;

  @Prop({ required: true, index: true })
  alertId!: string;

  @Prop({ required: true, index: true })
  playbookId!: string;

  @Prop({
    required: true,
    enum: Object.values(WorkflowExecutionStatus),
    default: WorkflowExecutionStatus.PENDING,
    index: true,
  })
  status!: WorkflowExecutionStatus;

  @Prop({ required: true, default: 1 })
  currentStep!: number;

  @Prop({ type: [WorkflowStepEntrySchema], default: [] })
  steps!: WorkflowStepEntry[];

  @Prop()
  startedAt?: Date;

  @Prop()
  finishedAt?: Date;

  @Prop({ index: true })
  createdAt!: Date;

  @Prop()
  updatedAt!: Date;
}

export const WorkflowExecutionSchema = SchemaFactory.createForClass(WorkflowExecution);
