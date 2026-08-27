import { NextRequest, NextResponse } from 'next/server';

const PLAN_PRICING: Record<string, number> = {
  FREE: 0,
  STARTER: 10000,
  BUSINESS: 30000,
  LEGAL_TEAM: 75000,
  LAW_FIRM_RESELLER: 150000,
  ONE_TIME_REVIEW: 15000,
};

export async function POST(req: NextRequest) {
  try {
    const { email, plan, userId } = await req.json();

    if (!email || !plan) {
      return NextResponse.json(
        { error: 'Missing required parameters: email, plan' },
        { status: 400 }
      );
    }

    const normalizedPlan = plan.toUpperCase();
    const amountNgn = PLAN_PRICING[normalizedPlan];

    if (amountNgn === undefined) {
      return NextResponse.json(
        { error: 'Invalid plan or service selected' },
        { status: 400 }
      );
    }

    // Free plan bypasses Paystack
    if (amountNgn === 0) {
      return NextResponse.json({
        freeTier: true,
        redirectUrl: '/onboarding',
      });
    }

    const paystackSecret = process.env.PAYSTACK_SECRET_KEY;
    if (!paystackSecret) {
      return NextResponse.json(
        { error: 'Paystack secret key is not configured' },
        { status: 500 }
      );
    }

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
    const isOneTime = normalizedPlan === 'ONE_TIME_REVIEW';

    // Route one-time audits directly to the one-time success page
    const callbackUrl = isOneTime
      ? `${siteUrl}/billing/success?type=one-time`
      : `${siteUrl}/billing/success`;

    const response = await fetch('https://api.paystack.co/transaction/initialize', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${paystackSecret}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        amount: Math.round(amountNgn * 100), // Amount in Kobo
        currency: 'NGN',
        callback_url: callbackUrl,
        metadata: {
          userId: userId || `guest_${Date.now()}`,
          plan: normalizedPlan,
          isOneTime,
          custom_fields: [
            {
              display_name: 'Platform',
              variable_name: 'platform',
              value: 'DocuChain NG',
            },
            {
              display_name: 'Plan Tier',
              variable_name: 'plan_tier',
              value: normalizedPlan,
            },
            {
              display_name: 'Transaction Type',
              variable_name: 'transaction_type',
              value: isOneTime ? 'One-Time Review' : 'Recurring Subscription',
            },
          ],
        },
      }),
    });

    const data = await response.json();

    if (!data.status) {
      throw new Error(data.message || 'Paystack transaction initialization failed');
    }

    return NextResponse.json({
      authorizationUrl: data.data.authorization_url,
      accessCode: data.data.access_code,
      reference: data.data.reference,
    });
  } catch (err: any) {
    console.error('Paystack initialization error:', err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}