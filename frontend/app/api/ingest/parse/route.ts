import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;
    const userId = formData.get('userId') as string;

    if (!file || !userId) {
      return NextResponse.json({ error: 'File and userId are required' }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    let extractedText = '';

    if (file.name.endsWith('.pdf')) {
      const pdfParse = require('pdf-parse');
      const data = await pdfParse(buffer);
      extractedText = data.text;
    } else if (file.name.endsWith('.docx')) {
      const mammoth = require('mammoth');
      const result = await mammoth.extractRawText({ buffer });
      extractedText = result.value;
    } else {
      extractedText = buffer.toString('utf-8');
    }

    if (!extractedText.trim()) {
      return NextResponse.json({ error: 'Failed to extract text from document.' }, { status: 422 });
    }

    const isTenancy = /tenan(cy|t)|lease|landlord|rent/i.test(extractedText);
    const isNDA = /non-disclosure|confidential|nda/i.test(extractedText);

    let contractType = 'Vendor SLA';
    let governingLaw = 'Laws of the Federal Republic of Nigeria';
    let riskScore = 20;
    const riskFlags: any[] = [];

    if (isTenancy) {
      contractType = 'Tenancy Agreement';
      governingLaw = 'Lagos State Tenancy Law 2011';
      
      if (/(two|2)\s*years?\s*advance/i.test(extractedText) || /24\s*months/i.test(extractedText)) {
        riskScore += 35;
        riskFlags.push({
          clauseTitle: 'Excess Advance Rent Demand',
          legalBasis: 'Lagos State Tenancy Law 2011, Section 4',
          riskLevel: 'HIGH',
          originalText: 'Advance rent exceeding 1 year requested.',
          recommendedRedline: 'Limit advance payment to 1 year in compliance with Section 4 statutory provisions.',
          plainEnglishExplanation: 'Demanding or paying more than 1 year advance rent from a yearly tenant is unlawful in Lagos.'
        });
      }

      if (/(two|2)\s*weeks?\s*notice/i.test(extractedText)) {
        riskScore += 30;
        riskFlags.push({
          clauseTitle: 'Deficient Notice Period',
          legalBasis: 'Lagos State Tenancy Law 2011, Section 13(1)',
          riskLevel: 'HIGH',
          originalText: '2 weeks written notice to quit.',
          recommendedRedline: 'Provide statutory six (6) months written notice to quit prior to term determination.',
          plainEnglishExplanation: 'Yearly tenants in Lagos are statutorily entitled to at least 6 months written notice to quit.'
        });
      }
    } else if (isNDA) {
      contractType = 'Non-Disclosure Agreement';
      if (/indefinitely|perpetual/i.test(extractedText)) {
        riskScore += 20;
        riskFlags.push({
          clauseTitle: 'Perpetual Confidentiality Term',
          legalBasis: 'Nigerian Common Law / Public Policy',
          riskLevel: 'MEDIUM',
          originalText: 'Obligations shall endure indefinitely.',
          recommendedRedline: 'Limit confidentiality obligations to 2–3 years post-expiration.',
          plainEnglishExplanation: 'Indefinite non-disclosure covenants are generally unenforceable under Nigerian commercial standards.'
        });
      }
    }

    const { data: contract, error: contractErr } = await supabaseAdmin
      .from('contracts')
      .insert({
        user_id: userId,
        title: file.name.replace(/\.[^/.]+$/, ''),
        contract_type: contractType,
        counterparty: isTenancy ? 'Lagos Property Counterparty' : 'Commercial Counterparty',
        status: riskFlags.length > 0 ? 'FLAGGED' : 'ACTIVE',
        risk_score: Math.min(riskScore, 100),
        metadata: {
          governingLaw,
          risk_flags: riskFlags,
          rawDraft: extractedText,
          autoParsed: true
        }
      })
      .select()
      .single();

    if (contractErr) throw contractErr;

    if (isTenancy && contract) {
      await supabaseAdmin.from('obligations').insert({
        contract_id: contract.id,
        user_id: userId,
        title: 'Statutory 6-Month Notice Window',
        description: 'Lagos Tenancy Law 2011 Section 13 notice window prior to lease expiration.',
        due_date: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        obligation_type: 'NOTICE',
        status: 'PENDING'
      });
    }

    return NextResponse.json({
      success: true,
      contractId: contract.id,
      title: contract.title,
      riskFlagsCount: riskFlags.length,
      complianceScore: 100 - contract.risk_score
    });

  } catch (error: any) {
    console.error('Ingestion parse error:', error);
    return NextResponse.json({ error: error.message || 'Internal parsing error' }, { status: 500 });
  }
}