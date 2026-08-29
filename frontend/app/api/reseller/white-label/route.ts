import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const slug = searchParams.get('slug');
    const userId = searchParams.get('userId');

    let query = supabase.from('workspaces').select('*');

    if (slug) {
      query = query.eq('slug', slug);
    } else if (userId) {
      query = query.eq('owner_user_id', userId);
    } else {
      return NextResponse.json({ error: 'Missing slug or userId' }, { status: 400 });
    }

    const { data: workspace, error } = await query.maybeSingle();

    if (error) throw error;

    return NextResponse.json({ success: true, workspace });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      userId,
      firmName,
      slug,
      logoUrl,
      primaryColor,
      portalSubheading,
      supportEmail,
    } = body;

    if (!firmName || !slug) {
      return NextResponse.json({ error: 'Firm name and slug are required' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('workspaces')
      .upsert(
        {
          owner_user_id: userId,
          firm_name: firmName,
          slug: slug.toLowerCase().replace(/[^a-z0-9-]/g, '-'),
          logo_url: logoUrl || '',
          primary_color: primaryColor || '#10b981',
          portal_subheading: portalSubheading || 'Official Client Legal Intelligence & Contract Vault',
          support_email: supportEmail || '',
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'slug' }
      )
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, workspace: data });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}