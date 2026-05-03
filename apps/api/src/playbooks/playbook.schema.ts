import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { AlertType, AutomationLevel, Severity } from '@soc-soar/shared';
import type { HydratedDocument } from 'mongoose';

export type PlaybookDocument = HydratedDocument<Playbook>;

@Schema({ _id: false, versionKey: false })
class PlaybookActionEntry {
  @Prop({ required: true })
  step!: number;

  @Prop({ required: true })
  action!: string;

  @Prop({ required: true })
  type!: string;

  @Prop({ required: true })
  description!: string;

  @Prop({ required: true, default: false })
  approvalRequired!: boolean;

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

  @Prop({ required: true })
  incidentCategory!: string;

  @Prop({ type: [String], enum: Object.values(AlertType), default: [], index: true })
  supportedAlertTypes!: AlertType[];

  @Prop({ type: [String], default: [] })
  requiredFields!: string[];

  @Prop({ type: [String], enum: Object.values(Severity), default: [] })
  severityRange!: Severity[];

  @Prop({ type: [String], default: [] })
  assetContext!: string[];

  @Prop({ type: [PlaybookActionEntrySchema], default: [] })
  actions!: PlaybookActionEntry[];

  @Prop({ required: true, default: false })
  approvalRequired!: boolean;

  @Prop({
    required: true,
    enum: Object.values(AutomationLevel),
    default: AutomationLevel.MANUAL,
  })
  automationLevel!: AutomationLevel;

  @Prop({ type: [String], default: [] })
  references!: string[];

  @Prop()
  createdAt!: Date;

  @Prop()
  updatedAt!: Date;
}

export const PlaybookSchema = SchemaFactory.createForClass(Playbook);
