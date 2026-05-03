import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { WorkflowExecutionStatus } from '@soc-soar/shared';
import type { HydratedDocument } from 'mongoose';

export type WorkflowExecutionDocument = HydratedDocument<WorkflowExecution>;

@Schema({
  collection: 'workflow_executions',
  versionKey: false,
})
export class WorkflowExecution {
  @Prop({ required: true, unique: true, index: true })
  executionId!: string;

  @Prop({ required: true, index: true })
  incidentId!: string;

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

  @Prop({ index: true })
  startedAt?: Date;

  @Prop()
  finishedAt?: Date;
}

export const WorkflowExecutionSchema = SchemaFactory.createForClass(WorkflowExecution);
