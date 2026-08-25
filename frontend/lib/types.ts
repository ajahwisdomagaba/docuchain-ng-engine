export type ContractStatus = "Active" | "Expiring" | "Terminated" | "Draft";

export type Jurisdiction =
  | "Delaware, US"
  | "England & Wales"
  | "Singapore"
  | "Nigeria"
  | "California, US"
  | "Ireland";

export type RiskSeverity = "High" | "Medium" | "Low";

export interface ClauseRef {
  id: string;
  title: string;
  page: number;
  excerpt: string;
}

export interface RiskFlag {
  id: string;
  contractId: string;
  clauseId: string;
  severity: RiskSeverity;
  category: string;
  title: string;
  originalText: string;
  plainEnglish: string;
  recommendation: string;
}

export interface Obligation {
  id: string;
  contractId: string;
  type: "Payment" | "Expiry" | "Notice" | "Renewal" | "Compliance";
  title: string;
  dueDate: string;
  amount?: string;
  status: "Upcoming" | "Due Soon" | "Overdue" | "Completed";
  clauseId?: string;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  citedClauseIds?: string[];
}

export interface Contract {
  id: string;
  title: string;
  counterparty: string;
  status: ContractStatus;
  jurisdiction: Jurisdiction;
  value: string;
  effectiveDate: string;
  expiryDate: string;
  owner: string;
  fileName: string;
  fileSizeKb: number;
  tags: string[];
  summary: string;
  clauses: ClauseRef[];
}
