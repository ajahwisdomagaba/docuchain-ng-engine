import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const STATUTORY_ALERT_WINDOWS = [90, 60, 30, 7];

async function sendTelegramAlert(chatId: string, message: string) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token || !chatId) return;

  try {
    await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: message,
        parse_mode: 'Markdown'
      })
    });
  } catch (err: any) {
    console.error('Telegram dispatch error:', err.message);
  }
}

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    // Verify Vercel / external cron authorization secret if configured
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized cron invocation' }, { status: 401 });
    }

    const now = new Date();
    const nowIso = now.toISOString();

    // ----------------------------------------------------
    // TASK 1: Process Due Plan Downgrades (Cycle Expiration)
    // ----------------------------------------------------
    const { data: expiredSubs, error: subErr } = await supabaseAdmin
      .from('subscriptions')
      .select('*')
      .not('pending_downgrade_plan', 'is', null)
      .lte('downgrade_effective_date', nowIso);

    let processedDowngrades = 0;
    if (expiredSubs && expiredSubs.length > 0) {
      for (const sub of expiredSubs) {
        await supabaseAdmin
          .from('subscriptions')
          .update({
            plan_tier: sub.pending_downgrade_plan,
            pending_downgrade_plan: null,
            downgrade_effective_date: null,
            updated_at: new Date().toISOString()
          })
          .eq('id', sub.id);

        await supabaseAdmin
          .from('profiles')
          .update({ plan_tier: sub.pending_downgrade_plan })
          .eq('id', sub.user_id);

        processedDowngrades++;
      }
    }

    // ----------------------------------------------------
    // TASK 2: Scan Approaching Statutory Notice Obligations
    // ----------------------------------------------------
    const { data: pendingObligations, error: obErr } = await supabaseAdmin
      .from('obligations')
      .select('*, contracts:contract_id(title, counterparty, governing_law, user_id)')
      .eq('status', 'PENDING');

    if (obErr) throw obErr;

    const dispatchedAlerts: any[] = [];

    if (pendingObligations && pendingObligations.length > 0) {
      for (const ob of pendingObligations) {
        if (!ob.due_date) continue;

        const dueDate = new Date(ob.due_date);
        const diffMs = dueDate.getTime() - now.getTime();
        const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

        if (STATUTORY_ALERT_WINDOWS.includes(diffDays)) {
          const contractTitle = ob.contracts?.title || 'Contract Document';
          const counterparty = ob.contracts?.counterparty || 'Counterparty';
          const userId = ob.contracts?.user_id;

          // Fetch user profile for telegram chat settings
          let telegramChatId = process.env.TELEGRAM_DEFAULT_CHAT_ID;
          if (userId) {
            const { data: profile } = await supabaseAdmin
              .from('profiles')
              .select('telegram_chat_id')
              .eq('id', userId)
              .single();

            if (profile?.telegram_chat_id) {
              telegramChatId = profile.telegram_chat_id;
            }
          }

          const alertMessage = 
            `⚠️ *DocuChain Statutory Alert: ${diffDays} Days Remaining*\n\n` +
            `*Obligation:* ${ob.title}\n` +
            `*Contract:* ${contractTitle}\n` +
            `*Counterparty:* ${counterparty}\n` +
            `*Due Date:* ${dueDate.toLocaleDateString('en-GB')}\n` +
            `*Details:* ${ob.description || 'Statutory determination or notice period window.'}\n\n` +
            `_Action Required: Review in DocuChain Vault to avoid statutory penalties under Lagos Tenancy Law 2011 / CAMA 2020._`;

          if (telegramChatId) {
            await sendTelegramAlert(telegramChatId, alertMessage);
          }

          dispatchedAlerts.push({
            obligationId: ob.id,
            daysRemaining: diffDays,
            contractTitle,
            recipient: telegramChatId || 'No Telegram ID linked'
          });
        }
      }
    }

    return NextResponse.json({
      success: true,
      timestamp: nowIso,
      downgradesProcessed: processedDowngrades,
      alertsDispatched: dispatchedAlerts.length,
      alerts: dispatchedAlerts
    });

  } catch (err: any) {
    console.error('Cron job alert failure:', err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}