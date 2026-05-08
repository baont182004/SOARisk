import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import {
  ApprovalStatus,
  type DashboardSummary,
  type Incident as SharedIncident,
  type RawAlert as SharedRawAlert,
  type Recommendation as SharedRecommendation,
  type Report as SharedReport,
  type WorkflowExecution as SharedWorkflowExecution,
} from '@soc-soar/shared';
import type { Model } from 'mongoose';

import { RawAlert } from '../alerts/raw-alert.schema';
import { ApprovalRequest } from '../approvals/approval-request.schema';
import { createSuccessResponse } from '../common/api-response.util';
import { Incident } from '../incidents/incident.schema';
import { NormalizedAlert } from '../normalized-alerts/normalized-alert.schema';
import { Playbook } from '../playbooks/playbook.schema';
import { Recommendation } from '../recommendations/recommendation.schema';
import { Report } from '../reports/report.schema';
import { WorkflowExecution } from '../workflows/workflow-execution.schema';

@Injectable()
export class DashboardService {
  constructor(
    @InjectModel(RawAlert.name) private readonly rawAlertModel: Model<RawAlert>,
    @InjectModel(NormalizedAlert.name)
    private readonly normalizedAlertModel: Model<NormalizedAlert>,
    @InjectModel(Playbook.name) private readonly playbookModel: Model<Playbook>,
    @InjectModel(Recommendation.name)
    private readonly recommendationModel: Model<Recommendation>,
    @InjectModel(ApprovalRequest.name)
    private readonly approvalRequestModel: Model<ApprovalRequest>,
    @InjectModel(WorkflowExecution.name)
    private readonly workflowExecutionModel: Model<WorkflowExecution>,
    @InjectModel(Incident.name) private readonly incidentModel: Model<Incident>,
    @InjectModel(Report.name) private readonly reportModel: Model<Report>,
  ) {}

  async getSummary() {
    const [
      rawAlerts,
      normalizedAlerts,
      playbooks,
      recommendations,
      pendingApprovals,
      workflows,
      incidents,
      reports,
      workflowStatus,
      incidentStatus,
      latestRawAlerts,
      latestRecommendations,
      latestWorkflows,
      latestIncidents,
      latestReports,
    ] = await Promise.all([
      this.rawAlertModel.countDocuments().exec(),
      this.normalizedAlertModel.countDocuments().exec(),
      this.playbookModel.countDocuments().exec(),
      this.recommendationModel.countDocuments().exec(),
      this.approvalRequestModel
        .countDocuments({ status: ApprovalStatus.PENDING })
        .exec(),
      this.workflowExecutionModel.countDocuments().exec(),
      this.incidentModel.countDocuments().exec(),
      this.reportModel.countDocuments().exec(),
      this.workflowExecutionModel.aggregate<{ _id: string; count: number }>([
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]),
      this.incidentModel.aggregate<{ _id: string; count: number }>([
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]),
      this.rawAlertModel.find().sort({ createdAt: -1 }).limit(5).lean().exec(),
      this.recommendationModel.find().sort({ createdAt: -1 }).limit(5).lean().exec(),
      this.workflowExecutionModel.find().sort({ createdAt: -1 }).limit(5).lean().exec(),
      this.incidentModel.find().sort({ createdAt: -1 }).limit(5).lean().exec(),
      this.reportModel.find().sort({ createdAt: -1 }).limit(5).lean().exec(),
    ]);

    const summary: DashboardSummary = {
      counts: {
        rawAlerts,
        normalizedAlerts,
        playbooks,
        recommendations,
        pendingApprovals,
        workflows,
        incidents,
        reports,
      },
      workflowStatus: this.mapAggregation(workflowStatus),
      incidentStatus: this.mapAggregation(incidentStatus),
      latest: {
        rawAlerts: latestRawAlerts as unknown as SharedRawAlert[],
        recommendations: latestRecommendations as unknown as SharedRecommendation[],
        workflows: latestWorkflows as unknown as SharedWorkflowExecution[],
        incidents: latestIncidents as unknown as SharedIncident[],
        reports: latestReports as unknown as SharedReport[],
      },
    };

    return createSuccessResponse('Dashboard summary retrieved.', summary);
  }

  private mapAggregation(rows: Array<{ _id: string; count: number }>) {
    return rows.reduce<Record<string, number>>((acc, row) => {
      acc[row._id] = row.count;
      return acc;
    }, {});
  }
}
