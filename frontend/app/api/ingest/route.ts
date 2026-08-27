import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { generateContractAnalysis } from '@/lib/aiClient';
import { NIGERIAN_STATUTORY_AUDITOR_PROMPT } from '@/lib/prompts/nigerianLawAuditor';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export function extractValidJson(raw: string): any {
  const firstBrace = raw.indexOf('{');
  const lastBrace = raw.lastIndexOf('}');

  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    const jsonSubstring = raw.substring(firstBrace, lastBrace + 1);
    return JSON.parse(jsonSubstring);
  }

  // Fallback cleanup
  return JSON.parse(raw.replace(/```json/gi, '').replace(/```/g, '').trim());
}

export async function POST(req: NextRequest) {
  try {
    const { 
      contractId, 
      extractedText, 
      title, 
      counterparty, 
      userId, 
      clientWorkspaceId 
    } = await req.json();

    if (!extractedText || extractedText.trim().length === 0) {
      return NextResponse.json({ error: 'Extracted contract text is empty' }, { status: 400 });
    }

    // 1. Run Nigerian Statutory Analysis via Qorebit AI
    const rawAiOutput = await generateContractAnalysis({
      systemPrompt: NIGERIAN_STATUTORY_AUDITOR_PROMPT,
      userPrompt: extractedText,
      temperature: 0.1,
      jsonMode: true,
    });

    // 2. Safely parse JSON bounded between { and }
    let auditData: any = {};
    try {
      auditData = extractValidJson(rawAiOutput);
    } catch (parseErr) {
      console.warn('AI Output JSON Parse Error. Raw Output:', rawAiOutput);
      auditData = {
        compliance_score: 75,
        contract_type: 'General Commercial Agreement',
        governing_statutes_identified: ['CAMA 2020'],
        summary: rawAiOutput.slice(0, 300),
        critical_risks: [],
        statutory_obligations: [],
      };
    }

    const calculatedRiskScore = Math.max(0, 100 - (auditData.compliance_score || 80));

    // 3. Update or Insert Contract Record in Supabase
    let finalContractId = contractId;

    if (contractId) {
      const { error: updateError } = await supabaseAdmin
        .from('contracts')
        .update({
          risk_score: calculatedRiskScore,
          risk_flags: auditData.critical_risks || [],
          domain_category: auditData.contract_type || 'Commercial',
          client_workspace_id: clientWorkspaceId || null,
          metadata: {
            governing_statutes: auditData.governing_statutes_identified || [],
            summary: auditData.summary || '',
          },
          status: 'ANALYZED',
          updated_at: new Date().toISOString(),
        })
        .eq('id', contractId);

      if (updateError) throw updateError;
    } else {
      const { data: newContract, error: insertError } = await supabaseAdmin
        .from('contracts')
        .insert({
          user_id: userId,
          title: title || 'Untitled Agreement',
          counterparty: counterparty || 'Counterparty',
          content: extractedText,
          risk_score: calculatedRiskScore,
          risk_flags: auditData.critical_risks || [],
          domain_category: auditData.contract_type || 'Commercial',
          client_workspace_id: clientWorkspaceId || null,
          metadata: {
            governing_statutes: auditData.governing_statutes_identified || [],
            summary: auditData.summary || '',
          },
          status: 'ANALYZED',
        })
        .select('id')
        .single();

      if (insertError) throw insertError;
      finalContractId = newContract.id;
    }

    // 4. Auto-schedule statutory obligations if identified by the AI
    if (auditData.statutory_obligations && Array.isArray(auditData.statutory_obligations) && finalContractId) {
      const obligationsToInsert = auditData.statutory_obligations.map((ob: any) => ({
        contract_id: finalContractId,
        title: ob.title || 'Statutory Compliance Deadline',
        description: `${ob.action_required || ''} (${ob.statutory_reference || 'Nigerian Law'})`,
        due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        status: 'PENDING',
        obligation_type: 'NOTICE',
      }));

      if (obligationsToInsert.length > 0) {
        await supabaseAdmin.from('obligations').insert(obligationsToInsert);
      }
    }

    return NextResponse.json({
      success: true,
      contractId: finalContractId,
      audit: auditData,
    });
  } catch (err: any) {
    console.error('Ingest route error:', err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}