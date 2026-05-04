import { Injectable } from '@nestjs/common';
import {
  summarizePlaybookDataset,
  validatePlaybookDataset,
  type Playbook as SharedPlaybook,
} from '@soc-soar/shared';

@Injectable()
export class PlaybookValidationService {
  validateDataset(playbooks: SharedPlaybook[]) {
    return validatePlaybookDataset(playbooks);
  }

  summarizeDataset(playbooks: SharedPlaybook[]) {
    return summarizePlaybookDataset(playbooks);
  }
}
