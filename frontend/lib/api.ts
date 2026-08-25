const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

export interface AuditRecommendation {
  statutoryReference: string;
  fieldPath: string;
  legalViolation: string;
  proposedRedlineClause: string;
  redlineRationale: string;
}

export interface ReviewResult {
  success: boolean;
  contractId: string;
  extractedData: {
    documentTitle: string;
    parties: Array<{ name: string; role: string }>;
    propertyLocationState: string;
    isExemptArea: boolean;
    tenancyType: string;
    effectiveDate: string;
    expiryDate: string;
    tenureDurationMonths: number;
    jurisdiction: string;
    paymentTerms: {
      amount: number;
      frequency: string;
      advanceRentMonthsDemanded: number;
    };
    renewalType: string;
    noticePeriodDays: number;
    covenants: {
      sublettingAllowed: boolean;
      repairObligation: string;
    };
  };
  complianceIssues: Array<{ path: string; message: string }>;
  redlineReport: {
    overallRiskLevel: 'Low' | 'Medium' | 'High';
    recommendations: AuditRecommendation[];
  };
}

export async function reviewContract(documentText: string): Promise<ReviewResult> {
  const response = await fetch(`${BACKEND_URL}/api/review`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ documentText }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `HTTP error: ${response.status}`);
  }

  return response.json();
}