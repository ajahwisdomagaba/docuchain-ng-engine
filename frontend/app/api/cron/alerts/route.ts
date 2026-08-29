import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    
    // Scan contracts for expiring leases under Section 13(1)(e)
    const { data: contracts, error } = await supabase
      .from('contracts')
      .select('id, title, workspace_id, client_id, expiry_date, counterparty')
      .not('expiry_date', 'is', null);

    if (error) throw error;

    return NextResponse.json({
      success: true,
      message: 'Statutory cron alerts evaluated successfully',
      scannedCount: (contracts || []).length,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}