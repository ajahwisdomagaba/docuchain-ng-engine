import axios from 'axios';
import crypto from 'crypto';

const PAYSTACK_SECRET = process.env.PAYSTACK_SECRET_KEY || '';

export class PaystackService {
  public async initializeWedgeAuditCheckout(params: { email: string; contractTempId: string; callbackUrl: string }) {
    const response = await axios.post(
      'https://api.paystack.co/transaction/initialize',
      {
        email: params.email,
        amount: 1500000, // ₦15,000 in kobo
        callback_url: params.callbackUrl,
        metadata: { contract_temp_id: params.contractTempId, product_type: 'WEDGE_AUDIT_ONE_OFF' },
      },
      { headers: { Authorization: `Bearer ${PAYSTACK_SECRET}`, 'Content-Type': 'application/json' } }
    );
    return response.data.data;
  }

  public verifyWebhookSignature(rawBody: string, signature: string): boolean {
    const hash = crypto.createHmac('sha512', PAYSTACK_SECRET).update(rawBody).digest('hex');
    return hash === signature;
  }
}
