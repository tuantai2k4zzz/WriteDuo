import mongoose from 'mongoose';
import * as fs from 'fs';
import * as path from 'path';
import { COMMON_DICTIONARY, lookupLocalDictionary } from '../modules/vocabulary/dictionary.data';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/study_vspeak';

async function translateText(text: string): Promise<string> {
  try {
    const res = await fetch(
      'https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=vi&dt=t&q=' +
        encodeURIComponent(text),
    );
    if (!res.ok) return '';
    const data = await res.json();
    return (data[0] || []).map((x: any) => x[0]).join('').trim();
  } catch {
    return '';
  }
}

function detectTense(sentence: string): { tense: string; explanation: string } {
  const s = sentence.toLowerCase();
  if (/\b(will|shall)\b/.test(s) || /'ll\b/.test(s)) {
    return {
      tense: 'Future Simple (Tương lai đơn)',
      explanation: 'Diễn tả một dự đoán, kế hoạch hoặc quyết định được đưa ra trong tương lai.',
    };
  }
  if (/\b(have|has)\s+([a-z]+ed|[a-z]+en|been|done|seen|made|gone|taken)\b/.test(s)) {
    return {
      tense: 'Present Perfect (Hiện tại hoàn thành)',
      explanation: 'Diễn đạt trải nghiệm, hành động bắt đầu trong quá khứ kéo dài hoặc để lại kết quả ở hiện tại.',
    };
  }
  if (/\bhad\s+([a-z]+ed|[a-z]+en|been|done|seen|made)\b/.test(s)) {
    return {
      tense: 'Past Perfect (Quá khứ hoàn thành)',
      explanation: 'Diễn tả hành động xảy ra và hoàn tất trước một thời điểm hoặc hành động khác trong quá khứ.',
    };
  }
  if (/\b(is|are|am|was|were|be|been|being)\s+([a-z]+ed|[a-z]+en|made|taken|given|built|seen)\b/.test(s)) {
    return {
      tense: 'Passive Voice (Thể bị động)',
      explanation: 'Nhấn mạnh vào đối tượng chịu tác động của hành động thay vì người thực hiện.',
    };
  }
  if (/\b(would|could|might|should)\b/.test(s) || /\bif\b/.test(s)) {
    return {
      tense: 'Modal / Conditional (Động từ khuyết thiếu / Câu điều kiện)',
      explanation: 'Thể hiện giả định, khả năng xảy ra hoặc lời khuyên theo ngữ cảnh.',
    };
  }
  if (/\b(yesterday|last|ago|in \d{4})\b/.test(s) || /\b(was|were|went|had|took|saw|made|came|did|began|started)\b/.test(s) || /\b[a-z]+ed\b/.test(s)) {
    return {
      tense: 'Past Simple (Quá khứ đơn)',
      explanation: 'Diễn tả sự kiện, hành động đã hoàn tất tại thời điểm xác định trong quá khứ.',
    };
  }
  return {
    tense: 'Present Simple (Hiện tại đơn)',
    explanation: 'Diễn tả một sự thật hiển nhiên, đặc điểm bản chất hoặc thói quen, quy luật chung.',
  };
}

function extractComponents(sentence: string) {
  const words = sentence.trim().split(/\s+/);
  const subjectEnd = Math.min(Math.max(1, Math.floor(words.length * 0.25)), 3);
  const subjectText = words.slice(0, subjectEnd).join(' ');
  const verbText = words[subjectEnd] || 'is/are/action';
  const objectText = words.slice(subjectEnd + 1).join(' ') || 'bổ ngữ câu';

  return [
    { role: 'Subject', text: subjectText, noteVi: 'Chủ ngữ thực hiện hoặc được miêu tả' },
    { role: 'Verb', text: verbText, noteVi: 'Động từ chính / vị ngữ của câu' },
    { role: 'Object / Complement', text: objectText, noteVi: 'Tân ngữ, trạng từ hoặc mệnh đề bổ nghĩa' },
  ];
}

function generateTokens(textEn: string, level: string) {
  const words = textEn.replace(/[^a-zA-Z0-9\s-]/g, ' ').split(/\s+/).filter(Boolean);
  return words.map((w) => {
    const local = lookupLocalDictionary(w);
    const cleanW = w.toLowerCase().replace(/[^a-z0-9]/g, '');
    return {
      text: w,
      lemma: cleanW,
      pos: local?.pos || 'word',
      ipa: local?.ipa || `/${cleanW}/`,
      cefr: local?.cefr || level || 'B1',
      meaningVi: local?.meaningVi || '',
    };
  });
}

function generatePronunciation(textEn: string, tokens: any[]) {
  const contentWords = tokens
    .filter((t) => ['noun', 'verb', 'adjective'].includes(t.pos?.toLowerCase()))
    .map((t) => t.text)
    .slice(0, 5);

  const ipaWords = tokens.map((t) => t.ipa ? t.ipa.replace(/\//g, '') : t.lemma).join(' ');

  return {
    ipaFull: `/${ipaWords}/`,
    sentenceStressWords: contentWords.length > 0 ? contentWords : tokens.slice(0, 3).map((t) => t.text),
    linkingRules: [
      {
        words: `${tokens[0]?.text || ''} ${tokens[1]?.text || ''}`.trim(),
        explanationVi: 'Nối âm mượt mà giữa các từ liền kề theo ngữ điệu tự nhiên.',
      },
    ],
    vietnameseCommonPitfalls: [
      'Chú ý phát âm rõ âm cuối (ending sounds) như /s/, /z/, /t/, /d/.',
      'Giữ nhịp điệu trọng âm câu (Sentence Stress) và hạ giọng tự nhiên ở cuối câu trần thuật.',
    ],
  };
}

async function runEnrichment() {
  console.log('Connecting to MongoDB at:', MONGODB_URI);
  await mongoose.connect(MONGODB_URI);
  console.log('MongoDB connected.');

  const db = mongoose.connection.db;
  if (!db) throw new Error('No DB connection');

  const sentences = await db.collection('sentences').find({}).sort({ readingId: 1, paragraphIndex: 1, sentenceIndex: 1 }).toArray();
  console.log(`Found ${sentences.length} sentences in DB.`);

  let enrichedCount = 0;
  const batchSize = 10;

  for (let i = 0; i < sentences.length; i += batchSize) {
    const batch = sentences.slice(i, i + batchSize);
    await Promise.all(
      batch.map(async (doc) => {
        let translationVi = doc.primaryTranslationVi;
        if (!translationVi || translationVi.trim() === '') {
          translationVi = await translateText(doc.textEn);
        }

        const tenseInfo = detectTense(doc.textEn);
        const components = extractComponents(doc.textEn);
        const tokens = generateTokens(doc.textEn, doc.tokens?.[0]?.cefr || 'B1');
        const pronunciation = generatePronunciation(doc.textEn, tokens);

        // Alternatives: small variations
        const alt1 = translationVi ? `${translationVi.replace(/^[A-ZÀ-Ỹ]/, (c) => c.toLowerCase())}` : '';
        const alternatives = [translationVi, alt1].filter(Boolean);

        await db.collection('sentences').updateOne(
          { _id: doc._id },
          {
            $set: {
              primaryTranslationVi: translationVi,
              alternativeTranslations: doc.alternativeTranslations?.length > 0 ? doc.alternativeTranslations : alternatives,
              tokens,
              grammarAnalysis: {
                tense: doc.grammarAnalysis?.tense || tenseInfo.tense,
                tenseExplanationVi: doc.grammarAnalysis?.tenseExplanationVi || tenseInfo.explanation,
                components: doc.grammarAnalysis?.components?.length > 0 ? doc.grammarAnalysis.components : components,
                notableStructures: doc.grammarAnalysis?.notableStructures || [],
              },
              pronunciationGuide: {
                ipaFull: doc.pronunciationGuide?.ipaFull || pronunciation.ipaFull,
                sentenceStressWords: doc.pronunciationGuide?.sentenceStressWords?.length > 0 ? doc.pronunciationGuide.sentenceStressWords : pronunciation.sentenceStressWords,
                linkingRules: doc.pronunciationGuide?.linkingRules?.length > 0 ? doc.pronunciationGuide.linkingRules : pronunciation.linkingRules,
                vietnameseCommonPitfalls: doc.pronunciationGuide?.vietnameseCommonPitfalls?.length > 0 ? doc.pronunciationGuide.vietnameseCommonPitfalls : pronunciation.vietnameseCommonPitfalls,
              },
              isAnalyzed: true,
              updatedAt: new Date(),
            },
          },
        );
        enrichedCount++;
      }),
    );
    process.stdout.write(`\rEnriched ${enrichedCount}/${sentences.length} sentences...`);
  }

  console.log(`\nAll ${enrichedCount} sentences in MongoDB enriched successfully!`);
  await mongoose.disconnect();
}

runEnrichment().catch((err) => {
  console.error('Enrichment failed:', err);
  process.exit(1);
});
