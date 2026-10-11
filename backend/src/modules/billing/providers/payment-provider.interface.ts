export interface CreatePaymentParams {
  orderCode: string;
  amountVnd: number;
  planCode: string;
  planName: string;
  userEmail: string;
  userName: string;
}

export interface PaymentOrderResult {
  orderCode: string;
  amountVnd: number;
  transferContent: string;
  qrCodeUrl: string;
  bankInfo: {
    bankName: string;
    bankCode: string;
    accountNumber: string;
    accountName: string;
  };
  checkoutUrl?: string;
}

export interface WebhookVerificationResult {
  isValid: boolean;
  orderCode?: string;
  amountVnd?: number;
  providerTransactionId?: string;
  error?: string;
  rawPayload?: any;
}

export interface IPaymentProvider {
  createPaymentOrder(params: CreatePaymentParams): Promise<PaymentOrderResult>;
  verifyWebhook(payload: any, signature?: string): Promise<WebhookVerificationResult>;
}
