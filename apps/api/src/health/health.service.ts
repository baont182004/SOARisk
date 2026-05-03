import { Injectable } from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import type { Connection } from 'mongoose';

import { createSuccessResponse } from '../common/api-response.util';

const DATABASE_READY_STATES: Record<number, string> = {
  0: 'disconnected',
  1: 'connected',
  2: 'connecting',
  3: 'disconnecting',
};

@Injectable()
export class HealthService {
  constructor(@InjectConnection() private readonly connection: Connection) {}

  getStatus() {
    return createSuccessResponse('API health status retrieved.', {
      status: 'ok',
      service: 'soc-soar-api',
      timestamp: new Date().toISOString(),
      database: {
        readyState: this.connection.readyState,
        state: DATABASE_READY_STATES[this.connection.readyState] ?? 'unknown',
      },
    });
  }
}
