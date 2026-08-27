import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'Missing userId parameter' }, { status: 400 });
    }

    // 1. Fetch all client workspaces for this law firm
    const { data: workspaces, error: wsError } = await supabase
      .from('client_workspaces')
      .select('*, contracts:contracts(id, title, risk_score, status, created_at)')
      .eq('firm_user_id', userId)
      .order('created_at', { ascending: false });

    if (wsError) throw wsError;

    // 2. Fetch white label settings
    const { data: whiteLabel } = await supabase
      .from('firm_white_label_settings')
      .select('*')
      .eq('firm_user_id', userId)
      .single();

    return NextResponse.json({
      workspaces: workspaces || [],
      whiteLabel: whiteLabel || null,
    });
  } catch (err: any) {
    console.error('Fetch reseller clients error:', err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { firmUserId, clientName, clientEmail, companyRcNumber, industry } = body;

    if (!firmUserId || !clientName) {
      return NextResponse.json({ error: 'Missing required client fields' }, { status: 400 });
    }

    // Generate a unique URL slug for the client portal
    const slug = `${clientName.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${Math.random().toString(36).substring(2, 7)}`;

    const { data: newClient, error } = await supabase
      .from('client_workspaces')
      .insert({
        firm_user_id: firmUserId,
        client_name: clientName,
        client_email: clientEmail || null,
        company_rc_number: companyRcNumber || null,
        industry: industry || 'Real Estate & Property',
        status: 'ACTIVE',
        portal_access_slug: slug,
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, client: newClient });
  } catch (err: any) {
    console.error('Create client workspace error:', err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}