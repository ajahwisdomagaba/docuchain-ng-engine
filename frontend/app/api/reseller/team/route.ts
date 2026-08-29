import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const workspaceId = searchParams.get('workspaceId');

    if (!workspaceId) {
      return NextResponse.json({ error: 'workspaceId required' }, { status: 400 });
    }

    const { data: members, error } = await supabase
      .from('workspace_members')
      .select('*')
      .eq('workspace_id', workspaceId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return NextResponse.json({ success: true, members: members || [] });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { workspaceId, userId, email, role, permissions } = body;

    if (!workspaceId || !role) {
      return NextResponse.json({ error: 'workspaceId and role are required' }, { status: 400 });
    }

    // Default permissions based on role
    const defaultPermissions = {
      FIRM_ADMIN: { can_audit: true, can_redline: true, can_export_pdf: true, can_manage_clients: true, can_manage_billing: true, can_manage_playbooks: true },
      SENIOR_PARTNER: { can_audit: true, can_redline: true, can_export_pdf: true, can_manage_clients: true, can_manage_billing: false, can_manage_playbooks: true },
      ASSOCIATE: { can_audit: true, can_redline: true, can_export_pdf: true, can_manage_clients: false, can_manage_billing: false, can_manage_playbooks: false },
      PARALEGAL: { can_audit: true, can_redline: false, can_export_pdf: true, can_manage_clients: false, can_manage_billing: false, can_manage_playbooks: false },
      BILLING_MANAGER: { can_audit: false, can_redline: false, can_export_pdf: false, can_manage_clients: false, can_manage_billing: true, can_manage_playbooks: false },
    };

    const targetPermissions = permissions || defaultPermissions[role as keyof typeof defaultPermissions] || defaultPermissions.ASSOCIATE;

    const { data, error } = await supabase
      .from('workspace_members')
      .insert({
        workspace_id: workspaceId,
        user_id: userId,
        role,
        permissions: targetPermissions,
        is_active: true,
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, member: data });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}