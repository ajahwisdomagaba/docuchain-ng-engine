import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const workspaceId = searchParams.get('workspaceId');
    const clientId = searchParams.get('clientId');
    const status = searchParams.get('status');

    let query = supabase
      .from('contract_obligations')
      .select('*, contracts(id, title, contract_type), workspace_clients(client_name)')
      .order('due_date', { ascending: true });

    if (workspaceId) {
      query = query.eq('workspace_id', workspaceId);
    }
    if (clientId) {
      query = query.eq('client_id', clientId);
    }
    if (status && status !== 'ALL') {
      query = query.eq('status', status);
    }

    const { data: obligations, error } = await query;
    if (error) throw error;

    return NextResponse.json({ success: true, obligations: obligations || [] });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      workspaceId,
      clientId,
      contractId,
      title,
      obligationType,
      statutoryBasis,
      dueDate,
      noticeTriggerDate,
      counterparty,
      priority,
      notes,
    } = body;

    if (!title || !dueDate || !obligationType) {
      return NextResponse.json({ error: 'Title, due date, and obligation type are required.' }, { status: 400 });
    }

    // Default trigger date calculation if omitted
    let trigger = noticeTriggerDate;
    if (!trigger) {
      const due = new Date(dueDate);
      if (obligationType === 'STATUTORY_NOTICE') {
        // Default 6 months (180 days) prior notice trigger for yearly tenancies
        due.setDate(due.getDate() - 180);
      } else {
        // Default 30 days notice
        due.setDate(due.getDate() - 30);
      }
      trigger = due.toISOString().split('T')[0];
    }

    const { data, error } = await supabase
      .from('contract_obligations')
      .insert({
        workspace_id: workspaceId || null,
        client_id: clientId || null,
        contract_id: contractId || null,
        title,
        obligation_type: obligationType,
        statutory_basis: statutoryBasis || 'Nigerian Statutory Framework',
        due_date: dueDate,
        notice_trigger_date: trigger,
        counterparty: counterparty || '',
        priority: priority || 'MEDIUM',
        status: 'PENDING',
        notes: notes || '',
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, obligation: data });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, status } = body;

    if (!id || !status) {
      return NextResponse.json({ error: 'id and status required' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('contract_obligations')
      .update({ status })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, obligation: data });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}