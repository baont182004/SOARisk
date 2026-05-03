import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { Playbook, PlaybookSchema } from './playbook.schema';
import { PlaybooksController } from './playbooks.controller';
import { PlaybooksService } from './playbooks.service';

@Module({
  imports: [MongooseModule.forFeature([{ name: Playbook.name, schema: PlaybookSchema }])],
  controllers: [PlaybooksController],
  providers: [PlaybooksService],
  exports: [PlaybooksService],
})
export class PlaybooksModule {}
