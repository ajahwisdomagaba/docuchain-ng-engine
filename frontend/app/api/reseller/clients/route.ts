import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const workspaceId = searchParams.get('workspaceId');

    if (!workspaceId) {
      return NextResponse.json({ error: 'workspaceId required' }, { status: 400 });
    }

    // Retrieve clients along with their assigned contracts
    const { data: clients, error } = await supabase
      .from('workspace_clients')
      .select('*, contracts(id, title, risk_score, created_at, status)')
      .eq('workspace_id', workspaceId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return NextResponse.json({ success: true, clients: clients || [] });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { workspaceId, clientName, clientEmail, clientType } = body;

    if (!workspaceId || !clientName) {
      return NextResponse.json({ error: 'Workspace ID and client name are required' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('workspace_clients')
      .insert({
        workspace_id: workspaceId,
        client_name: clientName,
        client_email: clientEmail || '',
        client_type: clientType || 'CORPORATE',
        status: 'ACTIVE',
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, client: data });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}