import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(req: NextRequest) {
  try {
    const { firmUserId, firmName, brandPrimaryColor, portalSubdomain, customDisclaimer, supportWhatsapp } = await req.json();

    if (!firmUserId || !firmName) {
      return NextResponse.json({ error: 'Missing firm identity parameters' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('firm_white_label_settings')
      .upsert(
        {
          firm_user_id: firmUserId,
          firm_name: firmName,
          brand_primary_color: brandPrimaryColor || '#059669',
          portal_subdomain: portalSubdomain ? portalSubdomain.toLowerCase().trim() : null,
          custom_disclaimer: customDisclaimer,
          support_whatsapp: supportWhatsapp,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'firm_user_id' }
      )
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, settings: data });
  } catch (err: any) {
    console.error('Save white label settings error:', err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}