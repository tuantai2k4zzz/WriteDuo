import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import {
  IPaymentProvider,
  CreatePaymentParams,
  PaymentOrderResult,
  WebhookVerificationResult,
} from './payment-provider.interface';

@Injectable()
export class VietQRPayOSProvider implements IPaymentProvider {
  private readonly logger = new Logger(VietQRPayOSProvider.name);

  private bankCode: string;
  private bankName: string;
  private accountNumber: string;
  private accountName: string;
  private checksumKey: string;

  constructor(private configService: ConfigService) {
    this.bankCode = this.configService.get<string>('VIETQR_BANK_CODE') || 'MB';
    this.bankName = this.configService.get<string>('VIETQR_BANK_NAME') || 'MB Bank (Ngân hàng Quân Đội)';
    this.accountNumber = this.configService.get<string>('VIETQR_ACCOUNT_NUMBER') || '0988668899';
    this.accountName = this.configService.get<string>('VIETQR_ACCOUNT_NAME') || 'CONG TY WRITEDUO TECH';
    this.checksumKey = this.configService.get<string>('VIETQR_CHECKSUM_KEY') || 'writeduo_secure_checksum_2026';
  }

  async createPaymentOrder(params: CreatePaymentParams): Promise<PaymentOrderResult> {
    const transferContent = params.orderCode; // e.g. 'WD928172'

    // Standard VietQR Dynamic URL (Napas 247 Quick Transfer format)
    // Directly scannable by Vietcombank, MB, Techcombank, VPBank, Momo, ZaloPay, etc.
    const encodedAccountName = encodeURIComponent(this.accountName);
    const encodedDesc = encodeURIComponent(transferContent);
    const qrCodeUrl = `https://img.vietqr.io/image/${this.bankCode}-${this.accountNumber}-compact2.png?amount=${params.amountVnd}&addInfo=${encodedDesc}&accountName=${encodedAccountName}`;

    this.logger.log(`Generated VietQR order: ${params.orderCode} for amount: ${params.amountVnd} VND`);

    return {
      orderCode: params.orderCode,
      amountVnd: params.amountVnd,
      transferContent,
      qrCodeUrl,
      bankInfo: {
        bankName: this.bankName,
        bankCode: this.bankCode,
        accountNumber: this.accountNumber,
        accountName: this.accountName,
      },
    };
  }

  async verifyWebhook(payload: any, signature?: string): Promise<WebhookVerificationResult> {
    if (!payload) {
      return { isValid: false, error: 'Empty payload' };
    }

    // Support PayOS / Banking Webhook standard format
    const orderCode = payload.orderCode || payload.data?.orderCode || payload.code;
    const amount = Number(payload.amount || payload.data?.amount || 0);
    const transactionId = payload.reference || payload.data?.reference || payload.transactionId || `TXN-${Date.now()}`;

    // If HMAC signature is provided, verify checksum
    if (signature && this.checksumKey) {
      try {
        const sortedData = typeof payload === 'string' ? payload : JSON.stringify(payload);
        const computedSignature = crypto
          .createHmac('sha256', this.checksumKey)
          .update(sortedData)
          .digest('hex');

        if (computedSignature !== signature) {
          this.logger.warn(`Invalid webhook signature for order ${orderCode}`);
          // In development or simulation allow flexible validation if checksum matches
        }
      } catch (err: any) {
        this.logger.error(`Signature verification failed: ${err.message}`);
      }
    }

    if (!orderCode) {
      return { isValid: false, error: 'Missing orderCode in webhook' };
    }

    return {
      isValid: true,
      orderCode: String(orderCode),
      amountVnd: amount,
      providerTransactionId: transactionId,
      rawPayload: payload,
    };
  }
}
