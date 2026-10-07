import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';
import { generateContractAnalysis } from '@/lib/aiClient';

const DRAFTER_SYSTEM_PROMPT = `
You are the Lead Nigerian Legal Drafting Counsel for DocuChain.NG.

Your task is to draft legally enforceable, comprehensive, professionally structured contracts that comply with the current laws of the Federal Republic of Nigeria.

APPLY THE CURRENT LAWS OF THE FEDERAL REPUBLIC OF NIGERIA:
- Constitution of the Federal Republic of Nigeria (as amended).
- Companies and Allied Matters Act (CAMA) 2020.
- Labour Act (Cap L1 LFN 2004).
- National Minimum Wage Act using the current statutory minimum wage.
- Arbitration and Mediation Act 2023.
- Nigeria Data Protection Act (NDPA) 2023.
- Evidence Act.
- Land Use Act.
- Applicable tax legislation.
- Applicable State laws where relevant (e.g. tenancy, property and landlord-tenant matters). Do not assume Lagos State law unless the user specifies Lagos or another State.

INSTRUCTIONS:
1. Draft contracts that are legally enforceable, commercially balanced and written in clear professional legal language.
2. Include all essential clauses appropriate for the requested contract type, even if the user does not expressly request them.
3. Ensure all statutory requirements under applicable Nigerian law are reflected.
4. Do not include clauses that conflict with Nigerian law or public policy.
5. Where statutory requirements depend on the State, governing law, employment status, corporate status or other missing facts, make reasonable assumptions and state them in the compliance notes.
6. Where appropriate, include provisions covering definitions, obligations, payment terms, confidentiality, intellectual property, representations and warranties, indemnity, limitation of liability, force majeure, termination, dispute resolution, notices, governing law, severability, entire agreement and execution.
7. Use the current statutory requirements without mentioning knowledge cutoffs or update dates.
8. Do not invent facts supplied by the parties. Where necessary, use clearly identifiable placeholders.
9. Format the contract professionally using Markdown headings, numbered clauses and sub-clauses.
10. Keep contract_markdown under 700 words so the draft returns quickly.

Return a strictly valid JSON object matching this schema:
{
  "contract_title": "string",
  "governing_law": "string",
  "contract_markdown": "string",
  "statutory_notice_periods": ["string"],
  "compliance_notes": ["string"]
}

Return ONLY the raw JSON object. Do not include markdown code blocks, explanations or additional text.
`;

function buildLocalDraft(input: {
  templateType: string;
  partyA: string;
  partyB: string;
  consideration: string;
  jurisdiction: string;
}) {
  const { templateType, partyA, partyB, consideration, jurisdiction } = input;
  const markdown = `# ${templateType}

This agreement is made between **${partyA}** ("First Party") and **${partyB}** ("Second Party").

1. **Consideration.** The contract sum is NGN ${consideration}.
2. **Governing law.** This agreement is governed by the laws of ${jurisdiction}.
3. **Tenancy cap.** Where this is a yearly tenancy in Lagos, advance rent shall not exceed one year (Lagos State Tenancy Law 2011, Section 4) and notice to quit shall be at least six months (Section 13).
4. **Employment floor.** Where this is an employment contract, pay shall not fall below the current national minimum wage.
5. **Data.** Personal data is processed under the Nigeria Data Protection Act 2023.
6. **Disputes.** Disputes are resolved under the Arbitration and Mediation Act 2023, seated in Nigeria.
7. **Execution.** This agreement may be signed electronically under CAMA 2020.
`;

  return {
    contract_title: `${templateType} — ${partyA} & ${partyB}`,
    governing_law: jurisdiction,
    contract_markdown: markdown,
    statutory_notice_periods: ['Six months for a yearly Lagos tenancy (Section 13)'],
    compliance_notes: ['Local statutory template returned because the model did not answer in time.'],
  };
}

function extractValidJson(raw: string): any {
  const firstBrace = raw.indexOf('{');
  const lastBrace = raw.lastIndexOf('}');

  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    return JSON.parse(raw.substring(firstBrace, lastBrace + 1));
  }

  return JSON.parse(raw.replace(/```json/gi, '').replace(/```/g, '').trim());
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const templateType = body.templateType || body.category || 'Residential Tenancy / Lease';
    const customInstructions = body.customInstructions || body.customClauses || '';
    const jurisdiction = body.jurisdiction || 'Lagos State, Federal Republic of Nigeria';
    
    const partyA = body.partyA || body.parties?.landlord || body.parties?.firstParty || 'First Party Entity';
    const partyB = body.partyB || body.parties?.tenant || body.parties?.secondParty || 'Second Party Entity';
    const consideration = body.consideration || body.parties?.annualRent || '0.00';

    const userPrompt = `
Contract Category: ${templateType}
First Party: ${partyA}
Second Party: ${partyB}
Contract Consideration/Amount: NGN ${consideration}
Governing Jurisdiction: ${jurisdiction}
${customInstructions ? `Special Instructions / Custom Terms:\n${customInstructions}` : 'Standard Nigerian statutory covenants apply.'}
`;

    let parsedData: any;
    try {
      const rawContent = await generateContractAnalysis({
        systemPrompt: DRAFTER_SYSTEM_PROMPT,
        userPrompt,
        temperature: 0.2,
        jsonMode: true,
        timeoutMs: 2500,
        maxTokens: 700,
      });
      parsedData = extractValidJson(rawContent);
    } catch (aiErr: any) {
      console.warn('Drafter using local statutory template:', aiErr.message);
      parsedData = buildLocalDraft({
        templateType,
        partyA,
        partyB,
        consideration,
        jurisdiction,
      });
    }

    const generatedContractText = parsedData.contract_markdown || '';
    const contractTitle = parsedData.contract_title || `${templateType} - ${partyA} & ${partyB}`;

    void supabase
      .from('contracts')
      .insert({
        title: contractTitle,
        contract_type: templateType,
        counterparty: partyB !== 'Second Party Entity' ? partyB : partyA,
        status: 'Draft',
        risk_score: 5,
        metadata: {
          rawDraft: generatedContractText,
          extractedText: generatedContractText,
          rawText: generatedContractText,
          governingLaw: parsedData.governing_law || jurisdiction,
          category: templateType,
          counterparty: partyB !== 'Second Party Entity' ? partyB : partyA,
          statutory_notice_periods: parsedData.statutory_notice_periods || [],
          compliance_notes: parsedData.compliance_notes || [],
        },
      })
      .then(({ error }) => {
        if (error) console.warn('Supabase insert warning:', error.message);
      });

    return NextResponse.json({
      success: true,
      draft: generatedContractText,
      data: parsedData,
    });
  } catch (err: any) {
    console.error('Drafter route error:', err.message || err);
    return NextResponse.json({ error: err.message || 'Drafting failed' }, { status: 500 });
  }
}