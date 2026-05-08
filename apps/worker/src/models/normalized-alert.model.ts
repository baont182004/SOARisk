import {
  AlertSource,
  AlertType,
  NormalizedAlertStatus,
  Severity,
} from '@soc-soar/shared';
import {
  Schema,
  SchemaTypes,
  model,
  models,
  type HydratedDocument,
  type Model,
} from 'mongoose';

export interface AssetContextEntry {
  assetId?: string;
  hostname?: string;
  ipAddress?: string;
  owner?: string;
  environment?: string;
  criticality?: Severity;
  tags: string[];
}

export interface AlertEvidenceEntry {
  key: string;
  value: string;
  sourceField: string;
  description: string;
}

export interface NormalizedAlertRecord {
  normalizedAlertId: string;
  alertId: string;
  source: AlertSource;
  alertType: AlertType;
  title: string;
  description?: string;
  severity: Severity;
  confidence: number;
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
  assetContext: AssetContextEntry[];
  additionalContext?: Record<string, unknown>;
  evidence: AlertEvidenceEntry[];
  normalizationStatus: NormalizedAlertStatus;
  normalizationNotes: string[];
  createdAt: Date;
  updatedAt: Date;
}

export type NormalizedAlertDocument = HydratedDocument<NormalizedAlertRecord>;

const AssetContextEntrySchema = new Schema<AssetContextEntry>(
  {
    assetId: { type: String },
    hostname: { type: String },
    ipAddress: { type: String },
    owner: { type: String },
    environment: { type: String },
    criticality: { type: String, enum: Object.values(Severity) },
    tags: { type: [String], default: [] },
  },
  {
    _id: false,
    versionKey: false,
  },
);

const AlertEvidenceEntrySchema = new Schema<AlertEvidenceEntry>(
  {
    key: { type: String, required: true },
    value: { type: String, required: true },
    sourceField: { type: String, required: true },
    description: { type: String, required: true },
  },
  {
    _id: false,
    versionKey: false,
  },
);

const NormalizedAlertSchema = new Schema<NormalizedAlertRecord>(
  {
    normalizedAlertId: { type: String, required: true, unique: true, index: true },
    alertId: { type: String, required: true, index: true },
    source: { type: String, required: true, enum: Object.values(AlertSource), index: true },
    alertType: { type: String, required: true, enum: Object.values(AlertType), index: true },
    title: { type: String, required: true },
    description: { type: String },
    severity: { type: String, required: true, enum: Object.values(Severity), index: true },
    confidence: { type: Number, required: true, min: 0, max: 100 },
    observedAt: { type: Date, index: true },
    sourceIp: { type: String },
    targetIp: { type: String },
    sourcePort: { type: Number },
    targetPort: { type: Number },
    protocol: { type: String },
    dnsQuery: { type: String },
    httpUri: { type: String },
    username: { type: String },
    hostname: { type: String },
    assetId: { type: String, index: true },
    assetContext: { type: [AssetContextEntrySchema], default: [] },
    additionalContext: { type: SchemaTypes.Mixed },
    evidence: { type: [AlertEvidenceEntrySchema], default: [] },
    normalizationStatus: {
      type: String,
      required: true,
      enum: Object.values(NormalizedAlertStatus),
      default: NormalizedAlertStatus.PENDING,
      index: true,
    },
    normalizationNotes: { type: [String], default: [] },
    createdAt: { type: Date, index: true },
    updatedAt: { type: Date },
  },
  {
    collection: 'normalized_alerts',
    versionKey: false,
    timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' },
  },
);

export const NormalizedAlertModel =
  ((models.NormalizedAlert as Model<NormalizedAlertRecord> | undefined) ??
    model<NormalizedAlertRecord>('NormalizedAlert', NormalizedAlertSchema));
