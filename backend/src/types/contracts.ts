export type ContractCategory = 
  | 'TENANCY' 
  | 'NDA' 
  | 'VENDOR_SERVICE' 
  | 'EMPLOYMENT';

export interface AuditRiskFlag {
  clauseTitle: string;
  originalText: string;
  riskLevel: 'HIGH' | 'MEDIUM' | 'LOW' | 'COMPLIANT';
  issueSummary: string;
  legalBasis: string; // Statutory citation or standard commercial practice
  recommendedRedline: string;
  plainEnglishExplanation: string;
}

export interface CommercialAuditResult {
  contractCategory: ContractCategory;
  overallScore: number; // 0 to 100
  governingLaw: string;
  parties: {
    disclosingOrClient?: string;
    receivingOrVendor?: string;
  };
  keyDates: {
    effectiveDate?: string;
    expirationDate?: string;
    renewalTerms?: string;
  };
  riskFlags: AuditRiskFlag[];
  executiveSummary: string;
}