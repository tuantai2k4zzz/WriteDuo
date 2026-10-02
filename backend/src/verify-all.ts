async function runFullVerification() {
  console.log('====================================================');
  console.log('🚀 STUDY VSPEAK: COMPREHENSIVE SYSTEM VERIFICATION');
  console.log('====================================================\n');

  let passed = 0;
  let failed = 0;

  async function check(name: string, fn: () => Promise<void>) {
    try {
      await fn();
      console.log(`✅ [PASS] ${name}`);
      passed++;
    } catch (err: any) {
      console.error(`❌ [FAIL] ${name}: ${err.message}`);
      failed++;
    }
  }

  // 1. Verify Frontend Next.js Server
  await check('Frontend Next.js running on http://localhost:3000', async () => {
    const res = await fetch('http://localhost:3000');
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const html = await res.text();
    if (!html.includes('<html lang="vi"')) {
      throw new Error('Unexpected HTML response');
    }
  });

  // 2. Verify Backend Nest.js Server
  await check('Backend running on http://localhost:4000/api/v1', async () => {
    const res = await fetch('http://localhost:4000/api/v1/lessons');
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();
    if (json.count !== 27) throw new Error(`Expected 27 lessons, got ${json.count}`);
  });

  // 3. Verify Managing Workplace Conflict Lesson Data
  let lesson: any = null;
  let firstSentence: any = null;
  await check('GET /lessons/managing-workplace-conflict returns enriched data', async () => {
    const res = await fetch('http://localhost:4000/api/v1/lessons/managing-workplace-conflict');
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();
    lesson = json.data.lesson;
    const sentences = json.data.sentences;
    if (!sentences || sentences.length === 0) throw new Error('No sentences found');
    firstSentence = sentences[0];

    // Check sentence 0
    if (!firstSentence.textEn.includes('Conflict is an inevitable feature')) {
      throw new Error(`Sentence textEn mismatch: ${firstSentence.textEn}`);
    }
    // Check primaryTranslationVi is NOT blank (Issue 2)
    if (!firstSentence.primaryTranslationVi || firstSentence.primaryTranslationVi.trim().length === 0) {
      throw new Error('primaryTranslationVi is empty!');
    }
    console.log(`   ➔ English: "${firstSentence.textEn.slice(0, 70)}..."`);
    console.log(`   ➔ Vietnamese: "${firstSentence.primaryTranslationVi.slice(0, 70)}..."`);
  });

  // 4. Verify Token "backgrounds" (Issue 1)
  await check('Token "backgrounds" has accurate definition without dummy text', async () => {
    const bgToken = firstSentence.tokens?.find((t: any) => t.text.toLowerCase().includes('background'));
    if (!bgToken) throw new Error('Token "backgrounds" not found in sentence');
    if (!bgToken.meaningVi || bgToken.meaningVi.includes('Đang cập nhật')) {
      throw new Error(`Invalid meaningVi: "${bgToken.meaningVi}"`);
    }
    if (bgToken.exampleEn?.includes('Example with')) {
      throw new Error(`Found synthetic example: "${bgToken.exampleEn}"`);
    }
    console.log(`   ➔ Word: ${bgToken.text} (${bgToken.pos}, ${bgToken.cefr}, ${bgToken.ipa})`);
    console.log(`   ➔ Meaning: "${bgToken.meaningVi}"`);
    console.log(`   ➔ Contextual Example: "${bgToken.exampleEn?.slice(0, 60)}..."`);
  });

  // 5. Verify On-demand Word Lookup API (GET /vocabulary/lookup?word=backgrounds)
  await check('GET /vocabulary/lookup returns instant contextual definition', async () => {
    const res = await fetch(
      `http://localhost:4000/api/v1/vocabulary/lookup?word=backgrounds&context=${encodeURIComponent(
        firstSentence.textEn,
      )}`,
    );
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();
    const data = json.data;
    if (!data.meaningVi || data.meaningVi.includes('từ vựng:')) {
      throw new Error(`Word lookup returned fallback: ${data.meaningVi}`);
    }
    console.log(`   ➔ Lookup "backgrounds" => ${data.meaningVi} (${data.ipa})`);
  });

  // 6. Verify Evaluation in VI -> EN Mode (Issue 2 & 3)
  await check('Evaluation in mode [vi_to_en] tests English against target sentence', async () => {
    const res = await fetch('http://localhost:4000/api/v1/answers/evaluate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sentenceId: firstSentence._id,
        userAnswer: firstSentence.textEn,
        mode: 'vi_to_en',
      }),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();
    const data = json.data;
    const evalScore = data.evaluation?.score ?? data.score;
    if (evalScore < 90) throw new Error(`Expected score >= 90 for exact match, got ${evalScore}`);
    if (data.referenceAnswer !== firstSentence.textEn) {
      throw new Error(`referenceAnswer should be English in vi_to_en mode, got: ${data.referenceAnswer}`);
    }
    console.log(`   ➔ Mode [vi_to_en] exact match score: ${evalScore}%`);
    console.log(`   ➔ referenceAnswer in vi_to_en: "${data.referenceAnswer.slice(0, 60)}..."`);
  });

  // 7. Verify Paragraph Challenge in VI -> EN Mode
  await check('POST /answers/evaluate-paragraph works in vi_to_en mode', async () => {
    const res = await fetch('http://localhost:4000/api/v1/answers/evaluate-paragraph', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        lessonId: lesson._id,
        userParagraph: 'Conflict is an inevitable feature of any workplace where people work together toward shared goals.',
        mode: 'vi_to_en',
      }),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();
    const data = json.data;
    if (data.score < 20) throw new Error(`Unexpected low score: ${data.score}`);
    if (!data.referenceParagraph || data.referenceParagraph.trim().length === 0) {
      throw new Error('referenceParagraph is empty!');
    }
    console.log(`   ➔ Paragraph Boss Challenge Score: ${data.score}%`);
    console.log(`   ➔ 5-Axis HUD: Meaning: ${data.metrics?.meaning}%, Grammar: ${data.metrics?.grammar}%, Vocab: ${data.metrics?.vocabulary}%`);
  });

  // 8. Verify all 484 sentences in MongoDB have non-empty primaryTranslationVi
  await check('All 484 sentences across all 27 lessons have valid primaryTranslationVi', async () => {
    const allRes = await fetch('http://localhost:4000/api/v1/lessons');
    const allLessons = (await allRes.json()).data;
    let emptyCount = 0;
    let checkedCount = 0;

    for (const l of allLessons) {
      const lRes = await fetch(`http://localhost:4000/api/v1/lessons/${l.slug}`);
      const lData = await lRes.json();
      for (const s of lData.data.sentences) {
        checkedCount++;
        if (!s.primaryTranslationVi || s.primaryTranslationVi.trim().length === 0) {
          emptyCount++;
        }
      }
    }

    if (emptyCount > 0) {
      throw new Error(`Found ${emptyCount} sentences with empty primaryTranslationVi out of ${checkedCount}`);
    }
    console.log(`   ➔ Checked ${checkedCount} sentences across all 27 readings: 0 empty translations!`);
  });

  console.log('\n====================================================');
  console.log(`SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log('====================================================');

  if (failed > 0) {
    process.exit(1);
  }
}

runFullVerification().catch((e) => {
  console.error('Test runner fatal error:', e);
  process.exit(1);
});
