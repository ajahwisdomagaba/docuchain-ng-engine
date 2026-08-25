// src/schemas/redline.schema.ts
import { z } from 'zod';

export const RecommendationSchema = z.object({
  fieldPath: z.string(),
  legalViolation: z.string(),
  originalIntent: z.string(),
  statutoryReference: z.string(),
  proposedRedlineClause: z.string(),
  redlineRationale: z.string(),
});

export const RedlineReportSchema = z.object({
  summary: z.string(),
  overallRiskLevel: z.enum(['Low', 'Medium', 'High', 'Critical']),
  recommendations: z.array(RecommendationSchema),
});

export type Recommendation = z.infer<typeof RecommendationSchema>;
export type RedlineReport = z.infer<typeof RedlineReportSchema>;