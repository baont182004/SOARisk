import { Injectable } from '@nestjs/common';
import { normalizeRawAlert, type NormalizationResult, type RawAlert } from '@soc-soar/shared';

@Injectable()
export class NormalizationService {
  normalize(rawAlert: RawAlert): NormalizationResult {
    return normalizeRawAlert(rawAlert);
  }
}
