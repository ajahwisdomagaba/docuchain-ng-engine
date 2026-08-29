import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { generateContractAnalysis } from '@/lib/aiClient';
import { NIGERIAN_STATUTORY_AUDITOR_PROMPT } from '@/lib/prompts/nigerianLawAuditor';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

 function extractValidJson(raw: string): any {
  if (!raw || typeof raw !== 'string') return null;

  // Strip Markdown code blocks if present
  let clean = raw.replace(/```json/gi, '').replace(/```/g, '').trim();

  const firstBrace = clean.indexOf('{');
  const lastBrace = clean.lastIndexOf('}');

  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    const jsonSubstring = clean.substring(firstBrace, lastBrace + 1);
    return JSON.parse(jsonSubstring);
  }

  return JSON.parse(clean);
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

    // 1. Run Nigerian Statutory Analysis via AI
    let rawAiOutput: any;
    try {
      rawAiOutput = await generateContractAnalysis({
        systemPrompt: NIGERIAN_STATUTORY_AUDITOR_PROMPT,
        userPrompt: `Audit this Nigerian contract for statutory compliance (CAMA 2020, Lagos Tenancy Law 2011, Labour Act, NDPA 2023, Arbitration and Mediation Act 2023):\n\n${extractedText}`,
        temperature: 0.1,
        jsonMode: true,
      });
    } catch (aiErr: any) {
      console.error('[DocuChain Ingest] AI Generation failed:', aiErr.message);
    }

    // 2. Safely parse JSON bounded between { and }
    let auditData: any = null;
    if (rawAiOutput) {
      try {
        auditData = extractValidJson(
          typeof rawAiOutput === 'string' ? rawAiOutput : JSON.stringify(rawAiOutput)
        );
      } catch (parseErr) {
        console.warn('[DocuChain Ingest] AI Output JSON Parse Error. Raw Output:', rawAiOutput);
      }
    }

    // Fallback if AI response failed to parse or execute
    if (!auditData || !auditData.compliance_score) {
      auditData = {
        compliance_score: 50,
        contract_type: 'Commercial Agreement',
        governing_statutes_identified: ['CAMA 2020', 'Labour Act'],
        summary: typeof rawAiOutput === 'string' ? rawAiOutput.slice(0, 300) : 'Contract processed.',
        critical_risks: [
          {
            clause_reference: 'Audit Warning',
            statute_violated: 'Nigerian Law Engine',
            issue: 'Automated audit requires re-evaluation or manual review.',
            severity: 'MEDIUM',
            remediation: 'Inspect document clauses manually.'
          }
        ],
        statutory_obligations: [],
      };
    }

    const calculatedRiskScore = Math.max(0, 100 - Number(auditData.compliance_score || 70));

    // 3. Update or Insert Contract Record in Supabase
    let finalContractId = contractId;

    if (contractId) {
      const { error: updateError } = await supabaseAdmin
        .from('contracts')
        .update({
          content: extractedText,
          raw_text: extractedText,
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
          raw_text: extractedText,
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

    // 4. Auto-schedule statutory obligations if identified
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