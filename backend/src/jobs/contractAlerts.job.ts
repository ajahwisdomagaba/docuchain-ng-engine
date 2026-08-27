import { Queue, Worker } from 'bullmq';
import { redisConnection, sendContractAlertEmail } from '../services/email.service';
import { supabase } from '../services/supabase';

export const ALERT_QUEUE = 'contract-milestone-alerts';
export const alertQueue = new Queue(ALERT_QUEUE, { connection: redisConnection });

const MILESTONES = [90, 60, 30, 7];

export const alertWorker = new Worker(
  ALERT_QUEUE,
  async (job) => {
    console.log(`[Alert Worker] Processing nightly milestone job: ${job.name} (${new Date().toISOString()})`);

    for (const days of MILESTONES) {
      const targetDate = new Date();
      targetDate.setDate(targetDate.getDate() + days);
      const dateStr = targetDate.toISOString().split('T')[0];

      // 1. Process Contract Expirations & Auto-Renewals
      const { data: contracts, error: contractErr } = await supabase
        .from('contracts')
        .select('id, file_name, title, expiry_date, user_id, contract_participants(user_id, role)')
        .eq('expiry_date', dateStr);

      if (contractErr) {
        console.error(`[Alert Worker] Contract query error for ${days}d threshold:`, contractErr.message);
      } else if (contracts && contracts.length > 0) {
        for (const contract of contracts) {
          const contractName = contract.title || contract.file_name || 'Contract Agreement';

          // Notify contract participants
          const participants = (contract.contract_participants as any[]) || [];
          if (participants.length > 0) {
            for (const p of participants) {
              const { data: user } = await supabase.auth.admin.getUserById(p.user_id);
              if (user?.user?.email) {
                await sendContractAlertEmail({
                  to: user.user.email,
                  recipientName: p.role || 'Contract Manager',
                  contractName,
                  alertType: 'EXPIRY',
                  milestoneDays: days,
                  targetDate: dateStr,
                  contractId: contract.id,
                });
              }
            }
          } else if (contract.user_id) {
            // Fallback: Notify contract owner if no participants defined
            const { data: owner } = await supabase.auth.admin.getUserById(contract.user_id);
            if (owner?.user?.email) {
              await sendContractAlertEmail({
                to: owner.user.email,
                recipientName: 'Contract Owner',
                contractName,
                alertType: 'EXPIRY',
                milestoneDays: days,
                targetDate: dateStr,
                contractId: contract.id,
              });
            }
          }
        }
      }

      // 2. Process Approaching Statutory & Contractual Obligations
      const { data: obligations, error: obligationErr } = await supabase
        .from('obligations')
        .select('id, contract_id, title, description, due_date, status, obligation_type, contracts(file_name, title, user_id)')
        .eq('status', 'PENDING')
        .gte('due_date', `${dateStr}T00:00:00.000Z`)
        .lte('due_date', `${dateStr}T23:59:59.999Z`);

      if (obligationErr) {
        console.error(`[Alert Worker] Obligation query error for ${days}d threshold:`, obligationErr.message);
      } else if (obligations && obligations.length > 0) {
        for (const ob of obligations) {
          const relatedContract = ob.contracts as any;
          const ownerId = relatedContract?.user_id;

          if (ownerId) {
            const { data: user } = await supabase.auth.admin.getUserById(ownerId);
            if (user?.user?.email) {
              await sendContractAlertEmail({
                to: user.user.email,
                recipientName: 'Action Item Assignee',
                contractName: `${ob.title} (${relatedContract?.title || relatedContract?.file_name || 'Contract Obligation'})`,
                alertType: 'OBLIGATION_MILESTONE',
                milestoneDays: days,
                targetDate: dateStr,
                contractId: ob.contract_id,
              });
            }
          }
        }
      }
    }
  },
  { connection: redisConnection }
);

/**
 * Schedules the BullMQ repeatable cron job to fire nightly at 00:00 (Africa/Lagos)
 */
export async function scheduleNightlyAlertsJob() {
  await alertQueue.add(
    'process-daily-milestones',
    {},
    {
      repeat: {
        pattern: '0 0 * * *', // Every midnight
        tz: 'Africa/Lagos',
      },
      removeOnComplete: true,
      removeOnFail: false,
    }
  );
  console.log(' [DocuChain Queue] BullMQ nightly contract milestone alerts scheduled (00:00 WAT).');
}