import { Module } from '@nestjs/common';

import { ExplanationsController } from './explanations.controller';
import { ExplanationsService } from './explanations.service';

@Module({
  controllers: [ExplanationsController],
  providers: [ExplanationsService],
})
export class ExplanationsModule {}
