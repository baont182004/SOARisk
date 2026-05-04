import { Controller, Get, Param, Post, Query } from '@nestjs/common';

import { QueryPlaybooksDto } from './dto/query-playbooks.dto';
import { PlaybooksService } from './playbooks.service';

@Controller('playbooks')
export class PlaybooksController {
  constructor(private readonly playbooksService: PlaybooksService) {}

  @Get('validate')
  validate() {
    return this.playbooksService.validate();
  }

  @Get('summary')
  summary() {
    return this.playbooksService.summary();
  }

  @Get()
  findAll(@Query() query: QueryPlaybooksDto) {
    return this.playbooksService.findAll(query);
  }

  @Get(':playbookId')
  findOne(@Param('playbookId') playbookId: string) {
    return this.playbooksService.findOne(playbookId);
  }

  @Post('seed/reset')
  resetSeed() {
    return this.playbooksService.resetSeed();
  }

  @Post('seed')
  seed() {
    return this.playbooksService.seed();
  }
}
