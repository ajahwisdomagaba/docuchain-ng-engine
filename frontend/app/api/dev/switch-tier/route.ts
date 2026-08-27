import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(req: NextRequest) {
  try {
    const { userId, userEmail, targetTier } = await req.json();

    if (!userId || !targetTier) {
      return NextResponse.json({ error: 'Missing userId or targetTier' }, { status: 400 });
    }

    const normalizedTier = targetTier.toUpperCase();
    const periodEnd = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString();
    const emailToUse = userEmail || 'dev@docuchain.ng';

    // 1. Direct upsert into subscriptions
    const { error: subError } = await supabase.from('subscriptions').upsert(
      {
        user_id: userId,
        plan_tier: normalizedTier,
        status: 'ACTIVE',
        amount_paid_ngn: 0,
        customer_email: emailToUse,
        current_period_start: new Date().toISOString(),
        current_period_end: periodEnd,
        pending_downgrade_plan: null,
        downgrade_effective_date: null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id' }
    );

    if (subError) throw subError;

    // 2. Direct sync to profiles table
    await supabase
      .from('profiles')
      .update({ plan_tier: normalizedTier })
      .eq('id', userId);

    return NextResponse.json({
      success: true,
      tier: normalizedTier,
      message: `Tier successfully updated to ${normalizedTier}`,
    });
  } catch (err: any) {
    console.error('Dev tier switch error:', err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}