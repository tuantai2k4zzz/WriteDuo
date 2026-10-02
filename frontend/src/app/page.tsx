'use client';

import React, { useState, useEffect } from 'react';
import { useLearningStore } from '../lib/store';
import { api } from '../lib/api';
import { Lesson, ReviewQueueItem } from '../types';
import { Header } from '../components/Header';
import { ReadingCard } from '../components/ReadingCard';
import { InteractiveSentence } from '../components/InteractiveSentence';
import { FeedbackDrawer } from '../components/FeedbackDrawer';
import { WordModal } from '../components/WordModal';
import { LessonCompleteModal } from '../components/LessonCompleteModal';
import { VocabularyTab } from '../components/VocabularyTab';
import { WeaknessesTab } from '../components/WeaknessesTab';
import { ParagraphChallenge } from '../components/ParagraphChallenge';
import { Sparkles, Compass, Brain, ArrowRight, ShieldCheck } from 'lucide-react';
import { motion } from 'framer-motion';

export default function Home() {
  const {
    currentTab,
    selectedLevel,
    setSelectedLevel,
    activeLesson,
    isParagraphChallengeActive,
    startLesson,
    setUserProgress,
  } = useLearningStore();

  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [reviewItems, setReviewItems] = useState<ReviewQueueItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectingLessonId, setSelectingLessonId] = useState<string | null>(null);

  // Load progress, lessons, and proactive review queue on mount
  useEffect(() => {
    async function initData() {
      try {
        setLoading(true);
        const [progressData, lessonsData, reviewData] = await Promise.all([
          api.getProgress(),
          api.getLessons(selectedLevel),
          api.getSmartReviewQueue(),
        ]);
        setUserProgress(progressData);
        setLessons(lessonsData);
        setReviewItems(reviewData.items || []);
      } catch (err) {
        console.error('Failed to load initial data:', err);
      } finally {
        setLoading(false);
      }
    }
    initData();
  }, [selectedLevel, setUserProgress]);

  const handleSelectLesson = async (lesson: Lesson) => {
    try {
      setSelectingLessonId(lesson._id);
      const fullLesson = await api.getLesson(lesson.slug);

      // PROACTIVE INTERLEAVING: If there are review items due, inject 1 review sentence
      // right into the middle of the lesson to surprise-test retention!
      let sentences = [...fullLesson.sentences];
      if (reviewItems.length > 0 && sentences.length >= 3) {
        const reviewItem = reviewItems[0];
        const injectedSentence = {
          _id: reviewItem.id,
          readingId: fullLesson.lesson._id,
          paragraphIndex: 1,
          sentenceIndex: 2,
          textEn: reviewItem.textEn,
          primaryTranslationVi: reviewItem.primaryTranslationVi,
          alternativeTranslations: [],
          tokens: reviewItem.textEn.split(/\s+/).map((w) => ({
            text: w,
            lemma: w.toLowerCase(),
            pos: 'word',
            ipa: '',
            cefr: fullLesson.lesson.level,
            meaningVi: '',
          })),
          grammarAnalysis: {
            tense: reviewItem.grammarTense,
            tenseExplanationVi: reviewItem.tenseExplanationVi,
            components: [],
            notableStructures: [],
          },
          pronunciationGuide: {
            ipaFull: '',
            sentenceStressWords: reviewItem.stressWords,
            linkingRules: reviewItem.linkingRules,
            vietnameseCommonPitfalls: [],
          },
          isAnalyzed: true,
          isSpacedRecall: true,
        };
        // Insert at index 2
        sentences.splice(2, 0, injectedSentence as any);
      }

      startLesson(fullLesson.lesson, sentences);
    } catch (err: any) {
      alert(`Không thể tải bài học: ${err.message}`);
    } finally {
      setSelectingLessonId(null);
    }
  };

  // Dedicated Proactive Spaced Review Session
  const handleStartSmartReview = () => {
    if (reviewItems.length === 0) return;

    const virtualLesson: Lesson = {
      _id: 'smart-review-session',
      slug: 'smart-review-session',
      title: 'Hồi Tưởng Chủ Động (Spaced Repetition)',
      topic: 'Củng cố phản xạ chống quên',
      level: 'B1',
      category: 'review',
      wordCount: 120,
      totalSentences: reviewItems.length,
      order: 0,
    };

    const virtualSentences = reviewItems.map((item, idx) => ({
      _id: item.id,
      readingId: 'smart-review-session',
      paragraphIndex: 0,
      sentenceIndex: idx,
      textEn: item.textEn,
      primaryTranslationVi: item.primaryTranslationVi,
      alternativeTranslations: [],
      tokens: item.textEn.split(/\s+/).map((w) => ({
        text: w,
        lemma: w.toLowerCase(),
        pos: 'word',
        ipa: '',
        cefr: 'B1',
        meaningVi: '',
      })),
      grammarAnalysis: {
        tense: item.grammarTense,
        tenseExplanationVi: item.tenseExplanationVi,
        components: [],
        notableStructures: [],
      },
      pronunciationGuide: {
        ipaFull: '',
        sentenceStressWords: item.stressWords,
        linkingRules: item.linkingRules,
        vietnameseCommonPitfalls: [],
      },
      isAnalyzed: true,
      isSpacedRecall: true,
    }));

    startLesson(virtualLesson, virtualSentences as any);
  };

  const levelOptions = [
    { label: 'Tất Cả', value: 'ALL' },
    { label: 'A1 Căn Bản', value: 'A1' },
    { label: 'B1 Trung Cấp', value: 'B1' },
    { label: 'B2 Nâng Cao', value: 'B2' },
    { label: 'C1 Cao Cấp', value: 'C1' },
    { label: 'IELTS Academic', value: 'IELTS' },
    { label: 'TOEIC Công Sở', value: 'TOEIC' },
  ];

  // If in an active learning session, render interactive screen
  if (activeLesson) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-[#060a12] transition-colors duration-300">
        {isParagraphChallengeActive ? (
          <ParagraphChallenge />
        ) : (
          <InteractiveSentence />
        )}
        <FeedbackDrawer />
        <WordModal />
        <LessonCompleteModal />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#03070f' }}>
      <Header />

      <main className="flex-1 pb-16">
        {currentTab === 'vocab' && <VocabularyTab />}
        {currentTab === 'weakness' && <WeaknessesTab />}

        {currentTab === 'learn' && (
          <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">

            {/* ── HERO BANNER ── */}
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="relative overflow-hidden rounded-3xl p-8 sm:p-10 mb-8"
              style={{
                background: 'linear-gradient(135deg, rgba(4,10,25,0.98) 0%, rgba(6,15,40,0.98) 60%, rgba(8,20,50,0.98) 100%)',
                border: '1px solid rgba(6,182,212,0.3)',
                boxShadow: '0 0 60px rgba(6,182,212,0.08), inset 0 1px 0 rgba(6,182,212,0.15)',
              }}
            >
              {/* Scan line top */}
              <div className="absolute inset-x-0 top-0 h-px" style={{ background: 'linear-gradient(90deg, transparent, #06b6d4, #f59e0b, #06b6d4, transparent)' }} />
              {/* Scan line bottom */}
              <div className="absolute inset-x-0 bottom-0 h-px" style={{ background: 'linear-gradient(90deg, transparent, rgba(6,182,212,0.4), transparent)' }} />

              {/* HUD corner decorators */}
              <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-cyan-400/50 rounded-tl-3xl" />
              <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-amber-400/50 rounded-tr-3xl" />
              <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-cyan-400/30 rounded-bl-3xl" />
              <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-amber-400/30 rounded-br-3xl" />

              {/* Decorative glow orbs */}
              <div className="absolute -right-10 -top-10 h-64 w-64 rounded-full bg-cyan-400/5 blur-3xl pointer-events-none" />
              <div className="absolute right-20 bottom-0 h-40 w-40 rounded-full bg-amber-400/5 blur-2xl pointer-events-none" />

              <div className="relative z-10 max-w-2xl">
                <div className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-black backdrop-blur-md mb-3 font-mono"
                  style={{ background: 'rgba(6,182,212,0.1)', border: '1px solid rgba(6,182,212,0.3)', color: '#67e8f9' }}>
                  <Sparkles className="h-3.5 w-3.5 text-amber-400" />
                  <span>AI-POWERED LEARNING SYSTEM v2.0</span>
                </div>
                <h1 className="text-3xl sm:text-4xl font-black tracking-tight leading-tight mb-3 text-white">
                  Luyện Dịch & Viết Tiếng Anh{' '}
                  <span style={{ color: '#06b6d4' }}>Tương Tác</span>
                </h1>
                <p className="text-sm sm:text-base font-semibold leading-relaxed" style={{ color: 'rgba(148,163,184,0.9)' }}>
                  Phân tích sâu ngữ pháp · Phản xạ dịch tự nhiên · Hệ thống SRS chống quên · AI chấm điểm tức thì
                </p>
              </div>

              {/* Status dots */}
              <div className="absolute top-4 right-8 hidden sm:flex items-center gap-3">
                <div className="flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-[10px] font-mono text-slate-400">SYSTEM ONLINE</span>
                </div>
              </div>
            </motion.div>

            {/* ── SPACED REPETITION CARD ── */}
            {reviewItems.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="mb-8 rounded-2xl p-6"
                style={{
                  background: 'linear-gradient(135deg, rgba(88,28,220,0.12) 0%, rgba(6,10,28,0.95) 100%)',
                  border: '1px solid rgba(139,92,246,0.3)',
                  boxShadow: '0 0 30px rgba(139,92,246,0.08)',
                }}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-start gap-3.5">
                    <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl"
                      style={{ background: 'rgba(139,92,246,0.15)', border: '1px solid rgba(139,92,246,0.4)' }}>
                      <Brain className="h-6 w-6 text-violet-300" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-base font-black text-white tracking-tight">
                          Neural SRS — Hồi Tưởng Chủ Động
                        </h3>
                        <span className="rounded-full px-2.5 py-0.5 text-[10px] font-black font-mono"
                          style={{ background: 'rgba(139,92,246,0.2)', border: '1px solid rgba(139,92,246,0.4)', color: '#c4b5fd' }}>
                          {reviewItems.length} câu
                        </span>
                      </div>
                      <p className="text-xs font-semibold" style={{ color: 'rgba(148,163,184,0.8)' }}>
                        AI phát hiện {reviewItems.length} câu đến hạn ôn — luyện ngay để giữ trí nhớ dài hạn.
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={handleStartSmartReview}
                    className="flex items-center justify-center gap-2 rounded-xl py-3 px-6 text-sm font-black text-violet-200 flex-shrink-0 cursor-pointer transition-all hover:scale-105 active:scale-95 font-mono"
                    style={{
                      background: 'rgba(139,92,246,0.2)',
                      border: '1px solid rgba(139,92,246,0.5)',
                      boxShadow: '0 0 20px rgba(139,92,246,0.2)',
                    }}
                  >
                    <span>Ôn Ngay ({reviewItems.length})</span>
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </div>
              </motion.div>
            )}

            {/* ── LEVEL FILTER BAR ── */}
            <div className="flex items-center justify-between gap-4 mb-6 flex-wrap">
              <div className="flex items-center gap-2">
                <Compass className="h-4 w-4 text-cyan-400/70" />
                <h2 className="text-base font-black text-white tracking-tight font-mono">
                  LỘ TRÌNH BÀI ĐỌC
                  <span className="ml-2 text-cyan-400/60 text-sm">({lessons.length})</span>
                </h2>
              </div>

              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
                {levelOptions.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setSelectedLevel(opt.value)}
                    className="rounded-lg px-3 py-1.5 text-[11px] font-black transition-all font-mono whitespace-nowrap"
                    style={{
                      background: selectedLevel === opt.value ? 'rgba(6,182,212,0.2)' : 'rgba(255,255,255,0.04)',
                      border: selectedLevel === opt.value ? '1px solid rgba(6,182,212,0.6)' : '1px solid rgba(255,255,255,0.08)',
                      color: selectedLevel === opt.value ? '#67e8f9' : 'rgba(148,163,184,0.7)',
                      boxShadow: selectedLevel === opt.value ? '0 0 10px rgba(6,182,212,0.15)' : 'none',
                    }}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* ── LESSONS GRID ── */}
            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {[1, 2, 3, 4, 5, 6].map((n) => (
                  <div key={n} className="h-48 rounded-2xl animate-pulse"
                    style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(6,182,212,0.1)' }} />
                ))}
              </div>
            ) : lessons.length === 0 ? (
              <div className="rounded-2xl p-12 text-center"
                style={{ background: 'rgba(255,255,255,0.03)', border: '1px dashed rgba(6,182,212,0.2)' }}>
                <ShieldCheck className="h-10 w-10 text-slate-600 mx-auto mb-3" />
                <p className="text-slate-500 font-bold font-mono">Không tìm thấy bài học nào.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {lessons.map((lesson) => (
                  <ReadingCard
                    key={lesson._id}
                    lesson={lesson}
                    onSelect={handleSelectLesson}
                    isLoading={selectingLessonId === lesson._id}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </main>

      {/* Global Word Modal for Word Click */}
      <WordModal />
    </div>
  );
}
