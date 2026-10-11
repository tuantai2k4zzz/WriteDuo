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
    this.accountNumber = this.configService.get<string>('VIETQR_ACCOUNT_NUMBER') || '0865903707';
    this.accountName = this.configService.get<string>('VIETQR_ACCOUNT_NAME') || 'BUI TUAN TAI';
    this.checksumKey = this.configService.get<string>('VIETQR_CHECKSUM_KEY') || 'writeduo_secure_checksum_2026';
  }

  async createPaymentOrder(params: CreatePaymentParams): Promise<PaymentOrderResult> {
    const transferContent = params.orderCode; // e.g. 'WD928172'

    // Standard VietQR Dynamic URL (Napas 247 Quick Transfer format)
    // Directly scannable by Vietcombank, MB, Techcombank, VPBank, Momo, ZaloPay, etc.
    const encodedAccountName = encodeURIComponent(this.accountName);
    const encodedDesc = encodeURIComponent(transferContent);
    const qrCodeUrl = `https://img.vietqr.io/image/${this.bankCode}-${this.accountNumber}-compact2.png?amount=${params.amountVnd}&addInfo=${encodedDesc}&accountName=${encodedAccountName}`;

    this.logger.log(`Generated real VietQR order: ${params.orderCode} for amount: ${params.amountVnd} VND (MB: ${this.accountNumber})`);

    return {
      orderCode: params.orderCode,
      amountVnd: params.amountVnd,
      transferContent,
      qrCodeUrl,
      bankInfo: {
        bankName: this.bankName,
        bankCode: this.bankCode,
        bankId: this.bankName,
        accountNumber: this.accountNumber,
        accountNo: this.accountNumber,
        accountName: this.accountName,
      },
    };
  }

  async verifyWebhook(payload: any, signature?: string): Promise<WebhookVerificationResult> {
    if (!payload) {
      return { isValid: false, error: 'Empty payload' };
    }

    // Support PayOS / Banking Webhook / SePay / Casso / Bank SMS Forwarder format
    let item = payload;
    if (Array.isArray(payload?.data) && payload.data.length > 0) {
      item = payload.data[0];
    } else if (payload.data && typeof payload.data === 'object' && !Array.isArray(payload.data)) {
      item = payload.data;
    }

    // Extract text from all potential description / content fields
    const contentString = `${payload.content || ''} ${payload.description || ''} ${item.content || ''} ${item.description || ''} ${payload.orderCode || ''} ${item.orderCode || ''} ${payload.code || ''}`;
    
    // Find WD followed by 6 digits (e.g. WD492817)
    const codeMatch = contentString.match(/WD\d{6}/i);
    const orderCode = codeMatch ? codeMatch[0].toUpperCase() : (item.orderCode || payload.orderCode || payload.code);

    const amount = Number(
      item.transferAmount ||
      payload.transferAmount ||
      item.amount ||
      payload.amount ||
      0
    );

    const transactionId =
      item.referenceCode ||
      payload.referenceCode ||
      item.reference ||
      payload.reference ||
      item.id ||
      payload.id ||
      item.transactionId ||
      payload.transactionId ||
      `MB-${Date.now()}`;

    // If HMAC signature is provided, verify checksum
    if (signature && this.checksumKey) {
      try {
        const sortedData = typeof payload === 'string' ? payload : JSON.stringify(payload);
        const computedSignature = crypto
          .createHmac('sha256', this.checksumKey)
          .update(sortedData)
          .digest('hex');

        if (computedSignature !== signature) {
          this.logger.warn(`Webhook signature mismatch for order ${orderCode}`);
        }
      } catch (err: any) {
        this.logger.error(`Signature verification failed: ${err.message}`);
      }
    }

    if (!orderCode) {
      return { isValid: false, error: 'Không tìm thấy mã đơn hàng WDxxxxxx trong dữ liệu chuyển khoản' };
    }

    return {
      isValid: true,
      orderCode: String(orderCode),
      amountVnd: amount,
      providerTransactionId: String(transactionId),
      rawPayload: payload,
    };
  }
}
