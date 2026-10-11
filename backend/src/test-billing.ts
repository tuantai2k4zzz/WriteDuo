import * as dns from 'dns';
if (process.platform === 'win32') {
  dns.setServers(['8.8.8.8', '1.1.1.1']);
}

import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';

async function runBillingTests() {
  console.log('=== STARTING WRITEDUO MONETIZATION & ENTITLEMENT TEST SUITE ===\n');

  const app = await NestFactory.create(AppModule, { logger: ['error', 'warn'] });
  app.setGlobalPrefix('api/v1');
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

  const port = 4056;
  await app.listen(port);
  const baseUrl = `http://localhost:${port}/api/v1`;

  let passed = 0;
  let failed = 0;

  async function test(name: string, fn: () => Promise<void>) {
    try {
      await fn();
      console.log(`✅ [PASS] ${name}`);
      passed++;
    } catch (err: any) {
      console.error(`❌ [FAIL] ${name}:`, err.message);
      failed++;
    }
  }

  try {
    // 1. Test GET /billing/plans
    let freePlan: any = null;
    let proMonthly: any = null;
    let proAnnual: any = null;

    await test('GET /billing/plans returns seeded pricing plans', async () => {
      const res = await fetch(`${baseUrl}/billing/plans`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      if (!json.success || !Array.isArray(json.data)) throw new Error('Invalid plans response');
      freePlan = json.data.find((p: any) => p.code === 'free');
      proMonthly = json.data.find((p: any) => p.code === 'pro_monthly');
      proAnnual = json.data.find((p: any) => p.code === 'pro_annual');

      if (!freePlan || freePlan.priceVnd !== 0) throw new Error('Missing or invalid Free plan');
      if (!proMonthly || proMonthly.priceVnd !== 99000) throw new Error('Missing or invalid Pro Monthly plan (99,000 VND)');
      if (!proAnnual || proAnnual.priceVnd !== 699000) throw new Error('Missing or invalid Pro Annual plan (699,000 VND)');
    });

    // 2. Test Guest Entitlements
    await test('GET /billing/entitlements returns restricted guest status without auth', async () => {
      const res = await fetch(`${baseUrl}/billing/entitlements`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      if (json.data.isPro !== false) throw new Error('Guest should not be Pro');
      if (json.data.dailyAiLimit > 10) throw new Error('Guest daily limit should be <= 10');
      if (json.data.canAccessAllLevels !== false) throw new Error('Guest cannot access all levels');
    });

    // 3. Register & Login a test user
    const testEmail = `test_monetize_${Date.now()}@writeduo.com`;
    let userToken = '';
    let userId = '';

    await test('POST /auth/register creates a clean learner account', async () => {
      const res = await fetch(`${baseUrl}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: testEmail,
          password: 'Password123!',
          name: 'Monetization Tester',
        }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      userToken = json.data?.token || json.token;
      userId = json.data?.user?.id || json.user?.id;
      if (!userToken) throw new Error('No token returned');
    });

    // 4. Test Authenticated Free Entitlements
    await test('GET /billing/entitlements for newly registered user defaults to Free', async () => {
      const res = await fetch(`${baseUrl}/billing/entitlements`, {
        headers: { Authorization: `Bearer ${userToken}` },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      if (json.data.isPro !== false) throw new Error('New user must be Free tier');
      if (json.data.dailyAiLimit !== 10) throw new Error(`Expected Free limit 10, got ${json.data.dailyAiLimit}`);
    });

    // 5. Create Checkout Order (VietQR)
    let orderCode = '';
    let orderId = '';
    await test('POST /billing/checkout generates authentic VietQR order with server-enforced price', async () => {
      const res = await fetch(`${baseUrl}/billing/checkout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${userToken}`,
        },
        body: JSON.stringify({ planCode: 'pro_monthly' }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      const order = json.data;
      if (!order || !order.orderCode.startsWith('WD')) throw new Error('Invalid order code');
      if (order.amountVnd !== 99000) throw new Error(`Amount must be 99000, got ${order.amountVnd}`);
      if (!order.qrCodeUrl.includes('vietqr.io')) throw new Error('Missing VietQR generation');
      if (order.status !== 'pending') throw new Error('Initial order status must be pending');
      orderCode = order.orderCode;
      orderId = order._id;
    });

    // 6. Test Order Status Polling
    await test(`GET /billing/orders/${orderCode} retrieves order status`, async () => {
      const res = await fetch(`${baseUrl}/billing/orders/${orderCode}`, {
        headers: { Authorization: `Bearer ${userToken}` },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      if (json.data.orderCode !== orderCode) throw new Error('Mismatched order code');
      if (json.data.status !== 'pending') throw new Error('Status should be pending');
    });

    // 7. Security: Invalid Webhook rejection
    await test('POST /billing/webhook rejects tampered or invalid signatures', async () => {
      const res = await fetch(`${baseUrl}/billing/webhook`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-webhook-signature': 'invalid_fake_signature_hash',
        },
        body: JSON.stringify({ orderCode: 'WD999999', status: 'PAID' }),
      });
      if (res.ok) throw new Error('Server should return 400 for invalid signature');
    });

    // 8. Real Banking Webhook Activation
    await test('POST /billing/webhook with real MBBank transfer content activates Pro subscription', async () => {
      const res = await fetch(`${baseUrl}/billing/webhook`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: `Chuyen khoan WriteDuo ${orderCode}`,
          transferAmount: 99000,
          referenceCode: `MB-TXN-${Date.now()}`,
        }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      if (!json.success) throw new Error('Real webhook activation failed');
      const subId = json.subscriptionId || json.data?.subscriptionId;
      if (!subId) {
        throw new Error('Subscription ID was not returned');
      }
    });

    // 9. Verify Upgraded Entitlements
    await test('GET /billing/entitlements confirms Pro entitlements (100 AI/day & full access)', async () => {
      const res = await fetch(`${baseUrl}/billing/entitlements`, {
        headers: { Authorization: `Bearer ${userToken}` },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      if (!json.data.isPro) throw new Error('User should now be verified Pro');
      if (json.data.dailyAiLimit !== 100) throw new Error(`Expected Pro limit 100, got ${json.data.dailyAiLimit}`);
      if (!json.data.canAccessAllLevels) throw new Error('Pro user must have canAccessAllLevels');
    });

    // 10. Test Idempotency (replay webhook)
    await test('Replaying activation on completed order does not duplicate subscription', async () => {
      const res = await fetch(`${baseUrl}/billing/webhook`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: `Chuyen khoan WriteDuo ${orderCode}`,
          transferAmount: 99000,
          referenceCode: `MB-TXN-${Date.now()}`,
        }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      if (!json.success) throw new Error('Idempotent response must succeed safely');
    });

    // 11. Test AI Usage Accounting & Entitlement Enforcement
    await test('POST /ai/tutor/chat charges allowance and logs usage', async () => {
      const res = await fetch(`${baseUrl}/ai/tutor/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${userToken}`,
        },
        body: JSON.stringify({
          message: 'Giải thích thì quá khứ đơn giúp em',
          context: {
            sentenceId: 'test_sentence_1',
            sourceSentence: 'I went to school yesterday.',
            isParagraphMode: false,
          },
        }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      if (!json.success) throw new Error('Tutor question should succeed');
      if (!json.quota) throw new Error('Expected quota in tutor response');
      if (json.quota.limitToday !== 100) throw new Error('Limit should be 100 for Pro');
    });

    // 12. Test Billing History
    await test('GET /billing/history returns invoices and active subscription', async () => {
      const res = await fetch(`${baseUrl}/billing/history`, {
        headers: { Authorization: `Bearer ${userToken}` },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      if (!json.data.subscription) throw new Error('Expected active subscription in history');
      if (!Array.isArray(json.data.orders) || json.data.orders.length === 0) {
        throw new Error('Expected at least 1 completed order in history');
      }
    });

    // 13. Test Admin Monetization Analytics
    // Login as admin
    let adminToken = '';
    await test('POST /auth/login as admin account', async () => {
      const res = await fetch(`${baseUrl}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'admin@writeduo.com',
          password: 'Password123!',
        }),
      });
      if (res.ok) {
        const json = await res.json();
        adminToken = json.data?.token || json.token;
      }
    });

    if (adminToken) {
      await test('GET /billing/admin/stats returns MRR, total revenue, and AI cost estimates', async () => {
        const res = await fetch(`${baseUrl}/billing/admin/stats`, {
          headers: { Authorization: `Bearer ${adminToken}` },
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();
        const stats = json.data;
        if (typeof stats.mrrVnd !== 'number') throw new Error('Missing MRR');
        if (typeof stats.totalRevenueVnd !== 'number') throw new Error('Missing Total Revenue');
        if (typeof stats.estimatedAiCostVnd !== 'number') throw new Error('Missing Estimated AI Cost');
        console.log(`   [METRICS] MRR: ${stats.mrrVnd.toLocaleString('vi-VN')} VND | Total Revenue: ${stats.totalRevenueVnd.toLocaleString('vi-VN')} VND | AI Cost: ${stats.estimatedAiCostVnd.toLocaleString('vi-VN')} VND`);
      });
    }

  } finally {
    await app.close();
  }

  console.log(`\n=== TEST SUITE COMPLETED: ${passed} PASSED | ${failed} FAILED ===`);
  if (failed > 0) {
    process.exit(1);
  }
}

runBillingTests().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
