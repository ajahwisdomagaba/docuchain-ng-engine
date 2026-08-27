import { NextRequest, NextResponse } from 'next/server';
import { generateContractAnalysis } from '@/lib/aiClient';

const DRAFTER_SYSTEM_PROMPT = `
You are the Lead Nigerian Legal Drafting Counsel for DocuChain.NG.
Generate legally enforceable, comprehensive contracts strictly adhering to Nigerian statutory standards:
- CAMA 2020 (Corporate terms, execution requirements, common seal provisions)
- Lagos State Tenancy Law 2011 / State Tenancy Laws (Notice to quit, statutory periods, tenant covenants)
- Nigerian Labour Act (Cap L1 LFN 2004)
- NDPA 2023 (Data protection and processor obligations)
- Arbitration and Mediation Act 2023 (Dispute escalation and arbitration)

Return a strictly valid JSON response in the following schema:
{
  "contract_title": "string",
  "governing_law": "string",
  "contract_markdown": "string",
  "statutory_notice_periods": ["string"],
  "compliance_notes": ["string"]
}
`;

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

    const templateType = body.templateType || 'General Commercial Agreement';
    const isCustom = Boolean(body.isCustom);
    const customInstructions = body.customInstructions || body.customClauses || '';
    const jurisdiction = body.jurisdiction || 'Lagos State, Federal Republic of Nigeria';
    
    // Normalize parties structure whether sent as strings or nested objects
    const partyA = body.partyA || body.parties?.landlord || body.parties?.firstParty || '[First Party]';
    const partyB = body.partyB || body.parties?.tenant || body.parties?.secondParty || '[Second Party]';
    const consideration = body.consideration || body.parties?.annualRent || '0.00';

    const userPrompt = `
Contract Category/Type: ${templateType}
First Party: ${partyA}
Second Party: ${partyB}
Contract Consideration/Amount: ₦${consideration}
Governing Jurisdiction: ${jurisdiction}
${isCustom || customInstructions ? `Special Instructions / Custom Terms:\n${customInstructions}` : 'Standard Nigerian statutory covenants apply.'}
`;

    const rawOutput = await generateContractAnalysis({
      systemPrompt: DRAFTER_SYSTEM_PROMPT,
      userPrompt,
      temperature: 0.2,
      jsonMode: true,
    });

    const parsedData = extractValidJson(rawOutput);

    return NextResponse.json({
      success: true,
      draft: parsedData.contract_markdown || parsedData,
      data: parsedData,
    });
  } catch (err: any) {
    console.error('Drafter route error:', err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}