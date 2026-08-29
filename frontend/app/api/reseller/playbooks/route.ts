import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const workspaceId = searchParams.get('workspaceId');
    const clientId = searchParams.get('clientId');

    if (!workspaceId) {
      return NextResponse.json({ error: 'workspaceId is required' }, { status: 400 });
    }

    let query = supabase
      .from('ai_playbooks')
      .select('*')
      .eq('workspace_id', workspaceId)
      .order('created_at', { ascending: false });

    if (clientId) {
      query = query.or(`client_id.eq.${clientId},client_id.is.null`);
    }

    const { data: playbooks, error } = await query;
    if (error) throw error;

    return NextResponse.json({ success: true, playbooks: playbooks || [] });
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
      playbookName,
      category,
      mandatoryClauses,
      forbiddenTerms,
      preferredJurisdiction,
      customInstructions,
      autoApproveThreshold,
    } = body;

    if (!workspaceId || !playbookName || !category) {
      return NextResponse.json({ error: 'Missing required playbook fields' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('ai_playbooks')
      .insert({
        workspace_id: workspaceId,
        client_id: clientId || null,
        playbook_name: playbookName,
        category,
        mandatory_clauses: mandatoryClauses || [],
        forbidden_terms: forbiddenTerms || [],
        preferred_jurisdiction: preferredJurisdiction || 'Laws of the Federal Republic of Nigeria',
        custom_instructions: customInstructions || '',
        auto_approve_threshold: autoApproveThreshold || 90,
        is_active: true,
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, playbook: data });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}