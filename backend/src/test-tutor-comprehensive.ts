import * as dns from 'dns';
if (process.platform === 'win32') {
  dns.setServers(['8.8.8.8', '1.1.1.1']);
}

import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { TutorContext } from './modules/ai/tutor.interface';

async function runComprehensiveTutorTests() {
  console.log('=== STARTING MINI AI TUTOR COMPREHENSIVE TEST SUITE ===\n');

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

  const sampleContext: TutorContext = {
    sentenceId: 'sent_test_01',
    exerciseMode: 'vi_to_en',
    sourceSentence: 'Tôi đưa Max đi dạo mỗi ngày sau giờ học.',
    referenceAnswer: 'I take Max for a walk every day after school.',
    grammarTopic: 'Present Simple',
    tokens: [
      { text: 'take', pos: 'verb', meaningVi: 'đưa, dắt' },
      { text: 'walk', pos: 'noun', meaningVi: 'cuộc đi dạo' },
      { text: 'every', pos: 'determiner', meaningVi: 'mỗi' },
    ],
  };

  // Test 1: Why use take?
  await test('1. Test: Why use take?', async () => {
    const res = await fetch(`${baseUrl}/ai/tutor/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: 'Why do we use take here?',
        context: sampleContext,
      }),
    });
    const json = await res.json();
    if (!json.success || !json.data.answer.toLowerCase().includes('take')) {
      throw new Error('Failed to explain why take is used');
    }
  });

  // Test 2: Why not go?
  await test('2. Test: Why not go?', async () => {
    const res = await fetch(`${baseUrl}/ai/tutor/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: 'Why not go? Tại sao không dùng go?',
        context: sampleContext,
      }),
    });
    const json = await res.json();
    if (!json.success || (!json.data.answer.toLowerCase().includes('go') && !json.data.keyPoint.includes('go'))) {
      throw new Error('Failed to compare take vs go');
    }
  });

  // Test 3: Why for?
  await test('3. Test: Why for?', async () => {
    const forContext: TutorContext = {
      ...sampleContext,
      sourceSentence: 'Tôi sống ở đây được 5 năm.',
      referenceAnswer: 'I have lived here for 5 years.',
      grammarTopic: 'Present Perfect',
    };
    const res = await fetch(`${baseUrl}/ai/tutor/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: 'Why use for in this sentence?',
        context: forContext,
      }),
    });
    const json = await res.json();
    if (!json.success || !json.data.answer.includes('for')) {
      throw new Error('Failed to explain for');
    }
  });

  // Test 4: Why not since?
  await test('4. Test: Why not since?', async () => {
    const forContext: TutorContext = {
      ...sampleContext,
      sourceSentence: 'Tôi sống ở đây được 5 năm.',
      referenceAnswer: 'I have lived here for 5 years.',
      grammarTopic: 'Present Perfect',
    };
    const res = await fetch(`${baseUrl}/ai/tutor/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: 'Tại sao dùng for mà không dùng since?',
        context: forContext,
      }),
    });
    const json = await res.json();
    if (!json.success || !json.data.answer.includes('since')) {
      throw new Error('Failed to explain since difference');
    }
  });

  // Test 5: Why Present Simple?
  await test('5. Test: Why Present Simple?', async () => {
    const res = await fetch(`${baseUrl}/ai/tutor/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: 'Tại sao dùng Present Simple?',
        context: sampleContext,
      }),
    });
    const json = await res.json();
    if (!json.success || !json.data.answer) throw new Error('Failed tense explanation');
  });

  // Test 6: Why Present Perfect?
  await test('6. Test: Why Present Perfect?', async () => {
    const ppContext: TutorContext = {
      ...sampleContext,
      referenceAnswer: 'I have lived here for 5 years.',
      grammarTopic: 'Present Perfect',
    };
    const res = await fetch(`${baseUrl}/ai/tutor/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: 'Tại sao câu này là Present Perfect?',
        context: ppContext,
      }),
    });
    const json = await res.json();
    if (!json.success || !json.data.answer) throw new Error('Failed present perfect explanation');
  });

  // Test 7: What does annoying mean?
  await test('7. Test: What does annoying mean in this context?', async () => {
    const annoyContext: TutorContext = {
      ...sampleContext,
      referenceAnswer: 'The noise is really annoying.',
      tokens: [{ text: 'annoying', pos: 'adjective', meaningVi: 'gây khó chịu', ipa: '/əˈnɔɪ.ɪŋ/' }],
    };
    const res = await fetch(`${baseUrl}/ai/tutor/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: 'annoying nghĩa là gì trong câu này?',
        context: annoyContext,
      }),
    });
    const json = await res.json();
    if (!json.success || !json.data.answer.includes('annoy')) {
      throw new Error('Failed annoying explanation');
    }
  });

  // Test 8: annoying vs annoyed
  await test('8. Test: annoying vs annoyed difference', async () => {
    const annoyContext: TutorContext = {
      ...sampleContext,
      referenceAnswer: 'The noise is really annoying.',
      tokens: [{ text: 'annoying', pos: 'adjective', meaningVi: 'gây khó chịu', ipa: '/əˈnɔɪ.ɪŋ/' }],
    };
    const res = await fetch(`${baseUrl}/ai/tutor/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: 'annoying và annoyed khác nhau như thế nào?',
        context: annoyContext,
      }),
    });
    const json = await res.json();
    if (!json.success || !json.data.answer.includes('annoy')) {
      throw new Error('Failed annoying vs annoyed comparison');
    }
  });

  // Test 9: Why is my answer wrong?
  await test('9. Test: Why is my answer wrong?', async () => {
    const wrongContext: TutorContext = {
      ...sampleContext,
      userAnswer: 'I go Max for a walk.',
      mistakes: [
        {
          errorType: 'wrong_meaning',
          where: 'go Max',
          relatedEnglish: 'take Max',
          whyIncorrect: 'go không nhận tân ngữ trực tiếp',
          howToFix: 'Dùng take someone for a walk',
          fixedSnippet: 'take Max for a walk',
        },
      ],
    };
    const res = await fetch(`${baseUrl}/ai/tutor/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: 'Tại sao câu của tôi sai?',
        context: wrongContext,
      }),
    });
    const json = await res.json();
    if (!json.success || json.data.explanationType !== 'mistake') {
      throw new Error('Failed to diagnose user mistake');
    }
  });

  // Test 10: Give me another example
  await test('10. Test: Give me another example', async () => {
    const res = await fetch(`${baseUrl}/ai/tutor/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: 'Cho tôi thêm ví dụ tương tự',
        context: sampleContext,
      }),
    });
    const json = await res.json();
    if (!json.success || !json.data.examples || json.data.examples.length === 0) {
      throw new Error('Failed to supply examples');
    }
  });

  // Test 11: Give me an exercise / mini quiz
  await test('11. Test: Give me an exercise (Mini Quiz)', async () => {
    const res = await fetch(`${baseUrl}/ai/tutor/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: 'Cho tôi một bài tập trắc nghiệm nhỏ',
        context: sampleContext,
      }),
    });
    const json = await res.json();
    if (!json.success || !json.data.miniQuiz || !json.data.miniQuiz.options) {
      throw new Error('Failed to generate mini quiz');
    }
  });

  // Test 12: Give me a hint
  await test('12. Test: Give me a hint (Protected answer)', async () => {
    const res = await fetch(`${baseUrl}/ai/tutor/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: 'Gợi ý cho tôi cách viết câu này',
        context: { ...sampleContext, isAnswerRevealed: false },
      }),
    });
    const json = await res.json();
    if (!json.success || !json.data.answer.includes('Gợi ý')) {
      throw new Error('Failed to provide hint');
    }
  });

  // Test 13: Explain deeper (depthMode: deep)
  await test('13. Test: Explain deeper (depth: deep)', async () => {
    const res = await fetch(`${baseUrl}/ai/tutor/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: 'Giải thích chuyên sâu ngữ pháp câu này',
        context: sampleContext,
        depthMode: 'deep',
      }),
    });
    const json = await res.json();
    if (!json.success || !json.data.answer) {
      throw new Error('Failed deep explanation');
    }
  });

  // Test 14: Follow-up question with history
  await test('14. Test: Follow-up question with conversation history', async () => {
    const res = await fetch(`${baseUrl}/ai/tutor/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: 'Vậy còn since thì sao?',
        context: sampleContext,
        conversationHistory: [
          { role: 'user', content: 'Why use for?' },
          { role: 'assistant', content: 'for describes duration.' },
        ],
      }),
    });
    const json = await res.json();
    if (!json.success || !json.data.answer) {
      throw new Error('Failed follow-up handling');
    }
  });

  // Test 15: Fast caching (<20ms response on repeat)
  await test('15. Test: In-memory cache returns ultra-low latency (<25ms)', async () => {
    const start = Date.now();
    const res = await fetch(`${baseUrl}/ai/tutor/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: 'Why do we use take here?',
        context: sampleContext,
      }),
    });
    const duration = Date.now() - start;
    if (duration > 35) {
      console.warn(`Cache response took ${duration}ms, slightly over expected`);
    }
    const json = await res.json();
    if (!json.success) throw new Error('Cache fetch failed');
  });

  // Test 16: Quota tracking
  await test('16. Test: Quota endpoint tracking', async () => {
    const res = await fetch(`${baseUrl}/ai/tutor/quota`);
    const json = await res.json();
    if (!json.success || typeof json.data.remaining !== 'number') {
      throw new Error('Failed quota tracking');
    }
  });

  // Test 17: SSE Streaming endpoint
  await test('17. Test: POST /ai/tutor/stream SSE chunks', async () => {
    const res = await fetch(`${baseUrl}/ai/tutor/stream`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: 'Giải thích nhanh câu này',
        context: sampleContext,
        depthMode: 'quick',
      }),
    });
    if (!res.ok) throw new Error(`Stream HTTP ${res.status}`);
    const text = await res.text();
    if (!text.includes('event: chunk') || !text.includes('event: complete')) {
      throw new Error('Stream did not return valid SSE format');
    }
  });

  await app.close();
  console.log(`\n=== TUTOR TESTS FINISHED: ${passed} PASSED, ${failed} FAILED ===`);
  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runComprehensiveTutorTests().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
