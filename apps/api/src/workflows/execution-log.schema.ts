import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { ExecutionLogLevel } from '@soc-soar/shared';
import type { HydratedDocument } from 'mongoose';

export type ExecutionLogDocument = HydratedDocument<ExecutionLog>;

@Schema({
  collection: 'execution_logs',
  versionKey: false,
  timestamps: { createdAt: 'createdAt', updatedAt: false },
})
export class ExecutionLog {
  @Prop({ required: true, unique: true, index: true })
  logId!: string;

  @Prop({ required: true, index: true })
  executionId!: string;

  @Prop()
  step?: number;

  @Prop()
  action?: string;

  @Prop({ required: true, enum: Object.values(ExecutionLogLevel) })
  level!: ExecutionLogLevel;

  @Prop({ required: true })
  message!: string;

  @Prop({ index: true })
  createdAt!: Date;
}

export const ExecutionLogSchema = SchemaFactory.createForClass(ExecutionLog);
