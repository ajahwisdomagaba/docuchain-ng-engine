import dotenv from 'dotenv';
import { supabase } from '../lib/supabase';
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
  keyDates: {
    effectiveDate: string;
    expirationDate: string;
  };
  executiveSummary: string;
  riskFlags: AuditRiskFlag[];
}

export interface PlaybookConfig {
  playbookName?: string;
  mandatoryClauses?: string[];
  forbiddenTerms?: string[];
  preferredJurisdiction?: string;
  customInstructions?: string;
  minNoticePeriodDays?: number;
}

// Fetch active playbook from Supabase based on workspaceId, clientId, and category
export async function getActivePlaybook(
  category: string,
  clientId?: string | null,
  workspaceId?: string | null
): Promise<PlaybookConfig | null> {
  try {
    let query = supabase
      .from('ai_playbooks')
      .select('*')
      .eq('is_active', true);

    if (category) {
      query = query.or(`category.eq.${category.toUpperCase()},category.eq.GENERAL`);
    }

    if (clientId) {
      query = query.or(`client_id.eq.${clientId},client_id.is.null`);
    }

    if (workspaceId) {
      query = query.eq('workspace_id', workspaceId);
    }

    const { data, error } = await query.order('client_id', { ascending: false, nullsFirst: false }).limit(1);

    if (error || !data || data.length === 0) {
      return null;
    }

    const pb = data[0];
    return {
      playbookName: pb.playbook_name,
      mandatoryClauses: pb.mandatory_clauses || [],
      forbiddenTerms: pb.forbidden_terms || [],
      preferredJurisdiction: pb.preferred_jurisdiction || 'Laws of the Federal Republic of Nigeria',
      customInstructions: pb.custom_instructions || '',
      minNoticePeriodDays: pb.min_notice_period_days || 180,
    };
  } catch (err: any) {
    console.warn('Could not fetch active playbook:', err.message);
    return null;
  }
}

export async function auditCommercialContract(
  rawContractText: string,
  specifiedCategory?: string,
  playbook?: PlaybookConfig | null
): Promise<StatutoryAuditResult> {
  // Build dynamic playbook enforcement instructions
  let playbookPromptSection = '';
  if (playbook) {
    playbookPromptSection = `
=== LAW FIRM CUSTOM AI PLAYBOOK ENFORCEMENT ===
Active Playbook: "${playbook.playbookName || 'Firm Custom Policy'}"

1. MANDATORY REQUIRED CLAUSES:
The law firm strictly requires the following clauses or standards to be present. If any of these are missing or inadequate, flag a HIGH RISK violation stating "Missing Mandatory Playbook Clause":
${playbook.mandatoryClauses && playbook.mandatoryClauses.length > 0 
  ? playbook.mandatoryClauses.map((c, i) => `   - ${c}`).join('\n') 
  : '   - Standard statutory Nigerian compliance'}

2. FORBIDDEN / HIGH-RISK TERMS:
The law firm strictly prohibits or treats as high-risk the following language or terms. If detected, flag a HIGH RISK violation and provide compliant redline:
${playbook.forbiddenTerms && playbook.forbiddenTerms.length > 0 
  ? playbook.forbiddenTerms.map((t, i) => `   - ${t}`).join('\n') 
  : '   - None specified'}

3. PREFERRED JURISDICTION & GOVERNING LAW:
${playbook.preferredJurisdiction || 'Laws of the Federal Republic of Nigeria'}

4. SPECIAL FIRM INSTRUCTIONS:
${playbook.customInstructions || 'Enforce statutory standards strictly without commercial waiver.'}
================================================
`;
  }

  const systemPrompt = `
You are DocuChain NG Contract AI Assistant, an authoritative Nigerian legal intelligence co-pilot.
Your task is to maintain a continuous, conversational legal dialogue regarding the provided contract.

APPLY THE CURRENT LAWS OF THE FEDERAL REPUBLIC OF NIGERIA:

* Constitution of the Federal Republic of Nigeria (as amended).
* Companies and Allied Matters Act (CAMA) 2020.
* Labour Act (Cap L1 LFN 2004).
* National Minimum Wage Act using the current statutory minimum wage.
* Arbitration and Mediation Act 2023.
* Nigeria Data Protection Act (NDPA) 2023.
* Evidence Act.
* Land Use Act.
* Applicable tax legislation.
* Applicable State laws where relevant (e.g. tenancy, property and landlord-tenant matters). Do not assume Lagos State law unless the contract or user specifies Lagos or another State.

INSTRUCTIONS:

1. Apply the current laws of the Federal Republic of Nigeria without mentioning knowledge cutoffs or update dates.
2. Maintain conversation context and treat follow-up questions as referring to the same contract unless the user provides another contract.
3. Base every answer primarily on the contract provided, using Nigerian law only to interpret, explain or assess its legal effect.
4. Explain the relevant contract clause in plain English before giving legal analysis.
5. Identify whether the clause is legally compliant, commercially reasonable, ambiguous, unenforceable, inconsistent with Nigerian law or presents legal risk.
6. If the contract is silent on the issue raised, clearly state that the contract does not address it and explain the default legal position under Nigerian law.
7. If answering depends on missing facts (such as governing State, employment status, corporate status, property location or governing law), clearly state the assumption before applying the law.
8. Never invent facts, contract clauses, clause numbers or statutory provisions. If the information cannot be determined from the contract, clearly say so.
9. Where appropriate, cite the relevant contract clause together with the applicable Nigerian statute and section.
10. Keep responses concise, practical, authoritative and easy for non-lawyers to understand.

${playbookPromptSection}

Return a strictly valid JSON object matching this schema:
{
  "overallScore": number (0-100 compliance rating),
  "category": "TENANCY" | "NDA" | "VENDOR_SERVICE" | "EMPLOYMENT" | "COMMERCIAL",
  "counterparty": string (extracted entity name),
  "governingLaw": string (e.g. "Laws of the Federal Republic of Nigeria"),
  "keyDates": {
    "effectiveDate": "YYYY-MM-DD",
    "expirationDate": "YYYY-MM-DD"
  },
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
Note on keyDates:
- Return valid ISO date strings in YYYY-MM-DD format (e.g., "2026-09-01").
- If a date is not specified in the contract, compute an appropriate default (e.g., 1 year from effective date for yearly tenancies).

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