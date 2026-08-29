import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const clientId = searchParams.get('clientId');
    const workspaceId = searchParams.get('workspaceId');

    let query = supabase.from('client_matters').select('*, contracts(id, title, risk_score)');

    if (clientId) {
      query = query.eq('client_id', clientId);
    } else if (workspaceId) {
      query = query.eq('workspace_id', workspaceId);
    } else {
      return NextResponse.json({ error: 'Missing clientId or workspaceId' }, { status: 400 });
    }

    const { data: matters, error } = await query.order('created_at', { ascending: false });
    if (error) throw error;

    return NextResponse.json({ success: true, matters: matters || [] });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { clientId, workspaceId, matterName, matterCode, description, userId } = body;

    if (!clientId || !workspaceId || !matterName) {
      return NextResponse.json({ error: 'clientId, workspaceId, and matterName are required' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('client_matters')
      .insert({
        client_id: clientId,
        workspace_id: workspaceId,
        matter_name: matterName,
        matter_code: matterCode || null,
        description: description || '',
        created_by: userId || null,
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, matter: data });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}