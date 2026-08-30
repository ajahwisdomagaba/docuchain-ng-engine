import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    // Optional cron secret verification
    if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized Cron Trigger' }, { status: 401 });
    }

    const today = new Date();
    const sixMonthsFromNow = new Date();
    sixMonthsFromNow.setMonth(today.getMonth() + 6);

    // 1. Fetch active agreements with expiry dates
    const { data: contracts, error } = await supabase
      .from('contracts')
      .select('id, title, workspace_id, client_id, expiry_date, contract_type')
      .eq('status', 'EXECUTED')
      .not('expiry_date', 'is', null);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    let alertsCreated = 0;

    for (const doc of contracts || []) {
      const expiry = new Date(doc.expiry_date);
      const timeDiffDays = Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 3600 * 24));

      // Lagos Tenancy Law Section 13: 1-Year tenancy requires 6 months notice (approx 180 days)
      if (timeDiffDays <= 180 && timeDiffDays > 0) {
        // Upsert into statutory_obligations
        const { error: alertErr } = await supabase
          .from('statutory_obligations')
          .upsert({
            contract_id: doc.id,
            workspace_id: doc.workspace_id,
            client_id: doc.client_id,
            statute_ref: 'Lagos State Tenancy Law 2011 (Section 13)',
            notice_type: 'FORM_TL5_NOTICE_TO_QUIT',
            due_date: doc.expiry_date,
            days_remaining: timeDiffDays,
            action_required: `Statutory 6-Month Notice Window Open: Dispatch Form TL5 to tenant for ${doc.title}.`,
            status: 'URGENT'
          }, { onConflict: 'contract_id, notice_type' });

        if (!alertErr) alertsCreated++;
      }
    }

    return NextResponse.json({
      success: true,
      scannedContracts: contracts?.length || 0,
      alertsCreated,
      timestamp: new Date().toISOString()
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}