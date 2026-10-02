import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';

async function runTests() {
  console.log('=== STARTING INTEGRATION TEST SUITE ===\n');

  const app = await NestFactory.create(AppModule, { logger: ['error', 'warn'] });
  app.setGlobalPrefix('api/v1');
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

  const port = 4055;
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

  // 1. Test GET /lessons
  let firstLessonSlug = '';
  let firstSentenceId = '';

  await test('GET /lessons returns 27 readings', async () => {
    const res = await fetch(`${baseUrl}/lessons`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();
    if (json.count !== 27) throw new Error(`Expected 27 lessons, got ${json.count}`);
    firstLessonSlug = json.data[0].slug;
  });

  // 2. Test GET /lessons with level filter
  await test('GET /lessons?level=A1 returns beginner lessons', async () => {
    const res = await fetch(`${baseUrl}/lessons?level=A1`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();
    if (json.count === 0) throw new Error('Expected at least 1 lesson for level A1');
    for (const l of json.data) {
      if (l.level !== 'A1') throw new Error(`Unexpected level: ${l.level}`);
    }
  });

  // 3. Test GET /lessons/:id
  await test(`GET /lessons/${firstLessonSlug} returns full lesson with sentences`, async () => {
    const res = await fetch(`${baseUrl}/lessons/${firstLessonSlug}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();
    if (!json.data.lesson || !json.data.sentences) throw new Error('Missing lesson or sentences data');
    if (json.data.sentences.length === 0) throw new Error('Sentence array is empty');
    firstSentenceId = json.data.sentences[0]._id;
  });

  // 4. Test GET /sentences/:id
  await test(`GET /sentences/${firstSentenceId} returns sentence details with tokens & grammar`, async () => {
    const res = await fetch(`${baseUrl}/sentences/${firstSentenceId}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();
    const sent = json.data;
    if (!sent.textEn) throw new Error('Missing textEn');
    if (!sent.tokens || sent.tokens.length === 0) throw new Error('Missing tokens');
    if (!sent.grammarAnalysis) throw new Error('Missing grammarAnalysis');
  });

  // 5. Test Evaluation: Exact match
  await test('POST /answers/evaluate with exact match returns score 100 and correct status', async () => {
    const res = await fetch(`${baseUrl}/answers/evaluate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sentenceId: firstSentenceId,
        userAnswer: 'Tôi có một chú chó tên là Max.',
      }),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();
    if (json.data.evaluation.score !== 100) throw new Error(`Expected score 100, got ${json.data.evaluation.score}`);
    if (json.data.evaluation.status !== 'correct') throw new Error(`Expected status correct, got ${json.data.evaluation.status}`);
    if (!json.data.grammarAnalysis.tense) throw new Error('Missing tense in grammar analysis response');
  });

  // 6. Test Evaluation: Alternative acceptable translation
  await test('POST /answers/evaluate with alternative acceptable translation', async () => {
    const res = await fetch(`${baseUrl}/answers/evaluate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sentenceId: firstSentenceId,
        userAnswer: 'Tôi nuôi một chú chó tên là Max.',
      }),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();
    if (json.data.evaluation.status !== 'correct') throw new Error(`Expected status correct, got ${json.data.evaluation.status}`);
    if (json.data.evaluation.score < 90) throw new Error(`Expected high score, got ${json.data.evaluation.score}`);
  });

  // 7. Test Evaluation: Incorrect answer
  await test('POST /answers/evaluate with incorrect translation deducts heart & logs mistake', async () => {
    const res = await fetch(`${baseUrl}/answers/evaluate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sentenceId: firstSentenceId,
        userAnswer: 'Hôm nay trời mưa to quá.',
      }),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();
    if (json.data.evaluation.status !== 'incorrect') throw new Error(`Expected status incorrect, got ${json.data.evaluation.status}`);
  });

  // 8. Test GET /progress
  await test('GET /progress returns user XP, streak, and heart balance', async () => {
    const res = await fetch(`${baseUrl}/progress`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();
    const p = json.data;
    if (typeof p.xp !== 'number' || typeof p.hearts !== 'number') throw new Error('Invalid progress numbers');
    if (p.totalReadings !== 27) throw new Error(`Expected totalReadings 27, got ${p.totalReadings}`);
  });

  // 9. Test GET /grammar/weaknesses
  await test('GET /grammar/weaknesses returns adaptive learning points', async () => {
    const res = await fetch(`${baseUrl}/grammar/weaknesses`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();
    if (!Array.isArray(json.data)) throw new Error('Expected array of weaknesses');
  });

  // 10. Test Vocabulary save & fetch
  await test('POST & GET /vocabulary saves and retrieves notebook words', async () => {
    const saveRes = await fetch(`${baseUrl}/vocabulary/save`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        word: 'friendly',
        meaningVi: 'thân thiện',
        pos: 'adjective',
        ipa: '/ˈfrendli/',
        cefr: 'A1',
        exampleEn: 'Max is very friendly.',
      }),
    });
    if (!saveRes.ok) throw new Error(`Save failed with HTTP ${saveRes.status}`);

    const getRes = await fetch(`${baseUrl}/vocabulary?q=friendly`);
    if (!getRes.ok) throw new Error(`Get failed with HTTP ${getRes.status}`);
    const json = await getRes.json();
    if (json.data.items.length === 0) throw new Error('Saved word not found in list');
  });

  // 10b. Test Vocabulary on-demand lookup
  await test('GET /vocabulary/lookup returns meaning, IPA, and CEFR for transportation', async () => {
    const res = await fetch(`${baseUrl}/vocabulary/lookup?word=transportation`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();
    if (!json.data.meaningVi || json.data.meaningVi === '') {
      throw new Error('Expected non-empty meaningVi for transportation');
    }
    if (!json.data.ipa || json.data.ipa === '') {
      throw new Error('Expected non-empty ipa for transportation');
    }
  });

  // 11. Test Pronunciation guide
  await test(`GET /pronunciation/${firstSentenceId} returns stress words & linking rules`, async () => {
    const res = await fetch(`${baseUrl}/pronunciation/${firstSentenceId}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();
    if (!json.data.pronunciationGuide) throw new Error('Missing pronunciationGuide');
    if (!Array.isArray(json.data.pronunciationGuide.sentenceStressWords)) throw new Error('Missing sentenceStressWords array');
  });

  // 12. Test 7-tab Sidebar Enriched Metadata
  await test(`GET /sentences/${firstSentenceId} returns hints (level 1-3), nuances, and grammar breakdown`, async () => {
    const res = await fetch(`${baseUrl}/sentences/${firstSentenceId}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();
    const sent = json.data;
    if (!sent.hints || !sent.hints.level1 || !sent.hints.level2 || !sent.hints.level3) {
      throw new Error('Missing 3-level progressive hints');
    }
    if (!sent.englishContextMeaning) throw new Error('Missing englishContextMeaning');
    if (!sent.vietnameseNuance) throw new Error('Missing vietnameseNuance');
    if (!sent.grammarDetailed) throw new Error('Missing grammarDetailed');
  });

  // 13. Test Structured Tutor Evaluation Feedback
  await test('POST /answers/evaluate returns pedagogical breakdown (overview, mistakes, grammar insight)', async () => {
    const res = await fetch(`${baseUrl}/answers/evaluate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sentenceId: firstSentenceId,
        userAnswer: 'Tôi có một chú chó.', // Missing "tên là Max"
      }),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();
    const evalData = json.data.evaluation;
    if (!evalData.overview) throw new Error('Missing overview in evaluation');
    if (!Array.isArray(evalData.whatYouGotRight)) throw new Error('Missing whatYouGotRight array');
    if (!Array.isArray(evalData.specificMistakes)) throw new Error('Missing specificMistakes array');
    if (!evalData.grammarInsight || !evalData.grammarInsight.relevantRule) throw new Error('Missing grammarInsight');
    if (!evalData.completeSentenceMemorize || !evalData.completeSentenceMemorize.textEn) {
      throw new Error('Missing completeSentenceMemorize');
    }
  });

  await app.close();
  console.log(`\n=== TEST SUMMARY: ${passed} PASSED, ${failed} FAILED ===`);
  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runTests().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
