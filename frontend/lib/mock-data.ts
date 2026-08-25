import { Contract, Obligation, RiskFlag } from "./types";

export const contracts: Contract[] = [
  {
    id: "c-1001",
    title: "Master Services Agreement",
    counterparty: "Nimbus Cloud Systems Inc.",
    status: "Active",
    jurisdiction: "Delaware, US",
    value: "$480,000 / yr",
    effectiveDate: "2024-01-15",
    expiryDate: "2027-01-14",
    owner: "A. Reyes",
    fileName: "MSA_Nimbus_2024.pdf",
    fileSizeKb: 812,
    tags: ["SaaS", "Infrastructure"],
    summary:
      "Three-year infrastructure hosting agreement covering compute, storage, and support SLAs, with auto-renewal and a 90-day termination-for-convenience window.",
    clauses: [
      { id: "cl-1", title: "Term & Renewal", page: 2, excerpt: "This Agreement shall commence on the Effective Date and continue for thirty-six (36) months..." },
      { id: "cl-2", title: "Limitation of Liability", page: 8, excerpt: "In no event shall either party's aggregate liability exceed the fees paid in the preceding twelve (12) months..." },
      { id: "cl-3", title: "Termination for Convenience", page: 11, excerpt: "Either party may terminate this Agreement for convenience upon ninety (90) days written notice..." },
      { id: "cl-4", title: "Payment Terms", page: 4, excerpt: "Customer shall pay all undisputed invoices within thirty (30) days of receipt..." },
      { id: "cl-5", title: "Auto-Renewal", page: 3, excerpt: "This Agreement will automatically renew for successive one (1) year terms unless either party provides notice..." },
    ],
  },
  {
    id: "c-1002",
    title: "Software License & Support Agreement",
    counterparty: "Vertex Analytics Ltd.",
    status: "Expiring",
    jurisdiction: "England & Wales",
    value: "£126,000 / yr",
    effectiveDate: "2023-09-01",
    expiryDate: "2026-09-30",
    owner: "M. Okafor",
    fileName: "Vertex_License_2023.pdf",
    fileSizeKb: 654,
    tags: ["Licensing", "Analytics"],
    summary:
      "Annual license for the Vertex BI platform with a narrow indemnification carve-out and an uncapped IP-infringement liability clause flagged for review.",
    clauses: [
      { id: "cl-1", title: "Grant of License", page: 1, excerpt: "Licensor grants a non-exclusive, non-transferable license to use the Software solely for internal business purposes..." },
      { id: "cl-2", title: "Indemnification", page: 6, excerpt: "Licensor's indemnification obligations shall not apply to claims arising from Customer's modification of the Software..." },
      { id: "cl-3", title: "Uncapped IP Liability", page: 7, excerpt: "Notwithstanding the limitation of liability set out in Section 9, liability for infringement of intellectual property rights shall be unlimited..." },
      { id: "cl-4", title: "Notice of Non-Renewal", page: 2, excerpt: "Customer must provide written notice of intent not to renew at least sixty (60) days prior to the Expiry Date..." },
    ],
  },
  {
    id: "c-1003",
    title: "Data Processing Agreement",
    counterparty: "Bluewave Payments (Nigeria) Ltd.",
    status: "Active",
    jurisdiction: "Nigeria",
    value: "N/A",
    effectiveDate: "2025-02-01",
    expiryDate: "2026-01-31",
    owner: "W. Agaba",
    fileName: "DPA_Bluewave_2025.pdf",
    fileSizeKb: 340,
    tags: ["Data Privacy", "NDPR"],
    summary:
      "Data processing addendum aligned to NDPR requirements, governing cross-border transfer of customer PII to a sub-processor.",
    clauses: [
      { id: "cl-1", title: "Scope of Processing", page: 1, excerpt: "Processor shall process Personal Data only on documented instructions from the Controller..." },
      { id: "cl-2", title: "Cross-Border Transfer", page: 3, excerpt: "Any transfer of Personal Data outside Nigeria shall be subject to Standard Contractual Clauses or an adequacy determination..." },
      { id: "cl-3", title: "Breach Notification", page: 4, excerpt: "Processor shall notify Controller without undue delay, and in any event within 72 hours, of becoming aware of a Personal Data Breach..." },
    ],
  },
  {
    id: "c-1004",
    title: "Office Lease Agreement",
    counterparty: "Marina Business Park LLC",
    status: "Terminated",
    jurisdiction: "Singapore",
    value: "S$18,500 / mo",
    effectiveDate: "2021-04-01",
    expiryDate: "2024-03-31",
    owner: "A. Reyes",
    fileName: "Lease_MarinaPark_2021.pdf",
    fileSizeKb: 1120,
    tags: ["Real Estate"],
    summary:
      "Three-year commercial lease for the Singapore regional office, terminated on schedule at the end of the initial term with no renewal exercised.",
    clauses: [
      { id: "cl-1", title: "Term", page: 1, excerpt: "The Term shall be three (3) years commencing on the Commencement Date..." },
      { id: "cl-2", title: "Security Deposit", page: 5, excerpt: "Tenant shall provide a security deposit equal to three (3) months' rent, refundable within thirty (30) days of vacating..." },
    ],
  },
  {
    id: "c-1005",
    title: "Reseller & Distribution Agreement",
    counterparty: "Alto Growth Partners",
    status: "Active",
    jurisdiction: "California, US",
    value: "$95,000 min. commitment",
    effectiveDate: "2025-06-01",
    expiryDate: "2026-05-31",
    owner: "M. Okafor",
    fileName: "Reseller_Alto_2025.pdf",
    fileSizeKb: 498,
    tags: ["Channel", "Sales"],
    summary:
      "One-year exclusive reseller agreement for the West Coast territory with a minimum annual purchase commitment and a broad non-compete.",
    clauses: [
      { id: "cl-1", title: "Exclusivity", page: 2, excerpt: "Company grants Reseller exclusive rights to distribute the Products within the Territory during the Term..." },
      { id: "cl-2", title: "Minimum Purchase Commitment", page: 3, excerpt: "Reseller shall purchase not less than $95,000 of Products in each contract year..." },
      { id: "cl-3", title: "Non-Compete", page: 9, excerpt: "Reseller shall not, during the Term and for twelve (12) months thereafter, market or distribute competing products..." },
      { id: "cl-4", title: "Auto-Renewal", page: 2, excerpt: "This Agreement renews automatically for successive twelve (12) month periods absent notice of non-renewal sixty (60) days prior..." },
    ],
  },
  {
    id: "c-1006",
    title: "Consulting Services Agreement",
    counterparty: "Halcyon Strategy Group",
    status: "Expiring",
    jurisdiction: "Ireland",
    value: "€72,000 total",
    effectiveDate: "2025-11-01",
    expiryDate: "2026-09-15",
    owner: "W. Agaba",
    fileName: "Consulting_Halcyon_2025.pdf",
    fileSizeKb: 276,
    tags: ["Professional Services"],
    summary:
      "Fixed-fee strategy consulting engagement nearing completion, with a milestone-based payment schedule and a 30-day post-termination IP assignment clause.",
    clauses: [
      { id: "cl-1", title: "Milestone Payments", page: 2, excerpt: "Client shall pay each Milestone Fee within fifteen (15) days of Consultant's delivery of the associated Deliverable..." },
      { id: "cl-2", title: "IP Assignment", page: 5, excerpt: "All Deliverables shall be assigned to Client upon full payment, provided that assignment occurs no later than thirty (30) days post-termination..." },
    ],
  },
];

export const obligations: Obligation[] = [
  { id: "ob-1", contractId: "c-1001", type: "Payment", title: "Q3 hosting invoice due", dueDate: "2026-09-05", amount: "$120,000", status: "Due Soon", clauseId: "cl-4" },
  { id: "ob-2", contractId: "c-1001", type: "Notice", title: "Non-renewal notice deadline", dueDate: "2026-10-16", status: "Upcoming", clauseId: "cl-5" },
  { id: "ob-3", contractId: "c-1002", type: "Expiry", title: "License term expires", dueDate: "2026-09-30", status: "Due Soon", clauseId: "cl-1" },
  { id: "ob-4", contractId: "c-1002", type: "Notice", title: "Notice of non-renewal window closes", dueDate: "2026-08-01", status: "Overdue", clauseId: "cl-4" },
  { id: "ob-5", contractId: "c-1003", type: "Compliance", title: "Annual NDPR audit attestation", dueDate: "2026-09-20", status: "Upcoming", clauseId: "cl-2" },
  { id: "ob-6", contractId: "c-1003", type: "Expiry", title: "DPA term expires", dueDate: "2026-01-31", status: "Completed" },
  { id: "ob-7", contractId: "c-1005", type: "Payment", title: "Minimum purchase true-up", dueDate: "2026-09-12", amount: "$95,000", status: "Due Soon", clauseId: "cl-2" },
  { id: "ob-8", contractId: "c-1005", type: "Renewal", title: "Auto-renewal decision point", dueDate: "2026-04-01", status: "Upcoming", clauseId: "cl-4" },
  { id: "ob-9", contractId: "c-1006", type: "Payment", title: "Final milestone payment", dueDate: "2026-08-28", amount: "€24,000", status: "Due Soon", clauseId: "cl-1" },
  { id: "ob-10", contractId: "c-1006", type: "Expiry", title: "Consulting engagement ends", dueDate: "2026-09-15", status: "Upcoming" },
  { id: "ob-11", contractId: "c-1004", type: "Payment", title: "Deposit refund follow-up", dueDate: "2024-04-30", status: "Completed", clauseId: "cl-2" },
];

export const riskFlags: RiskFlag[] = [
  {
    id: "rf-1",
    contractId: "c-1002",
    clauseId: "cl-3",
    severity: "High",
    category: "Liability",
    title: "Uncapped IP infringement liability",
    originalText:
      "Notwithstanding the limitation of liability set out in Section 9, liability for infringement of intellectual property rights shall be unlimited.",
    plainEnglish:
      "Normally your total damages are capped, but this clause carves out an exception: if there's an IP infringement claim, Vertex's liability has no ceiling at all. That's an open-ended financial exposure.",
    recommendation: "Negotiate a cap (e.g. 2x annual fees) on IP indemnity liability, or add a mutual carve-out.",
  },
  {
    id: "rf-2",
    contractId: "c-1002",
    clauseId: "cl-2",
    severity: "Medium",
    category: "Indemnification",
    title: "Narrow indemnification carve-out",
    originalText:
      "Licensor's indemnification obligations shall not apply to claims arising from Customer's modification of the Software.",
    plainEnglish:
      "If your team customizes or configures the software in ways Vertex considers a 'modification,' they can walk away from covering you if that leads to a lawsuit — even if the underlying issue was in their code.",
    recommendation: "Define 'modification' narrowly and exclude configuration/administration performed per Vertex's own documentation.",
  },
  {
    id: "rf-3",
    contractId: "c-1005",
    clauseId: "cl-3",
    severity: "High",
    category: "Restrictive Covenant",
    title: "Broad 12-month non-compete",
    originalText:
      "Reseller shall not, during the Term and for twelve (12) months thereafter, market or distribute competing products.",
    plainEnglish:
      "Even after this agreement ends, you're locked out of selling anything similar for a full year. If the relationship sours or the market shifts, that's a long time to be boxed in.",
    recommendation: "Narrow the definition of 'competing products' and/or shorten the tail period to 3–6 months.",
  },
  {
    id: "rf-4",
    contractId: "c-1005",
    clauseId: "cl-2",
    severity: "Medium",
    category: "Commercial",
    title: "Minimum purchase commitment with no adjustment mechanism",
    originalText: "Reseller shall purchase not less than $95,000 of Products in each contract year.",
    plainEnglish:
      "You're on the hook for a fixed minimum spend every year regardless of demand, and there's no clause letting you renegotiate the number if the market changes.",
    recommendation: "Add a volume step-down mechanism tied to demand or a force majeure-style adjustment right.",
  },
  {
    id: "rf-5",
    contractId: "c-1001",
    clauseId: "cl-5",
    severity: "Low",
    category: "Renewal",
    title: "Silent auto-renewal",
    originalText:
      "This Agreement will automatically renew for successive one (1) year terms unless either party provides notice.",
    plainEnglish:
      "If nobody remembers to send a notice in time, you're automatically locked in for another full year. It's easy to miss this deadline if it isn't tracked.",
    recommendation: "Set a calendar reminder 120 days before the notice deadline; consider negotiating a shorter renewal term.",
  },
  {
    id: "rf-6",
    contractId: "c-1006",
    clauseId: "cl-2",
    severity: "Low",
    category: "IP Assignment",
    title: "IP assignment tied to payment timing",
    originalText:
      "All Deliverables shall be assigned to Client upon full payment, provided that assignment occurs no later than thirty (30) days post-termination.",
    plainEnglish:
      "You don't actually own the work product until you've paid in full — and there's a hard 30-day cutoff after termination, so a payment dispute could delay you getting rights to your own deliverables.",
    recommendation: "Confirm final milestone payment is processed promptly to avoid any gap in IP ownership.",
  },
  {
    id: "rf-7",
    contractId: "c-1003",
    clauseId: "cl-2",
    severity: "Medium",
    category: "Data Privacy",
    title: "Cross-border transfer dependent on adequacy determination",
    originalText:
      "Any transfer of Personal Data outside Nigeria shall be subject to Standard Contractual Clauses or an adequacy determination.",
    plainEnglish:
      "This only works smoothly if a formal adequacy finding or signed SCCs are actually in place. If that paperwork lapses or was never finalized, cross-border transfers could technically be non-compliant.",
    recommendation: "Confirm current SCC execution status with the sub-processor and calendar a periodic compliance check.",
  },
];

export function getContract(id: string) {
  return contracts.find((c) => c.id === id);
}

export function getObligationsForContract(id: string) {
  return obligations.filter((o) => o.contractId === id);
}

export function getRiskFlagsForContract(id: string) {
  return riskFlags.filter((r) => r.contractId === id);
}
