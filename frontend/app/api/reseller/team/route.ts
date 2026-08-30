import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';

export async function POST(req: NextRequest) {
  try {
    const { fullName, email, role, department, canSign, workspaceId } = await req.json();

    if (!fullName || !email) {
      return NextResponse.json({ error: 'Name and email are required' }, { status: 400 });
    }

    const cleanEmail = email.trim().toLowerCase();

    // 1. Resolve workspace
    const wsId = workspaceId || 'default-law-firm-workspace';

    // 2. Insert member record with PENDING status
    const { data: member, error: dbErr } = await supabase
      .from('workspace_members')
      .upsert({
        workspace_id: wsId,
        full_name: fullName,
        email: cleanEmail,
        role: role || 'ASSOCIATE',
        department: department || 'Commercial Practice',
        can_sign: Boolean(canSign),
        status: 'PENDING'
      }, { onConflict: 'email' })
      .select()
      .single();

    if (dbErr) {
      console.error('Member Insert Error:', dbErr);
      return NextResponse.json({ error: dbErr.message }, { status: 500 });
    }

    // 3. Provision User Private Vault
    await supabase.from('user_vaults').upsert({
      user_id: member.id,
      name: `${fullName}'s Private Vault`,
      workspace_id: wsId,
      allocated_storage_mb: 500,
      used_storage_mb: 0
    }, { onConflict: 'user_id' });

    // 4. Dispatch Email via Resend API
    const resendApiKey = process.env.RESEND_API_KEY;
    const fromDomain = process.env.RESEND_FROM_EMAIL || 'DocuChain.NG <onboarding@resend.dev>';
    const inviteUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/invite/accept?email=${encodeURIComponent(cleanEmail)}&name=${encodeURIComponent(fullName)}`;

    if (resendApiKey) {
      try {
        await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${resendApiKey}`
          },
          body: JSON.stringify({
            from: fromDomain,
            to: [cleanEmail],
            subject: `Action Required: Invitation to join Law Firm Workspace on DocuChain.NG`,
            html: `
              <div style="font-family: sans-serif; background-color: #020617; color: #f8fafc; padding: 32px; border-radius: 12px;">
                <h2 style="color: #10b981; margin-bottom: 8px;">DocuChain.NG Law Practice Hub</h2>
                <p>Hello <strong>${fullName}</strong>,</p>
                <p>You have been provisioned an isolated private vault and assigned to the <strong>${department}</strong> department as an <strong>${role}</strong>.</p>
                <div style="margin: 24px 0;">
                  <a href="${inviteUrl}" style="background-color: #10b981; color: #020617; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: bold; display: inline-block;">
                    Claim Your Private Legal Vault &rarr;
                  </a>
                </div>
                <p style="font-size: 12px; color: #64748b;">Statutory Compliance: CAMA 2020 | NDPA 2023 Compliant Practice Architecture.</p>
              </div>
            `
          })
        });
      } catch (emailErr) {
        console.warn('Resend email delivery skipped or in sandbox limitation:', emailErr);
      }
    }

    return NextResponse.json({
      success: true,
      member,
      inviteUrl
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}