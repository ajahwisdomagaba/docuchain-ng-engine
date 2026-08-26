import { NextRequest, NextResponse } from 'next/server';

const PLAN_PRICING: Record<string, number> = {
  FREE: 0,
  STARTER: 15000,
  ENTERPRISE: 45000,
};

export async function POST(req: NextRequest) {
  try {
    const { email, plan, userId } = await req.json();

    if (!email || !plan || !userId) {
      return NextResponse.json(
        { error: 'Missing required parameters: email, plan, userId' },
        { status: 400 }
      );
    }

    const normalizedPlan = plan.toUpperCase();
    const amountNgn = PLAN_PRICING[normalizedPlan];

    if (amountNgn === undefined) {
      return NextResponse.json({ error: 'Invalid subscription tier selected' }, { status: 400 });
    }

    // Free tier bypasses payment gateway
    if (amountNgn === 0) {
      return NextResponse.json({
        freeTier: true,
        redirectUrl: '/vault'
      });
    }

    const paystackSecret = process.env.PAYSTACK_SECRET_KEY;
    if (!paystackSecret) {
      return NextResponse.json({ error: 'Paystack secret key is unconfigured' }, { status: 500 });
    }

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

    // Amount in Kobo (₦1 = 100 kobo)
    const response = await fetch('https://api.paystack.co/transaction/initialize', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${paystackSecret}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        amount: Math.round(amountNgn * 100),
        currency: 'NGN',
        callback_url: `${siteUrl}/billing/success`,
        metadata: {
          userId,
          plan: normalizedPlan,
          custom_fields: [
            {
              display_name: 'Platform',
              variable_name: 'platform',
              value: 'DocuChain NG'
            },
            {
              display_name: 'Plan Tier',
              variable_name: 'plan_tier',
              value: normalizedPlan
            }
          ]
        }
      })
    });

    const data = await response.json();

    if (!data.status) {
      throw new Error(data.message || 'Paystack initialization failed');
    }

    return NextResponse.json({
      authorizationUrl: data.data.authorization_url,
      accessCode: data.data.access_code,
      reference: data.data.reference
    });

  } catch (err: any) {
    console.error('Paystack initialization error:', err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}