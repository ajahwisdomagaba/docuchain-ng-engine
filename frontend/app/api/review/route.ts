import { NextRequest, NextResponse } from 'next/server';
import { generateContractAnalysis } from '@/lib/aiClient';
import { NIGERIAN_STATUTORY_AUDITOR_PROMPT } from '@/lib/prompts/nigerianLawAuditor';

export async function POST(req: NextRequest) {
  try {
    const { contractText } = await req.json();

    if (!contractText || contractText.trim().length === 0) {
      return NextResponse.json({ error: 'Contract text is required' }, { status: 400 });
    }

    const rawResponse = await generateContractAnalysis({
      systemPrompt: NIGERIAN_STATUTORY_AUDITOR_PROMPT,
      userPrompt: contractText,
      temperature: 0.1,
      jsonMode: true,
    });

    const cleanJson = rawResponse.replace(/```json|```/g, '').trim();
    const result = JSON.parse(cleanJson);

    return NextResponse.json({ success: true, audit: result });
  } catch (err: any) {
    console.error('Review studio error:', err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}