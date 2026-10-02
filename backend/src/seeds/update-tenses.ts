import * as dns from 'dns';
import * as dotenv from 'dotenv';
dotenv.config();

try {
  dns.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1']);
} catch {
  // Ignore if restricted
}

import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/study_vspeak';

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
      explanation: 'Diễn tả hành động xảy ra và hoàn tất trước một thời điểm trong quá khứ.',
    };
  }
  if (/\b(would|could|might|should)\b/.test(s) || /\bif\b/.test(s)) {
    return {
      tense: 'Modal / Conditional (Động từ khuyết thiếu / Câu điều kiện)',
      explanation: 'Thể hiện giả định, khả năng xảy ra hoặc lời khuyên theo ngữ cảnh.',
    };
  }
  if (/\b(is|are|am)\s+([a-z]+ed|[a-z]+en|made|taken|given|built|seen)\b/.test(s)) {
    return {
      tense: 'Passive Voice (Thể bị động)',
      explanation: 'Nhấn mạnh vào đối tượng chịu tác động của hành động thay vì người thực hiện.',
    };
  }
  if (/\b(is|are|am)\b/.test(s) && !/\b(was|were|did)\b/.test(s)) {
    return {
      tense: 'Present Simple (Hiện tại đơn)',
      explanation: 'Diễn tả một sự thật hiển nhiên, định nghĩa bản chất hoặc quy luật chung.',
    };
  }
  if (/\b(was|were|went|had|took|saw|made|came|did|began|started)\b/.test(s) || /\b(yesterday|last|ago|in \d{4})\b/.test(s)) {
    return {
      tense: 'Past Simple (Quá khứ đơn)',
      explanation: 'Diễn tả sự kiện, hành động đã hoàn tất tại thời điểm xác định trong quá khứ.',
    };
  }
  return {
    tense: 'Present Simple (Hiện tại đơn)',
    explanation: 'Diễn tả sự thật hiển nhiên hoặc quy luật chung.',
  };
}

async function run() {
  await mongoose.connect(MONGODB_URI);
  const db = mongoose.connection.db;
  if (!db) return;
  const sents = await db.collection('sentences').find({}).toArray();
  for (const s of sents) {
    const t = detectTense(s.textEn);
    await db.collection('sentences').updateOne(
      { _id: s._id },
      { $set: { 'grammarAnalysis.tense': t.tense, 'grammarAnalysis.tenseExplanationVi': t.explanation } },
    );
  }
  console.log(`Updated tenses for all ${sents.length} sentences.`);
  await mongoose.disconnect();
}

run();
