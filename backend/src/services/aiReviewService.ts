import dotenv from 'dotenv';
dotenv.config();

const QOREBIT_API_KEY = process.env.QOREBIT_API_KEY || 'qb_live_vI39k_W01kgXXVbFLZa-9vRxAAtfOs-biA68fND2GgQ';

export interface AuditRiskFlag {
  id?: string;
  clauseTitle: string;
  badgeLabel: string;
  riskLevel: 'HIGH' | 'MEDIUM' | 'LOW' | 'COMPLIANT';
  originalText: string;
  recommendedRedline: string;
  legalBasis: string;
  plainEnglishExplanation: string;
}

export interface StatutoryAuditResult {
  overallScore: number;
  category: 'TENANCY' | 'NDA' | 'VENDOR_SERVICE' | 'EMPLOYMENT' | 'COMMERCIAL';
  counterparty: string;
  governingLaw: string;
  effectiveDate: string;
  expirationDate: string;
  executiveSummary: string;
  riskFlags: AuditRiskFlag[];
}

export async function auditCommercialContract(
  rawContractText: string,
  specifiedCategory?: string
): Promise<StatutoryAuditResult> {
  const systemPrompt = `
You are the DocuChain NG Statutory Legal Engine, an expert Nigerian corporate and commercial legal auditor.
Analyze the provided contract text against Nigerian statutory benchmarks:
- Nigerian Labour Act (Cap L1 LFN 2004) & National Minimum Wage Act 2024
- Lagos State Tenancy Law 2011 / Recovery of Premises Laws
- Companies and Allied Matters Act (CAMA) 2020
- Arbitration and Mediation Act 2023 (repealing ACA 1988)
- NDPR 2019 / Nigeria Data Protection Act 2023
- Withholding Tax Regulations 2024 & FIRS requirements

Return a strictly valid JSON object matching this schema:
{
  "overallScore": number (0-100 compliance rating),
  "category": "TENANCY" | "NDA" | "VENDOR_SERVICE" | "EMPLOYMENT" | "COMMERCIAL",
  "counterparty": string (extracted entity name),
  "governingLaw": string (e.g. "Laws of the Federal Republic of Nigeria"),
  "effectiveDate": string (DD/MM/YYYY or "Pending Execution"),
  "expirationDate": string (DD/MM/YYYY or "Pending Execution"),
  "executiveSummary": string,
  "riskFlags": [
    {
      "clauseTitle": string,
      "badgeLabel": string,
      "riskLevel": "HIGH" | "MEDIUM" | "LOW",
      "originalText": string,
      "recommendedRedline": string,
      "legalBasis": string,
      "plainEnglishExplanation": string
    }
  ]
}
Return ONLY the raw JSON object without markdown fences, codeblocks, or extra text.
`;

  try {
    const response = await fetch('https://api.qorebit.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${QOREBIT_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          {
            role: 'user',
            content: `Contract Category Hint: ${specifiedCategory || 'Auto-Detect'}\n\nContract Text:\n${rawContractText.slice(0, 35000)}`,
          },
        ],
        temperature: 0.1,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Qorebit AI Request Failed (${response.status}): ${errText}`);
    }

const data: any = await response.json();
let content: string = data.choices?.[0]?.message?.content || '{}';

    // Clean potential markdown wrap
    content = content.trim();
    if (content.startsWith('```json')) {
      content = content.replace(/^```json/, '').replace(/```$/, '').trim();
    } else if (content.startsWith('```')) {
      content = content.replace(/^```/, '').replace(/```$/, '').trim();
    }

    const parsed: StatutoryAuditResult = JSON.parse(content);
    return parsed;
  } catch (error: any) {
    console.error('Error in Qorebit statutory audit service:', error.message);
    throw error;
  }
}