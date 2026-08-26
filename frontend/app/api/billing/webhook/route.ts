import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get('x-paystack-signature');
    const secret = process.env.PAYSTACK_SECRET_KEY;

    if (!secret || !signature) {
      return NextResponse.json({ error: 'Unauthorized signature payload' }, { status: 401 });
    }

    // Verify Paystack HMAC SHA512 signature
    const hash = crypto.createHmac('sha512', secret).update(rawBody).digest('hex');
    if (hash !== signature) {
      return NextResponse.json({ error: 'Invalid webhook signature' }, { status: 401 });
    }

    const event = JSON.parse(rawBody);

    if (event.event === 'charge.success') {
      const { metadata, amount, customer, reference } = event.data;
      const userId = metadata?.userId;
      const plan = metadata?.plan || 'STARTER';

      if (userId) {
        const amountPaidNgn = amount / 100;
        const periodEnd = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

        // Upsert active subscription record
        await supabaseAdmin.from('subscriptions').upsert(
          {
            user_id: userId,
            plan_tier: plan,
            status: 'ACTIVE',
            amount_paid_ngn: amountPaidNgn,
            paystack_reference: reference,
            paystack_customer_code: customer?.customer_code || null,
            customer_email: customer?.email || '',
            current_period_start: new Date().toISOString(),
            current_period_end: periodEnd,
            updated_at: new Date().toISOString()
          },
          { onConflict: 'user_id' }
        );

        // Update profiles metadata if table exists
        await supabaseAdmin
          .from('profiles')
          .update({ plan_tier: plan })
          .eq('id', userId);
      }
    }

    return NextResponse.json({ received: true });
  } catch (err: any) {
    console.error('Paystack webhook failure:', err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}