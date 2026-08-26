import Groq from 'groq-sdk';

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

export interface AuditRiskFlag {
  clauseTitle: string;
  originalText: string;
  riskLevel: 'HIGH' | 'MEDIUM' | 'LOW' | 'COMPLIANT';
  issueSummary: string;
  legalBasis: string;
  recommendedRedline: string;
  plainEnglishExplanation: string;
}

export interface CommercialAuditResult {
  contractCategory: 'TENANCY' | 'NDA' | 'VENDOR_SERVICE' | 'EMPLOYMENT';
  overallScore: number;
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

export async function auditCommercialContract(
  rawContractText: string,
  specifiedCategory?: string
): Promise<CommercialAuditResult> {
  const systemPrompt = `
You are the Lead Nigerian Commercial & Legal Compliance Engine for DocuChain NG.
You analyze legal agreements under standard Nigerian legal frameworks, including:
- Companies and Allied Matters Act (CAMA) 2020
- Nigerian Labour Act
- Lagos State Tenancy Law 2011
- Nigerian Contract Common Law Principles

Evaluate the contract text against these strict domain rules:

1. NON-DISCLOSURE AGREEMENTS (NDAs):
   - Perpetual Confidentiality: Flag non-standard perpetual terms (>2-5 years standard in Nigeria unless legitimate trade secret).
   - Restraint of Trade: Flag aggressive non-compete or non-solicitation clauses that violate Nigerian public policy.
   - Jurisdiction: Flag foreign arbitration/governing law for purely domestic Nigerian operations.

2. VENDOR & SERVICE LEVEL AGREEMENTS (SLAs / Service Contracts):
   - Liability & Indemnification: Flag unlimited liability, lack of mutual caps, or disproportionate indemnity clauses.
   - Payment Terms & Taxes: Check for ambiguous milestone deliverables, unilateral price hike terms, and Withholding Tax (WHT) / VAT allocation clarity.
   - Termination: Flag one-sided termination without notice or lack of payment for completed milestones.

3. TENANCY AGREEMENTS:
   - Lagos State Tenancy Law 2011 (Section 4): Flag advance rent demands exceeding statutory maximums (maximum 1 year for yearly tenants, 6 months for monthly tenants).
   - Lagos State Tenancy Law 2011 (Section 13): Flag deficient statutory notices (minimum 6 months for yearly tenancies, 1 month for monthly tenancies).

4. EMPLOYMENT CONTRACTS:
   - Labour Act Compliance: Flag unfair termination terms, non-compliant leave/severance allowances, and overly restrictive post-employment covenants.

You MUST return ONLY a valid JSON object matching this schema:
{
  "contractCategory": "TENANCY" | "NDA" | "VENDOR_SERVICE" | "EMPLOYMENT",
  "overallScore": number (0-100, where 100 is fully compliant/low risk),
  "governingLaw": string,
  "parties": {
    "disclosingOrClient": string,
    "receivingOrVendor": string
  },
  "keyDates": {
    "effectiveDate": string,
    "expirationDate": string,
    "renewalTerms": string
  },
  "riskFlags": [
    {
      "clauseTitle": string,
      "originalText": string,
      "riskLevel": "HIGH" | "MEDIUM" | "LOW" | "COMPLIANT",
      "issueSummary": string,
      "legalBasis": string,
      "recommendedRedline": string,
      "plainEnglishExplanation": string
    }
  ],
  "executiveSummary": string
}
`;

  try {
    const completion = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [
        { role: 'system', content: systemPrompt },
        {
          role: 'user',
          content: `Contract Category Hint: ${specifiedCategory || 'Auto-Detect'}\n\nContract Text:\n${rawContractText}`,
        },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.1,
    });

    const content = completion.choices[0]?.message?.content || '{}';
    return JSON.parse(content) as CommercialAuditResult;
  } catch (error) {
    console.error('Groq AI Contract Audit Error:', error);
    throw new Error('Failed to analyze contract through AI engine.');
  }
}