import { Controller, Get, Param, Post } from '@nestjs/common';

import { PlaybooksService } from './playbooks.service';

@Controller('playbooks')
export class PlaybooksController {
  constructor(private readonly playbooksService: PlaybooksService) {}

  @Get()
  findAll() {
    return this.playbooksService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.playbooksService.findOne(id);
  }

  @Post('seed')
  seed() {
    return this.playbooksService.seed();
  }
}
