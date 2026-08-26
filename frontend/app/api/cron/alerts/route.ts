import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const NOTICE_THRESHOLDS = [90, 60, 30, 7];

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
    console.error('Telegram dispatch failed:', err.message);
  }
}

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized invocation' }, { status: 401 });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const targetDateMap = new Map<string, number>();
    const dateList: string[] = [];

    NOTICE_THRESHOLDS.forEach((days) => {
      const d = new Date(today);
      d.setDate(d.getDate() + days);
      const isoDate = d.toISOString().split('T')[0];
      targetDateMap.set(isoDate, days);
      dateList.push(isoDate);
    });

    const { data: obligations, error } = await supabaseAdmin
      .from('obligations')
      .select(`
        id,
        title,
        description,
        due_date,
        amount_ngn,
        obligation_type,
        status,
        user_id,
        contract:contracts (
          id,
          title,
          counterparty,
          contract_type
        )
      `)
      .eq('status', 'PENDING')
      .in('due_date', dateList)
      .order('due_date', { ascending: true });

    if (error) throw error;

    const dispatchedAlerts = [];

    for (const item of obligations || []) {
      const daysRemaining = targetDateMap.get(item.due_date) || 0;
      const contract = (item as any).contract;
      const contractTitle = contract?.title || 'Contract Document';
      const counterparty = contract?.counterparty || 'Counterparty';

      const alertPayload = {
        obligationId: item.id,
        title: item.title,
        daysRemaining,
        dueDate: item.due_date,
        contractTitle,
        counterparty
      };

      dispatchedAlerts.push(alertPayload);

      const telegramMessage = 
        `🚨 *DocuChain NG — Statutory Notice Alert*\n\n` +
        `⏳ *${daysRemaining} Days Remaining* to statutory deadline.\n` +
        `📄 *Agreement:* ${contractTitle}\n` +
        `🤝 *Counterparty:* ${counterparty}\n` +
        `📋 *Obligation:* ${item.title}\n` +
        `📅 *Due Date:* ${item.due_date}\n\n` +
        `⚖️ Check compliance under Lagos Tenancy Law 2011 / CAMA 2020.`;

      if (process.env.TELEGRAM_ALERT_CHAT_ID) {
        await sendTelegramAlert(process.env.TELEGRAM_ALERT_CHAT_ID, telegramMessage);
      }
    }

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      thresholdsChecked: NOTICE_THRESHOLDS,
      alertsFound: dispatchedAlerts.length,
      dispatchedAlerts
    });
  } catch (err: any) {
    console.error('Cron alert scanner error:', err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}