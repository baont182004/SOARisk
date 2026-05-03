import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { PcapFileStatus } from '@soc-soar/shared';
import type { HydratedDocument } from 'mongoose';

export type PcapFileDocument = HydratedDocument<PcapFile>;

@Schema({
  collection: 'pcap_files',
  versionKey: false,
})
export class PcapFile {
  @Prop({ required: true, unique: true, index: true })
  fileId!: string;

  @Prop({ required: true })
  filename!: string;

  @Prop({ required: true })
  originalName!: string;

  @Prop({ required: true })
  size!: number;

  @Prop({
    required: true,
    enum: Object.values(PcapFileStatus),
    default: PcapFileStatus.UPLOADED,
    index: true,
  })
  status!: PcapFileStatus;

  @Prop({ default: Date.now, index: true })
  uploadedAt!: Date;
}

export const PcapFileSchema = SchemaFactory.createForClass(PcapFile);
