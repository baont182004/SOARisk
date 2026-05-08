# Codex Prompt: Implement SOARisk Structured Playbooks, Scoring Model and Evaluation Dataset

You are working in the SOARisk repository. Implement the enhancement package below without expanding the project into a full IDS/SIEM.

## Objective

Upgrade SOARisk from a demo-only Top-3 recommendation module to an explainable, evaluation-ready playbook recommendation system.

## Files available in this package

- `playbooks.v2.seed.json`: seed 30 structured playbooks.
- `scoring_model.v1.json`: model weights, penalties, thresholds and explanation template.
- `evaluation_cases.v1.json`: 75 evaluation cases.

## Implementation rules

1. Preserve the current end-to-end flow: raw alert -> normalized alert -> Top-3 playbook recommendation -> explanation -> analyst approval -> simulated workflow execution -> incident/report/dashboard.
2. Do not add real IDS, Suricata/Snort integration, packet parser expansion or live SIEM dependency.
3. Make scoring deterministic and explainable.
4. All high/critical approval-risk actions must require analyst approval.
5. Recommendation API must return rank, score, confidence band, breakdown, missing required fields, approval risk, automation suitability and explanation.
6. Evaluation API must compare baseline vs proposed scoring.

## Suggested implementation structure

```text
backend/src/playbooks/playbook.types.ts
backend/src/playbooks/playbook.seed.v2.ts
backend/src/recommendation/scoring-config.ts
backend/src/recommendation/scoring.service.ts
backend/src/recommendation/explanation.service.ts
backend/src/evaluation/evaluation-cases.seed.ts
backend/src/evaluation/evaluation.service.ts
backend/src/evaluation/baseline.service.ts
backend/src/evaluation/evaluation.controller.ts
frontend/src/features/recommendation/ScoreBreakdownCard.tsx
frontend/src/features/evaluation/EvaluationDashboard.tsx
docs/recommendation-methodology.md
```

## Scoring formula

```text
score = 100 * sum(weight_i * component_i) - 100 * sum(penalty_j)
score = clamp(score, 0, 100)
```

Use the weights and penalties from `scoring_model.v1.json`.

## Metrics to implement

- Top-1 Accuracy.
- Top-3 Accuracy.
- Mean Reciprocal Rank.
- Confusion pairs.
- Ambiguity rate where Top-1 and Top-2 score gap < 5.
- Baseline vs proposed comparison.

## Expected UI behavior

On each alert detail page, show Top-3 recommendation cards with score breakdown. On dashboard/evaluation page, show baseline Top-1/Top-3 vs proposed Top-1/Top-3, plus mismatch examples.

## Acceptance tests

- 30 playbooks load successfully.
- 75 evaluation cases load successfully.
- Recommendation returns exactly Top-3 when at least 3 playbooks exceed threshold.
- Score breakdown includes all criteria from the scoring model.
- Evaluation service computes Top-1 and Top-3 correctly.
- High/critical playbooks require analyst approval before disruptive workflow actions.
- Smoke test and demo wizard still pass.
