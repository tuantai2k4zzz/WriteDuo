'use client';

import React, { useState, useEffect } from 'react';
import { useLearningStore } from '../lib/store';
import { api } from '../lib/api';
import { Lesson, ReviewQueueItem, GrammarWeakness } from '../types';
import { Header } from '../components/Header';
import { ReadingCard } from '../components/ReadingCard';
import { InteractiveSentence } from '../components/InteractiveSentence';
import { FeedbackDrawer } from '../components/FeedbackDrawer';
import { WordModal } from '../components/WordModal';
import { LessonCompleteModal } from '../components/LessonCompleteModal';
import { VocabularyTab } from '../components/VocabularyTab';
import { WeaknessesTab } from '../components/WeaknessesTab';
import { ParagraphChallenge } from '../components/ParagraphChallenge';
import { TuantaidzBrandPlate } from '../components/hud/TuantaidzBrandPlate';
import { LearningGalaxy } from '../components/dashboard/LearningGalaxy';
import { DailyMission } from '../components/dashboard/DailyMission';
import { computeSkillVector, getAdaptiveRecommendation } from '../lib/adaptive';
import { Sparkles, Compass, Brain, ArrowRight, ShieldCheck, Zap, Radio, Target } from 'lucide-react';
import { motion } from 'framer-motion';

export default function Home() {
  const {
    currentTab,
    setCurrentTab,
    selectedLevel,
    setSelectedLevel,
    activeLesson,
    isParagraphChallengeActive,
    startLesson,
    userProgress,
    setUserProgress,
    initTheme,
  } = useLearningStore();

  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [reviewItems, setReviewItems] = useState<ReviewQueueItem[]>([]);
  const [weaknesses, setWeaknesses] = useState<GrammarWeakness[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectingLessonId, setSelectingLessonId] = useState<string | null>(null);

  // Initialize theme mode from localStorage on mount
  useEffect(() => {
    initTheme();
  }, [initTheme]);

  // Load progress, lessons, weaknesses, and proactive review queue on mount
  useEffect(() => {
    async function initData() {
      try {
        setLoading(true);
        const [progressData, lessonsData, reviewData, weaknessesData] = await Promise.all([
          api.getProgress(),
          api.getLessons(selectedLevel),
          api.getSmartReviewQueue(),
          api.getGrammarWeaknesses().catch(() => []),
        ]);
        setUserProgress(progressData);
        setLessons(lessonsData);
        setReviewItems(reviewData.items || []);
        setWeaknesses(weaknessesData || []);
      } catch (err) {
        console.error('Failed to load initial data:', err);
      } finally {
        setLoading(false);
      }
    }
    initData();
  }, [selectedLevel, setUserProgress]);

  const skillVector = computeSkillVector(userProgress, weaknesses);
  const recommendation = getAdaptiveRecommendation(skillVector, reviewItems.length);

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
    <div className="min-h-screen flex flex-col bg-slate-100/70 dark:bg-[#03070f] text-slate-800 dark:text-slate-100 transition-colors duration-300">
      <Header />

      <main className="flex-1 pb-16">
        {currentTab === 'vocab' && <VocabularyTab />}
        {currentTab === 'weakness' && <WeaknessesTab />}

        {currentTab === 'learn' && (
          <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">

            {/* ── EXCLUSIVE HOLOGRAPHIC BRAND SIGNBOARD FOR TUANTAIDZ ── */}
            <TuantaidzBrandPlate />

            {/* ── DASHBOARD GRID: NEURAL GALAXY & DAILY MISSION ── */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start mb-8">
              <div className="lg:col-span-7">
                <LearningGalaxy skills={skillVector} />
              </div>

              <div className="lg:col-span-5">
                <DailyMission
                  todayXp={userProgress?.todayXp ?? 35}
                  goalXp={userProgress?.dailyGoalXp ?? 50}
                  weaknessCount={weaknesses.length}
                  onNavigateTab={setCurrentTab}
                />

                {/* ADAPTIVE RECOMMENDATION CARD */}
                {recommendation && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="rounded-2xl p-5 bg-white/95 dark:bg-[#030816]/95 border border-cyan-200 dark:border-cyan-500/35 shadow-sm dark:shadow-[0_0_25px_rgba(6,182,212,0.1)] backdrop-blur-xl"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <Zap className="h-4 w-4 text-cyan-600 dark:text-cyan-400" />
                      <span className="text-[11px] font-mono font-black text-cyan-700 dark:text-cyan-300 uppercase tracking-wider">
                        TUANTAIDZ ADAPTIVE RECOMMENDATION
                      </span>
                    </div>
                    <h4 className="text-base font-black text-slate-900 dark:text-white mb-1">
                      {recommendation.title}
                    </h4>
                    <p className="text-xs text-slate-600 dark:text-slate-300 mb-4 leading-relaxed font-semibold">
                      {recommendation.description}
                    </p>
                    <button
                      onClick={() => {
                        if (recommendation.type === 'review') {
                          handleStartSmartReview();
                        } else if (lessons.length > 0) {
                          handleSelectLesson(lessons[0]);
                        }
                      }}
                      className="w-full flex items-center justify-center gap-2 rounded-xl py-2.5 px-4 text-xs font-mono font-black text-white bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 transition-all cursor-pointer shadow-md active:scale-95"
                    >
                      <span>{recommendation.actionText}</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </button>
                  </motion.div>
                )}
              </div>
            </div>

            {/* ── NEURAL SRS SPACED REPETITION CARD ── */}
            {reviewItems.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="mb-8 rounded-2xl p-6 bg-white/95 dark:bg-[#0a071c]/95 border border-violet-200 dark:border-violet-500/35 shadow-sm dark:shadow-[0_0_30px_rgba(139,92,246,0.1)] backdrop-blur-xl"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-start gap-3.5">
                    <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-violet-100 dark:bg-violet-950/40 border border-violet-200 dark:border-violet-500/50">
                      <Brain className="h-6 w-6 text-violet-600 dark:text-violet-300" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-base font-black text-slate-900 dark:text-white tracking-tight">
                          Neural SRS — Hồi Tưởng Chủ Động
                        </h3>
                        <span className="rounded-full px-2.5 py-0.5 text-[10px] font-black font-mono bg-violet-100 dark:bg-violet-950/50 border border-violet-300 dark:border-violet-500/50 text-violet-700 dark:text-violet-300">
                          {reviewItems.length} câu đến hạn
                        </span>
                      </div>
                      <p className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                        Thuật toán SRS phát hiện {reviewItems.length} cấu trúc đang giảm độ bền trí nhớ — kích hoạt ngay để ghi nhớ vĩnh viễn.
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={handleStartSmartReview}
                    className="flex items-center justify-center gap-2 rounded-xl py-3 px-6 text-sm font-black text-white dark:text-violet-200 flex-shrink-0 cursor-pointer transition-all hover:scale-105 active:scale-95 font-mono bg-violet-600 hover:bg-violet-500 dark:bg-violet-500/25 dark:border dark:border-violet-500/60 shadow-md shadow-violet-500/20"
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
                <Compass className="h-4 w-4 text-cyan-600 dark:text-cyan-400" />
                <h2 className="text-base font-black text-slate-900 dark:text-white tracking-tight font-mono">
                  LỘ TRÌNH BÀI ĐỌC
                  <span className="ml-2 text-cyan-600 dark:text-cyan-400/80 text-sm">({lessons.length})</span>
                </h2>
              </div>

              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
                {levelOptions.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setSelectedLevel(opt.value)}
                    className={`rounded-lg px-3 py-1.5 text-[11px] font-black transition-all font-mono whitespace-nowrap cursor-pointer border ${
                      selectedLevel === opt.value
                        ? 'bg-cyan-500/15 border-cyan-500 text-cyan-700 dark:text-cyan-300 shadow-[0_0_12px_rgba(6,182,212,0.2)]'
                        : 'bg-white/90 dark:bg-white/[0.04] border-slate-200 dark:border-white/[0.08] text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-white/20'
                    }`}
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
                  <div key={n} className="h-48 rounded-2xl animate-pulse bg-slate-200/80 dark:bg-white/[0.04] border border-slate-300/60 dark:border-cyan-500/10" />
                ))}
              </div>
            ) : lessons.length === 0 ? (
              <div className="rounded-2xl p-12 text-center bg-white/80 dark:bg-white/[0.03] border border-dashed border-slate-300 dark:border-cyan-500/20">
                <ShieldCheck className="h-10 w-10 text-slate-400 dark:text-slate-600 mx-auto mb-3" />
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
