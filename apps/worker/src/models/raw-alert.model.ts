import { AlertSource, AlertType, Severity } from '@soc-soar/shared';
import {
  Schema,
  model,
  models,
  type HydratedDocument,
  type Model,
} from 'mongoose';

export interface RawAlertRecord {
  alertId: string;
  source: AlertSource;
  sourceAlertId?: string;
  title: string;
  description?: string;
  alertType?: AlertType;
  severity?: Severity;
  confidence?: number;
  observedAt?: Date;
  sourceIp?: string;
  targetIp?: string;
  sourcePort?: number;
  targetPort?: number;
  protocol?: string;
  dnsQuery?: string;
  httpUri?: string;
  username?: string;
  hostname?: string;
  assetId?: string;
  rawPayload: Record<string, unknown>;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

export type RawAlertDocument = HydratedDocument<RawAlertRecord>;

const RawAlertSchema = new Schema<RawAlertRecord>(
  {
    alertId: { type: String, required: true, unique: true, index: true },
    source: { type: String, required: true, enum: Object.values(AlertSource), index: true },
    sourceAlertId: { type: String },
    title: { type: String, required: true },
    description: { type: String },
    alertType: { type: String, enum: Object.values(AlertType), index: true },
    severity: { type: String, enum: Object.values(Severity), index: true },
    confidence: { type: Number, min: 0, max: 100 },
    observedAt: { type: Date, index: true },
    sourceIp: { type: String },
    targetIp: { type: String },
    sourcePort: { type: Number, min: 1, max: 65535 },
    targetPort: { type: Number, min: 1, max: 65535 },
    protocol: { type: String },
    dnsQuery: { type: String },
    httpUri: { type: String },
    username: { type: String },
    hostname: { type: String },
    assetId: { type: String, index: true },
    rawPayload: { type: Schema.Types.Mixed, default: {} },
    tags: { type: [String], default: [] },
    createdAt: { type: Date, index: true },
    updatedAt: { type: Date },
  },
  {
    collection: 'raw_alerts',
    versionKey: false,
    timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' },
  },
);

export const RawAlertModel =
  ((models.RawAlert as Model<RawAlertRecord> | undefined) ??
    model<RawAlertRecord>('RawAlert', RawAlertSchema));
