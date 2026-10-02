import * as dns from 'dns';
import * as dotenv from 'dotenv';
dotenv.config();

try {
  dns.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1']);
} catch {
  // Ignore if restricted
}

import mongoose from 'mongoose';
import * as fs from 'fs';
import * as path from 'path';

// Load seed data
const seedPath = path.join(__dirname, 'data', 'vspeak-readings.json');

// Mongoose connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/study_vspeak';

// Built-in starter analysis for Beginner Lesson 1 & 2 sentences to provide immediate rich Duolingo experience
const STARTER_ANALYSIS: Record<string, {
  translation: string;
  alternatives: string[];
  tense: string;
  tenseExplanationVi: string;
  components: Array<{ role: string; text: string; noteVi: string }>;
  tokens: Array<{ text: string; lemma: string; pos: string; ipa: string; cefr: string; meaningVi: string }>;
  pronunciation: {
    ipaFull: string;
    sentenceStressWords: string[];
    linkingRules: Array<{ words: string; explanationVi: string }>;
    vietnameseCommonPitfalls: string[];
  };
}> = {
  "I have a dog named Max.": {
    translation: "Tôi có một chú chó tên là Max.",
    alternatives: ["Tôi có một con chó tên là Max.", "Tôi nuôi một chú chó tên là Max."],
    tense: "Present Simple (Hiện tại đơn)",
    tenseExplanationVi: "Dùng để diễn tả một sự thật hiển nhiên hoặc sở hữu ở hiện tại.",
    components: [
      { role: "Subject", text: "I", noteVi: "Chủ ngữ ngôi thứ nhất số ít" },
      { role: "Verb", text: "have", noteVi: "Động từ chính (có/sở hữu)" },
      { role: "Object", text: "a dog named Max", noteVi: "Tân ngữ trực tiếp, có cụm quá khứ phân từ 'named Max' bổ nghĩa" }
    ],
    tokens: [
      { text: "I", lemma: "I", pos: "pronoun", ipa: "/aɪ/", cefr: "A1", meaningVi: "tôi" },
      { text: "have", lemma: "have", pos: "verb", ipa: "/hæv/", cefr: "A1", meaningVi: "có" },
      { text: "a", lemma: "a", pos: "article", ipa: "/ə/", cefr: "A1", meaningVi: "một" },
      { text: "dog", lemma: "dog", pos: "noun", ipa: "/dɔːɡ/", cefr: "A1", meaningVi: "con chó" },
      { text: "named", lemma: "name", pos: "verb", ipa: "/neɪmd/", cefr: "A1", meaningVi: "được đặt tên là" },
      { text: "Max", lemma: "Max", pos: "noun", ipa: "/mæks/", cefr: "A1", meaningVi: "tên riêng Max" }
    ],
    pronunciation: {
      ipaFull: "/aɪ hæv ə dɔːɡ neɪmd mæks/",
      sentenceStressWords: ["have", "dog", "Max"],
      linkingRules: [
        { words: "have a", explanationVi: "Nối phụ âm /v/ của 'have' sang nguyên âm /ə/ của 'a' thành /hæ.və/" }
      ],
      vietnameseCommonPitfalls: [
        "Người Việt thường quên phát âm âm đuôi /v/ trong 'have' và /ɡ/ trong 'dog'.",
        "Chú ý phát âm cụm phụ âm /ks/ ở đuôi từ 'Max'."
      ]
    }
  },
  "He is three years old and has brown and white fur.": {
    translation: "Nó được ba tuổi và có bộ lông màu nâu trắng.",
    alternatives: ["Nó 3 tuổi và có lông màu nâu trắng.", "Chú chó được ba tuổi, lông màu nâu và trắng."],
    tense: "Present Simple (Hiện tại đơn)",
    tenseExplanationVi: "Dùng để miêu tả đặc điểm ngoại hình và độ tuổi hiện tại.",
    components: [
      { role: "Subject", text: "He", noteVi: "Chủ ngữ" },
      { role: "Verb", text: "is", noteVi: "Động từ to be" },
      { role: "Complement", text: "three years old", noteVi: "Bổ ngữ chỉ độ tuổi" },
      { role: "Conjunction", text: "and", noteVi: "Liên từ nối hai mệnh đề đẳng lập" },
      { role: "Verb", text: "has", noteVi: "Động từ chia theo ngôi He" },
      { role: "Object", text: "brown and white fur", noteVi: "Cụm danh từ tân ngữ" }
    ],
    tokens: [
      { text: "three", lemma: "three", pos: "numeral", ipa: "/θriː/", cefr: "A1", meaningVi: "ba" },
      { text: "years", lemma: "year", pos: "noun", ipa: "/jɪrz/", cefr: "A1", meaningVi: "năm/tuổi" },
      { text: "old", lemma: "old", pos: "adjective", ipa: "/oʊld/", cefr: "A1", meaningVi: "tuổi" },
      { text: "brown", lemma: "brown", pos: "adjective", ipa: "/braʊn/", cefr: "A1", meaningVi: "màu nâu" },
      { text: "white", lemma: "white", pos: "adjective", ipa: "/waɪt/", cefr: "A1", meaningVi: "màu trắng" },
      { text: "fur", lemma: "fur", pos: "noun", ipa: "/fɜːr/", cefr: "A2", meaningVi: "lông thú" }
    ],
    pronunciation: {
      ipaFull: "/hiː ɪz θriː jɪrz oʊld ænd hæz braʊn ænd waɪt fɜːr/",
      sentenceStressWords: ["three", "years", "old", "brown", "white", "fur"],
      linkingRules: [
        { words: "years old", explanationVi: "Nối âm /z/ trong 'years' với nguyên âm /oʊ/ trong 'old' thành /jɪr.zoʊld/" },
        { words: "is three", explanationVi: "Chuyển mượt từ âm /z/ sang âm vô thanh /θ/" }
      ],
      vietnameseCommonPitfalls: [
        "Âm /θ/ trong 'three' không được đọc thành /t/ (ti) hoặc /x/ (xri), đặt đầu lưỡi giữa hai hàm răng và thổi hơi.",
        "Âm /z/ đuôi trong 'years' thường bị nuốt mất."
      ]
    }
  },
  "Max is very friendly and loves to play fetch.": {
    translation: "Max rất thân thiện và thích chơi trò ném bắt bóng.",
    alternatives: ["Max rất thân thiện và thích chơi trò nhặt bóng.", "Nó rất thân thiện và thích chơi đuổi bắt bóng."],
    tense: "Present Simple (Hiện tại đơn)",
    tenseExplanationVi: "Dùng để diễn tả tính cách và sở thích thói quen.",
    components: [
      { role: "Subject", text: "Max", noteVi: "Chủ ngữ" },
      { role: "Verb", text: "is", noteVi: "To be" },
      { role: "Complement", text: "very friendly", noteVi: "Bổ ngữ tính từ" },
      { role: "Verb", text: "loves to play fetch", noteVi: "Cụm động từ chỉ sở thích" }
    ],
    tokens: [
      { text: "friendly", lemma: "friendly", pos: "adjective", ipa: "/ˈfrendli/", cefr: "A1", meaningVi: "thân thiện" },
      { text: "loves", lemma: "love", pos: "verb", ipa: "/lʌvz/", cefr: "A1", meaningVi: "rất thích/yêu thích" },
      { text: "play", lemma: "play", pos: "verb", ipa: "/pleɪ/", cefr: "A1", meaningVi: "chơi" },
      { text: "fetch", lemma: "fetch", pos: "noun", ipa: "/fetʃ/", cefr: "B1", meaningVi: "trò chơi ném gậy/bóng để chó nhặt về" }
    ],
    pronunciation: {
      ipaFull: "/mæks ɪz ˈveri ˈfrendli ænd lʌvz tu pleɪ fetʃ/",
      sentenceStressWords: ["friendly", "loves", "play", "fetch"],
      linkingRules: [
        { words: "Max is", explanationVi: "Nối âm /s/ của 'Max' sang /ɪ/ của 'is'" }
      ],
      vietnameseCommonPitfalls: [
        "Đuôi /tʃ/ trong 'fetch' phải bật rõ âm bật ch, tránh đọc thành /fet/."
      ]
    }
  }
};

async function seed() {
  console.log('Connecting to MongoDB at:', MONGODB_URI);
  await mongoose.connect(MONGODB_URI);
  console.log('MongoDB connected successfully.');

  const db = mongoose.connection.db;
  if (!db) {
    throw new Error('Database connection failed');
  }

  // Clear existing data
  console.log('Clearing existing collections...');
  await db.collection('readings').deleteMany({});
  await db.collection('sentences').deleteMany({});
  await db.collection('users').deleteMany({});
  await db.collection('userprogresses').deleteMany({});

  // 1. Create Default Demo User
  console.log('Creating demo user...');
  const demoUserId = new mongoose.Types.ObjectId();
  await db.collection('users').insertOne({
    _id: demoUserId,
    email: 'learner@vspeak.local',
    name: 'Nguyễn Văn Học',
    passwordHash: '',
    avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=DuolingoLearner',
    role: 'user',
    createdAt: new Date(),
    updatedAt: new Date()
  });

  // 2. Create Default User Progress
  await db.collection('userprogresses').insertOne({
    userId: demoUserId,
    xp: 140,
    streakCount: 3,
    lastActiveDate: new Date(),
    hearts: 5,
    lastHeartRefill: new Date(),
    currentLevel: 'A1',
    completedReadings: [],
    completedSentences: [],
    dailyGoalXp: 50,
    todayXp: 20,
    createdAt: new Date(),
    updatedAt: new Date()
  });
  console.log('Demo user created (learner@vspeak.local, XP: 140, Streak: 3, Hearts: 5)');

  // 3. Load Readings Data
  if (!fs.existsSync(seedPath)) {
    throw new Error(`Seed data file not found at: ${seedPath}`);
  }

  const rawData = fs.readFileSync(seedPath, 'utf8');
  const readings = JSON.parse(rawData);
  console.log(`Loaded ${readings.length} readings from JSON file.`);

  let totalSentencesCount = 0;

  // Load enriched data if available
  const enrichedPath = path.join(__dirname, 'data', 'vspeak-enriched.json');
  const enrichedMap = new Map();
  if (fs.existsSync(enrichedPath)) {
    const enrichedList = JSON.parse(fs.readFileSync(enrichedPath, 'utf8'));
    for (const item of enrichedList) {
      if (item.textEn) {
        enrichedMap.set(item.textEn.trim(), item);
      }
    }
  }

  for (const readingData of readings) {
    const readingId = new mongoose.Types.ObjectId();

    await db.collection('readings').insertOne({
      _id: readingId,
      slug: readingData.slug,
      title: readingData.title,
      topic: readingData.topic,
      level: readingData.level,
      category: readingData.category,
      wordCount: readingData.wordCount,
      totalSentences: readingData.totalSentences,
      paragraphs: readingData.paragraphs,
      order: readingData.order,
      isPublished: true,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    // Insert Sentences
    const sentencesDocs = readingData.sentences.map((sent: any) => {
      const cleanText = sent.textEn.trim();
      const starter = STARTER_ANALYSIS[cleanText];
      const enriched = enrichedMap.get(cleanText);

      return {
        _id: new mongoose.Types.ObjectId(),
        readingId: readingId,
        paragraphIndex: sent.paragraphIndex,
        sentenceIndex: sent.sentenceIndex,
        textEn: cleanText,
        audioUrl: '',
        primaryTranslationVi: starter ? starter.translation : enriched?.primaryTranslationVi || '',
        alternativeTranslations: starter ? starter.alternatives : enriched?.alternativeTranslations || [],
        tokens: starter ? starter.tokens : enriched?.tokens || cleanText.replace(/[^a-zA-Z0-9\s]/g, '').split(/\s+/).map((w: string) => ({
          text: w,
          lemma: w.toLowerCase(),
          pos: 'word',
          ipa: '',
          cefr: readingData.level,
          meaningVi: ''
        })),
        grammarAnalysis: starter ? {
          tense: starter.tense,
          tenseExplanationVi: starter.tenseExplanationVi,
          components: starter.components,
          notableStructures: []
        } : enriched?.grammarAnalysis || {
          tense: 'Present Simple (Hiện tại đơn)',
          tenseExplanationVi: 'Diễn tả một sự thật hiển nhiên hoặc quy luật chung.',
          components: [],
          notableStructures: []
        },
        pronunciationGuide: starter ? starter.pronunciation : enriched?.pronunciationGuide || {
          ipaFull: '',
          sentenceStressWords: [],
          linkingRules: [],
          vietnameseCommonPitfalls: []
        },
        isAnalyzed: true,
        createdAt: new Date(),
        updatedAt: new Date()
      };
    });

    await db.collection('sentences').insertMany(sentencesDocs);
    totalSentencesCount += sentencesDocs.length;
  }

  console.log(`Seeding completed successfully!`);
  console.log(`- Inserted Readings: ${readings.length}`);
  console.log(`- Inserted Sentences: ${totalSentencesCount}`);

  await mongoose.disconnect();
  console.log('MongoDB connection closed.');
}

seed().catch((err) => {
  console.error('Seeding failed:', err);
  process.exit(1);
});
