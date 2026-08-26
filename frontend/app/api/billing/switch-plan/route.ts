import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const TIER_HIERARCHY: Record<string, number> = {
  FREE: 0,
  STARTER: 1,
  ENTERPRISE: 2
};

export async function POST(req: NextRequest) {
  try {
    const { userId, targetTier } = await req.json();

    if (!userId || !targetTier) {
      return NextResponse.json({ error: 'Missing userId or targetTier' }, { status: 400 });
    }

    const normalizedTarget = targetTier.toUpperCase();

    // Fetch user's current subscription
    const { data: sub, error } = await supabaseAdmin
      .from('subscriptions')
      .select('*')
      .eq('user_id', userId)
      .single();

    const currentTier = sub?.plan_tier || 'FREE';
    const currentWeight = TIER_HIERARCHY[currentTier] ?? 0;
    const targetWeight = TIER_HIERARCHY[normalizedTarget] ?? 0;

    // Case 1: Same tier
    if (currentWeight === targetWeight) {
      return NextResponse.json({ message: 'Already on this plan tier.' });
    }

    // Case 2: Immediate Upgrade (requires checkout or immediate free-to-paid switch)
    if (targetWeight > currentWeight) {
      return NextResponse.json({
        action: 'UPGRADE_REQUIRED',
        message: 'Upgrades take effect immediately. Please complete checkout.',
        targetTier: normalizedTarget
      });
    }

    // Case 3: Downgrade (scheduled at end of current paid cycle)
    const periodEnd = sub?.current_period_end || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

    await supabaseAdmin
      .from('subscriptions')
      .update({
        pending_downgrade_plan: normalizedTarget,
        downgrade_effective_date: periodEnd,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId);

    return NextResponse.json({
      action: 'DOWNGRADE_SCHEDULED',
      effectiveDate: periodEnd,
      message: `Your downgrade to ${normalizedTarget} is scheduled and will take effect on ${new Date(periodEnd).toLocaleDateString('en-GB')} after your current cycle ends.`
    });

  } catch (err: any) {
    console.error('Plan switch error:', err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}