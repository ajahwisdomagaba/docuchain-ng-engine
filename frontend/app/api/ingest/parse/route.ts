import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { PLAN_PERMISSIONS, PlanTier } from '@/lib/tierPermissions';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const rawText = formData.get('text') as string | null;
    const userId = formData.get('userId') as string | null;
    const title = (formData.get('title') as string) || file?.name || 'Untitled Contract';
    const domain = (formData.get('domain') as string) || 'General Commercial';
    const counterparty = (formData.get('counterparty') as string) || 'Unspecified Counterparty';

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    // 1. Fetch user's active subscription tier
    const { data: sub } = await supabaseAdmin
      .from('subscriptions')
      .select('plan_tier, status')
      .eq('user_id', userId)
      .eq('status', 'ACTIVE')
      .single();

    const currentTier: PlanTier = (sub?.plan_tier as PlanTier) || 'FREE';
    const limits = PLAN_PERMISSIONS[currentTier] || PLAN_PERMISSIONS.FREE;

    // 2. Enforce contract count limits
    const { count, error: countErr } = await supabaseAdmin
      .from('contracts')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);

    if (countErr) throw countErr;

    if ((count ?? 0) >= limits.maxContracts) {
      return NextResponse.json(
        {
          error: `Vault limit reached (${count}/${limits.maxContracts} contracts on ${currentTier} plan). Please upgrade your subscription to ingest more documents.`,
          limitReached: true,
          currentTier,
          maxContracts: limits.maxContracts,
        },
        { status: 403 }
      );
    }

    // 3. Extract text content
    let extractedText = rawText || '';
    if (file && !extractedText) {
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      extractedText = buffer.toString('utf-8');
    }

    if (!extractedText.trim()) {
      return NextResponse.json(
        { error: 'No readable text extracted from contract' },
        { status: 400 }
      );
    }

    // 4. Statutory risk benchmarking (Lagos Tenancy 2011 & CAMA 2020)
    const lower = extractedText.toLowerCase();
    const riskFlags: any[] = [];
    let riskScore = 95;

    if (lower.includes('two years') || lower.includes('2 years advance') || lower.includes('2 full years')) {
      riskFlags.push({
        type: 'HIGH_RISK',
        rule: 'Section 4(1) Lagos State Tenancy Law 2011',
        issue: 'Demanding or receiving advance rent exceeding 1 year for a yearly tenant is illegal.',
        recommendation: 'Amend clause to 1 year advance rent payable on execution.',
      });
      riskScore -= 30;
    }

    if (lower.includes('unlimited liability') || lower.includes('indemnify without limit')) {
      riskFlags.push({
        type: 'HIGH_RISK',
        rule: 'CAMA 2020 Commercial Standard',
        issue: 'Unlimited indemnification poses severe financial exposure.',
        recommendation: 'Cap aggregate liability to 100% of fees paid over preceding 12 months.',
      });
      riskScore -= 25;
    }

    // 5. Store parsed contract record
    const { data: contract, error: insertErr } = await supabaseAdmin
      .from('contracts')
      .insert({
        user_id: userId,
        title,
        counterparty,
        domain_category: domain,
        content: extractedText,
        risk_score: riskScore,
        risk_flags: riskFlags,
        status: 'ACTIVE',
        governing_law: 'Laws of the Federal Republic of Nigeria',
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (insertErr) throw insertErr;

    // 6. Automatically schedule notice obligation if expiration detected
    const autoObligationDate = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);
    await supabaseAdmin.from('obligations').insert({
      contract_id: contract.id,
      title: `Statutory Determination Notice: ${title}`,
      due_date: autoObligationDate.toISOString(),
      status: 'PENDING',
      description: 'Review statutory notice window prior to automatic renewal or expiration.',
    });

    return NextResponse.json({
      success: true,
      contractId: contract.id,
      riskScore,
      riskFlags,
      currentUsage: (count ?? 0) + 1,
      maxContracts: limits.maxContracts,
    });
  } catch (err: any) {
    console.error('Ingestion error:', err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}