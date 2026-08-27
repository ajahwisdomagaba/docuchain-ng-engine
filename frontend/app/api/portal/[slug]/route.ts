import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ slug: string }> | { slug: string } }
) {
  try {
    // 1. Safely resolve slug from params or URL path
    const resolvedParams = await context.params;
    let slug = resolvedParams?.slug;

    if (!slug) {
      const urlParts = req.nextUrl.pathname.split('/');
      slug = urlParts[urlParts.length - 1];
    }

    if (!slug || slug === '[slug]') {
      return NextResponse.json({ error: 'Missing or invalid portal slug' }, { status: 400 });
    }

    // 2. Fetch workspace by slug
    const { data: workspace, error: wsError } = await supabaseAdmin
      .from('client_workspaces')
      .select('id, client_name, client_email, company_rc_number, industry, status, firm_user_id')
      .eq('portal_access_slug', slug)
      .maybeSingle();

    if (wsError) throw wsError;

    if (!workspace) {
      return NextResponse.json({ error: `Client workspace not found for slug: ${slug}` }, { status: 404 });
    }

    // 3. Fetch firm white-label branding
    const { data: whiteLabel } = await supabaseAdmin
      .from('firm_white_label_settings')
      .select('firm_name, brand_primary_color, custom_disclaimer, support_whatsapp')
      .eq('firm_user_id', workspace.firm_user_id)
      .maybeSingle();

    // 4. Fetch contracts linked to this workspace
    const { data: contracts, error: contractsError } = await supabaseAdmin
      .from('contracts')
      .select('id, title, counterparty, domain_category, risk_score, risk_flags, status, created_at, content')
      .eq('client_workspace_id', workspace.id)
      .order('created_at', { ascending: false });

    if (contractsError) {
      console.warn('Notice fetching client contracts:', contractsError.message);
    }

    return NextResponse.json({
      success: true,
      workspace,
      whiteLabel: whiteLabel || {
        firm_name: 'Legal Advisory Partners',
        brand_primary_color: '#059669',
        custom_disclaimer: 'Certified under Nigerian Statutory Standards (CAMA 2020 / Lagos Tenancy Law 2011).',
        support_whatsapp: null,
      },
      contracts: contracts || [],
    });
  } catch (err: any) {
    console.error('Portal API fetch error:', err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}