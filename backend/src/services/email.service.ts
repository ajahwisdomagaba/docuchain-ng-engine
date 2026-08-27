import { Resend } from 'resend';
import IORedis from 'ioredis';
import dotenv from 'dotenv';

dotenv.config();

export const redisConnection = new IORedis(process.env.REDIS_URL || 'redis://127.0.0.1:6379', {
  maxRetriesPerRequest: null,
});

export const resend = new Resend(process.env.RESEND_API_KEY || 're_dummy');

export interface ContractAlertEmailParams {
  to: string;
  recipientName: string;
  contractName: string;
  alertType: 'EXPIRY' | 'RENEWAL_NOTICE' | 'OBLIGATION_MILESTONE';
  milestoneDays: number;
  targetDate: string;
  contractId: string;
}

export async function sendContractAlertEmail(params: ContractAlertEmailParams) {
  let subject = `📅 REMINDER: ${params.milestoneDays} Days Until Expiry of ${params.contractName}`;

  if (params.alertType === 'RENEWAL_NOTICE') {
    subject = `⚠️ ACTION REQUIRED: ${params.milestoneDays} Days to Notice Deadline for ${params.contractName}`;
  } else if (params.alertType === 'OBLIGATION_MILESTONE') {
    subject = `⚖️ STATUTORY DEADLINE: ${params.milestoneDays} Days to Complete ${params.contractName}`;
  }

  return resend.emails.send({
    from: `DocuChain Alerts <${process.env.ALERT_FROM_EMAIL || 'alerts@docuchain.ng'}>`,
    to: params.to,
    subject,
    html: `
      <div style="font-family: Arial, sans-serif; padding: 16px; color: #111;">
        <h2>DocuChain.NG Compliance Alert</h2>
        <p>Hello <strong>${params.recipientName}</strong>,</p>
        <p>This is an automated milestone alert for: <strong>${params.contractName}</strong>.</p>
        <p><strong>Alert Type:</strong> ${params.alertType}</p>
        <p><strong>Time Remaining:</strong> ${params.milestoneDays} days</p>
        <p><strong>Target Date:</strong> ${params.targetDate}</p>
        <hr style="margin: 20px 0; border: none; border-top: 1px solid #eee;" />
        <p style="font-size: 12px; color: #666;">
          DocuChain.NG — Automated Statutory Contract Intelligence
        </p>
      </div>
    `,
  });
}