const API_BASE_URL = process.env.API_BASE_URL ?? 'http://localhost:3001';

async function request(path, init = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(init.headers ?? {}),
    },
  });
  const payload = await response.json();

  if (!response.ok) {
    throw new Error(`${init.method ?? 'GET'} ${path} failed: ${payload.message ?? response.statusText}`);
  }

  return payload;
}

async function main() {
  console.log(`[smoke] API ${API_BASE_URL}`);

  await request('/playbooks/seed/reset', { method: 'POST' });
  console.log('[smoke] seeded playbooks');

  const pcap = await request('/pcap-demo/generate-alert/port-scan', { method: 'POST' });
  const alertId = pcap.data.rawAlert.alertId;
  console.log(`[smoke] raw alert ${alertId}`);

  const normalized = await request(`/normalized-alerts/from-raw/${alertId}?force=true`, {
    method: 'POST',
  });
  const normalizedAlertId = normalized.data.normalizedAlertId;
  console.log(`[smoke] normalized alert ${normalizedAlertId}`);

  const recommendation = await request(
    `/recommendations/from-normalized/${normalizedAlertId}?force=true&topK=3`,
    { method: 'POST' },
  );
  const recommendationId = recommendation.data.recommendationId;
  const topPlaybookIds = recommendation.data.topPlaybooks.map((item) => item.playbookId);

  if (!topPlaybookIds.includes('PB-002')) {
    throw new Error(`Expected PB-002 in Top-3, received ${topPlaybookIds.join(', ')}`);
  }

  await request(`/recommendations/${recommendationId}/select/PB-002`, { method: 'POST' });
  console.log(`[smoke] recommendation ${recommendationId} selected PB-002`);

  const explanation = await request(`/explanations/from-recommendation/${recommendationId}?force=true`, {
    method: 'POST',
  });
  console.log(`[smoke] explanation ${explanation.data.explanationId}`);

  const workflow = await request(`/workflows/from-recommendation/${recommendationId}?force=true&autoStart=true`, {
    method: 'POST',
  });
  const executionId = workflow.data.executionId;
  console.log(`[smoke] workflow ${executionId} status ${workflow.data.status}`);

  const approvals = await request(`/approvals?executionId=${executionId}&status=pending`);

  if (approvals.data.length > 0) {
    const approvalId = approvals.data[0].approvalId;
    await request(`/approvals/${approvalId}/approve`, {
      method: 'POST',
      body: JSON.stringify({
        decidedBy: 'smoke-test',
        decisionReason: 'Automated smoke test approval.',
      }),
    });
    console.log(`[smoke] approved ${approvalId}`);
  }

  const incidents = await request('/incidents');
  const incident = incidents.data.find((item) => item.executionId === executionId);

  if (!incident) {
    throw new Error(`No incident found for workflow ${executionId}`);
  }

  const reports = await request('/reports');
  const report = reports.data.find((item) => item.executionId === executionId);

  if (!report) {
    throw new Error(`No report found for workflow ${executionId}`);
  }

  await request('/dashboard/summary');
  await request('/evaluation/summary');
  await request(`/reports/${report.reportId}/export/markdown`);

  console.log(`[smoke] incident ${incident.incidentId}`);
  console.log(`[smoke] report ${report.reportId}`);
  console.log('[smoke] PASS');
}

main().catch((error) => {
  console.error('[smoke] FAIL');
  console.error(error);
  process.exit(1);
});
