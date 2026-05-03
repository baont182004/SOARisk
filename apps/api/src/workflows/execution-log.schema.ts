import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { WorkflowExecutionStatus } from '@soc-soar/shared';
import type { HydratedDocument } from 'mongoose';

export type ExecutionLogDocument = HydratedDocument<ExecutionLog>;

@Schema({
  collection: 'execution_logs',
  versionKey: false,
})
export class ExecutionLog {
  @Prop({ required: true, index: true })
  executionId!: string;

  @Prop({ required: true })
  step!: number;

  @Prop({ required: true })
  action!: string;

  @Prop({ required: true, enum: Object.values(WorkflowExecutionStatus) })
  status!: WorkflowExecutionStatus;

  @Prop({ required: true })
  message!: string;

  @Prop({ index: true })
  startedAt?: Date;

  @Prop()
  finishedAt?: Date;
}

export const ExecutionLogSchema = SchemaFactory.createForClass(ExecutionLog);
