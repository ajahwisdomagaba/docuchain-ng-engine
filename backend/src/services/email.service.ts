import { Resend } from 'resend';
import IORedis from 'ioredis';
import dotenv from 'dotenv';
dotenv.config();

export const redisConnection = new IORedis(process.env.REDIS_URL || 'redis://127.0.0.1:6379', {
  maxRetriesPerRequest: null,
});

export const resend = new Resend(process.env.RESEND_API_KEY || 're_dummy');

export async function sendContractAlertEmail(params: {
  to: string;
  recipientName: string;
  contractName: string;
  alertType: 'EXPIRY' | 'RENEWAL_NOTICE';
  milestoneDays: number;
  targetDate: string;
  contractId: string;
}) {
  const isNotice = params.alertType === 'RENEWAL_NOTICE';
  const subject = isNotice
    ? `⚠️ ACTION REQUIRED: ${params.milestoneDays} Days to Notice Deadline for ${params.contractName}`
    : `📅 REMINDER: ${params.milestoneDays} Days Until Expiry of ${params.contractName}`;

  return resend.emails.send({
    from: `DocuChain Alerts <${process.env.ALERT_FROM_EMAIL || 'alerts@docuchain.ng'}>`,
    to: params.to,
    subject,
    html: `<p>Hello ${params.recipientName}, your contract <strong>${params.contractName}</strong> reaches a milestone in ${params.milestoneDays} days (${params.targetDate}).</p>`,
  });
}
