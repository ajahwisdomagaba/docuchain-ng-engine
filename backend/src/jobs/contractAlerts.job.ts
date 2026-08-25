import { Queue, Worker } from 'bullmq';
import { redisConnection, sendContractAlertEmail } from '../services/email.service';
import { supabase } from '../services/supabase';

export const ALERT_QUEUE = 'contract-milestone-alerts';
export const alertQueue = new Queue(ALERT_QUEUE, { connection: redisConnection });

const MILESTONES = [90, 60, 30, 7];

export const alertWorker = new Worker(
  ALERT_QUEUE,
  async () => {
    for (const days of MILESTONES) {
      const targetDate = new Date();
      targetDate.setDate(targetDate.getDate() + days);
      const dateStr = targetDate.toISOString().split('T')[0];

      const { data: contracts } = await supabase
        .from('contracts')
        .select('id, file_name, expiry_date, contract_participants(user_id, role)')
        .eq('expiry_date', dateStr);

      if (!contracts) continue;

      for (const contract of contracts) {
        for (const p of (contract.contract_participants as any[]) || []) {
          const { data: user } = await supabase.auth.admin.getUserById(p.user_id);
          if (user?.user?.email) {
            await sendContractAlertEmail({
              to: user.user.email,
              recipientName: p.role,
              contractName: contract.file_name,
              alertType: 'EXPIRY',
              milestoneDays: days,
              targetDate: dateStr,
              contractId: contract.id,
            });
          }
        }
      }
    }
  },
  { connection: redisConnection }
);
