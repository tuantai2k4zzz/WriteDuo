'use client';

import React, { useEffect, useState } from 'react';
import { useLearningStore } from '../lib/store';
import { playSound, speakEnglish, speakVietnamese } from '../lib/audio';
import {
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ArrowRight,
  RotateCcw,
  Volume2,
  Sparkles,
  Check,
  Zap,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  Target,
  BookOpen,
  Layers,
  Lightbulb,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { TimeRewindRepair } from './learning/TimeRewindRepair';
import { SemanticSentenceView } from './learning/SemanticSentenceView';

export const FeedbackDrawer: React.FC = () => {
  const {
    evaluationResponse,
    isDrawerOpen,
    nextSentence,
    retryCurrentSentence,
    exerciseMode,
  } = useLearningStore();

  const [showFullDetails, setShowFullDetails] = useState(false);

  useEffect(() => {
    if (evaluationResponse) {
      const status = evaluationResponse.evaluation.status;
      if (status === 'correct') {
        playSound('correct');
      } else if (status === 'almost_correct' || status === 'missing_info') {
        playSound('almost');
      } else {
        playSound('incorrect');
      }
    }
  }, [evaluationResponse]);

  // Keyboard shortcuts: Enter to Continue, Ctrl+R to Retry
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isDrawerOpen) return;
      if (e.key === 'Enter' && !e.shiftKey && !e.ctrlKey) {
        e.preventDefault();
        nextSentence();
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'r') {
        e.preventDefault();
        retryCurrentSentence();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isDrawerOpen, nextSentence, retryCurrentSentence]);

  if (!isDrawerOpen || !evaluationResponse) return null;

  const {
    evaluation,
    userAnswer,
    referenceAnswer,
    textEn,
    grammarAnalysis,
    isDeepAnalysisReady,
  } = evaluationResponse;

  const status = evaluation.status;
  const isCorrect = status === 'correct';
  const isAlmost = status === 'almost_correct';
  const isMissing = status === 'missing_info';
  const isViToEn = exerciseMode === 'vi_to_en';

  const semanticData = evaluation.semanticAnalysis;
  const isExactMatch = semanticData?.overallStatus === 'EXACT_MATCH';
  const isEquivalent =
    semanticData?.overallStatus === 'SEMANTICALLY_CORRECT' ||
    (isCorrect && (semanticData?.alternatives?.length ?? 0) > 0);

  // Bright Futuristic Colors
  let badgeBorder = 'border-rose-400 bg-rose-50 text-rose-700 dark:border-rose-500/40 dark:bg-rose-950/40 dark:text-rose-300';
  let badgePill = 'bg-rose-500 text-white';
  let statusTitle = 'Cần Điều Chỉnh Lại';

  if (isExactMatch) {
    badgeBorder = 'border-emerald-400 bg-emerald-50 text-emerald-700 dark:border-emerald-500/40 dark:bg-emerald-950/40 dark:text-emerald-300';
    badgePill = 'bg-emerald-500 text-white';
    statusTitle = 'Tuyệt Vời · Khớp Hoàn Hảo';
  } else if (isEquivalent) {
    badgeBorder = 'border-cyan-400 bg-cyan-50 text-cyan-700 dark:border-cyan-500/40 dark:bg-cyan-950/40 dark:text-cyan-300';
    badgePill = 'bg-cyan-500 text-white';
    statusTitle = 'Xuất Sắc · Đúng Ý & Tự Nhiên';
  } else if (isCorrect) {
    badgeBorder = 'border-emerald-400 bg-emerald-50 text-emerald-700 dark:border-emerald-500/40 dark:bg-emerald-950/40 dark:text-emerald-300';
    badgePill = 'bg-emerald-500 text-white';
    statusTitle = 'Rất Chuẩn Xác';
  } else if (isAlmost || semanticData?.overallStatus === 'PARTIALLY_CORRECT') {
    badgeBorder = 'border-amber-400 bg-amber-50 text-amber-700 dark:border-amber-500/40 dark:bg-amber-950/40 dark:text-amber-300';
    badgePill = 'bg-amber-500 text-white';
    statusTitle = 'Ý Nghĩa Gần Đúng · Cần Hoàn Thiện';
  } else if (isMissing) {
    badgeBorder = 'border-amber-400 bg-amber-50 text-amber-700 dark:border-amber-500/40 dark:bg-amber-950/40 dark:text-amber-300';
    badgePill = 'bg-amber-500 text-white';
    statusTitle = 'Đúng Ý Chính · Thiếu Chi Tiết';
  }

  const whatYouGotRight = evaluation.whatYouGotRight || [];
  const specificMistakes = evaluation.specificMistakes || [];
  const grammarInsight = evaluation.grammarInsight;
  const completeSentence = evaluation.completeSentenceMemorize;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 28, stiffness: 280 }}
        className="fixed inset-x-0 bottom-0 z-50 max-h-[88vh] overflow-y-auto border-t-2 border-slate-200 dark:border-cyan-500/30 bg-white/95 dark:bg-[#070d1a]/95 backdrop-blur-2xl shadow-2xl"
      >
        <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6 space-y-5">

          {/* ── TOP HEADER: SCORE & STATUS ── */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-3.5">
              <div
                className={`flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl shadow-md ${badgePill}`}
              >
                {isCorrect || isExactMatch || isEquivalent ? (
                  <CheckCircle2 className="h-7 w-7" />
                ) : isAlmost ? (
                  <Sparkles className="h-7 w-7" />
                ) : isMissing ? (
                  <AlertTriangle className="h-7 w-7" />
                ) : (
                  <XCircle className="h-7 w-7" />
                )}
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-black tracking-tight text-slate-900 dark:text-white">
                    {statusTitle}
                  </h3>
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-xs font-mono font-black ${badgeBorder}`}
                  >
                    {evaluation.score}/100 ĐIỂM
                  </span>
                </div>
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-0.5">
                  {evaluation.overview || evaluation.explanation}
                </p>
              </div>
            </div>

            {/* Action Buttons (Next / Retry) */}
            <div className="flex items-center gap-2 sm:self-center">
              {!isCorrect && (
                <button
                  onClick={retryCurrentSentence}
                  className="flex items-center gap-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 px-4 py-2.5 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-200 active:scale-95 transition-all cursor-pointer"
                  title="Thử lại câu này (Ctrl+R)"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  <span>Luyện Lại</span>
                </button>
              )}

              <button
                onClick={nextSentence}
                className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 px-6 py-2.5 text-xs font-black tracking-wider uppercase text-white shadow-md shadow-cyan-500/25 hover:from-cyan-400 hover:to-blue-500 active:scale-95 transition-all font-mono cursor-pointer"
                title="Sang câu tiếp theo (Enter)"
              >
                <span>Tiếp Tục</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* ── SEMANTIC SENTENCE VIEW 2.0 (4-COLOR TOKEN DIFFS & LANGUAGE NOTES) ── */}
          <SemanticSentenceView
            semanticData={evaluation.semanticAnalysis}
            userAnswer={userAnswer}
            referenceAnswer={referenceAnswer}
          />

          {/* ── BACKGROUND SCANNING RADAR (If deep analysis is still completing) ── */}
          {!isDeepAnalysisReady && !isCorrect && (
            <div className="flex items-center gap-2.5 p-3 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-700 dark:text-cyan-300 text-xs font-mono">
              <Sparkles className="h-4 w-4 animate-spin text-cyan-500" />
              <span>AI Đang Phân Tích Chuyên Sâu Ngữ Pháp & So Khớp Chi Tiết...</span>
            </div>
          )}

          {/* ── TIME REWIND ERROR EXPERIENCE (< 1s Visual Anomaly Repair) ── */}
          {!isCorrect && specificMistakes.length > 0 && (
            <TimeRewindRepair
              userSnippet={
                specificMistakes[0].where &&
                !specificMistakes[0].where.startsWith('Thiếu') &&
                !specificMistakes[0].where.includes('Chữ cái')
                  ? specificMistakes[0].where
                  : specificMistakes[0].relatedEnglish || userAnswer
              }
              fixedSnippet={
                specificMistakes[0].correctMeaning ||
                specificMistakes[0].fixedSnippet ||
                referenceAnswer
              }
              reason={specificMistakes[0].whyIncorrect}
              rule={grammarInsight?.relevantRule || grammarAnalysis?.tense}
            />
          )}

          {/* ── ERROR VISUALIZATION: SIDE-BY-SIDE COMPARISON ── */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* User Answer Card */}
            <div className="rounded-2xl p-4 bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 shadow-xs">
              <div className="flex items-center justify-between text-[11px] font-black uppercase tracking-wider text-slate-400 mb-2 font-mono">
                <span>CÂU CỦA BẠN</span>
                {isCorrect ? (
                  <span className="text-emerald-500 flex items-center gap-1 font-bold">
                    <Check className="h-3 w-3" /> CHÍNH XÁC
                  </span>
                ) : (
                  <span className="text-rose-500 flex items-center gap-1 font-bold">
                    <XCircle className="h-3 w-3" /> CẦN SỬA
                  </span>
                )}
              </div>
              <p
                className={`text-base font-bold leading-relaxed ${
                  isCorrect
                    ? 'text-emerald-600 dark:text-emerald-300'
                    : 'text-slate-800 dark:text-slate-200'
                }`}
              >
                {userAnswer}
              </p>
            </div>

            {/* Reference Master Answer Card */}
            <div className="rounded-2xl p-4 bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/60 shadow-xs">
              <div className="flex items-center justify-between text-[11px] font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400 mb-2 font-mono">
                <span>ĐÁP ÁN CHUẨN XÁC</span>
                <button
                  type="button"
                  onClick={() =>
                    isViToEn
                      ? speakEnglish(referenceAnswer, 0.95)
                      : speakVietnamese(referenceAnswer)
                  }
                  className="p-1 rounded-lg hover:bg-emerald-200/50 dark:hover:bg-emerald-900/50 text-emerald-600 dark:text-emerald-300 transition-colors"
                  title="Nghe phát âm chuẩn"
                >
                  <Volume2 className="h-3.5 w-3.5" />
                </button>
              </div>
              <p className="text-base font-black text-emerald-800 dark:text-emerald-200 leading-relaxed">
                {referenceAnswer}
              </p>
            </div>
          </div>

          {/* ── ERROR VISUALIZATION: WHAT / WHY / FIX BREAKDOWN ── */}
          {specificMistakes.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Target className="h-4 w-4 text-cyan-600 dark:text-cyan-400" />
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300 font-mono">
                  CHI TIẾT LỖI SAI & HƯỚNG DẪN KHẮC PHỤC
                </h4>
              </div>

              <div className="grid grid-cols-1 gap-3">
                {specificMistakes.map((mistake, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.08 }}
                    className="rounded-2xl p-4 bg-white dark:bg-slate-900/90 border border-rose-200 dark:border-rose-900/50 shadow-xs space-y-3"
                  >
                    {/* WHAT (Bạn đã dùng gì) */}
                    <div className="flex items-start gap-2.5">
                      <span className="flex-shrink-0 px-2 py-0.5 rounded text-[10px] font-black uppercase font-mono bg-rose-100 dark:bg-rose-950/70 text-rose-700 dark:text-rose-300">
                        WHAT
                      </span>
                      <p className="text-sm font-bold text-slate-800 dark:text-slate-200">
                        {mistake.where || `Lỗi từ/cụm: "${mistake.relatedEnglish || 'chưa chuẩn'}"`}
                      </p>
                    </div>

                    {/* WHY (Vì sao chưa chuẩn) */}
                    <div className="flex items-start gap-2.5">
                      <span className="flex-shrink-0 px-2 py-0.5 rounded text-[10px] font-black uppercase font-mono bg-amber-100 dark:bg-amber-950/70 text-amber-700 dark:text-amber-300">
                        WHY
                      </span>
                      <p className="text-xs font-semibold text-slate-600 dark:text-slate-300 leading-relaxed">
                        {mistake.whyIncorrect}
                      </p>
                    </div>

                    {/* FIX (Cách sửa chuẩn) */}
                    <div className="flex items-start gap-2.5">
                      <span className="flex-shrink-0 px-2 py-0.5 rounded text-[10px] font-black uppercase font-mono bg-emerald-100 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300">
                        FIX
                      </span>
                      <p className="text-sm font-black text-emerald-700 dark:text-emerald-300">
                        {mistake.howToFix || mistake.fixedSnippet}
                      </p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {/* ── AI CONCISE SUMMARY (ACTIONABLE & DIRECT) ── */}
          <div className="rounded-2xl p-4 bg-gradient-to-br from-cyan-50/70 via-white to-blue-50/50 dark:from-cyan-950/20 dark:via-slate-900/90 dark:to-blue-950/20 border border-cyan-200 dark:border-cyan-800/60 shadow-xs">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="h-4 w-4 text-cyan-600 dark:text-cyan-400" />
              <h4 className="text-xs font-black uppercase tracking-wider text-cyan-700 dark:text-cyan-300 font-mono">
                AI INSIGHT TÓM TẮT
              </h4>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              {/* Ý đúng */}
              <div className="rounded-xl p-3 bg-white/80 dark:bg-slate-800/80 border border-slate-100 dark:border-slate-700/60">
                <span className="text-[10px] font-black uppercase text-emerald-600 dark:text-emerald-400 font-mono block mb-1">
                  ✓ ĐIỂM LÀM TỐT
                </span>
                <p className="font-semibold text-slate-700 dark:text-slate-200">
                  {whatYouGotRight.length > 0
                    ? whatYouGotRight[0]
                    : 'Nắm được tinh thần và cấu trúc câu'}
                </p>
              </div>

              {/* Ngữ pháp cốt lõi */}
              <div className="rounded-xl p-3 bg-white/80 dark:bg-slate-800/80 border border-slate-100 dark:border-slate-700/60">
                <span className="text-[10px] font-black uppercase text-cyan-600 dark:text-cyan-400 font-mono block mb-1">
                  📐 NGỮ PHÁP TRỌNG TÂM
                </span>
                <p className="font-semibold text-slate-700 dark:text-slate-200">
                  {grammarInsight?.relevantRule || grammarAnalysis?.tense || 'Cấu trúc câu hoàn chỉnh'}
                </p>
              </div>
            </div>

            {/* Toggle Full Deep Details */}
            <button
              type="button"
              onClick={() => setShowFullDetails(!showFullDetails)}
              className="mt-3 w-full flex items-center justify-center gap-1.5 py-2 text-xs font-black text-cyan-600 dark:text-cyan-300 hover:text-cyan-700 dark:hover:text-cyan-200 transition-colors"
            >
              <span>{showFullDetails ? 'Thu Gọn Phân Tích' : 'Xem Phân Tích Đầy Đủ & Điểm Cần Nhớ'}</span>
              {showFullDetails ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
            </button>

            {/* Expandable Deep Details */}
            {showFullDetails && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="mt-3 pt-3 border-t border-cyan-100 dark:border-cyan-900/60 space-y-3 text-xs"
              >
                {grammarInsight?.whyThisStructure && (
                  <div>
                    <span className="font-bold text-slate-700 dark:text-slate-300">Giải thích thì / cấu trúc:</span>
                    <p className="text-slate-600 dark:text-slate-400 mt-0.5">{grammarInsight.whyThisStructure}</p>
                  </div>
                )}
                {grammarInsight?.comparisonOrContrast && (
                  <div>
                    <span className="font-bold text-slate-700 dark:text-slate-300">Lưu ý đối chiếu:</span>
                    <p className="text-slate-600 dark:text-slate-400 mt-0.5">{grammarInsight.comparisonOrContrast}</p>
                  </div>
                )}
                {completeSentence?.keyPoints && completeSentence.keyPoints.length > 0 && (
                  <div>
                    <span className="font-bold text-slate-700 dark:text-slate-300">🎯 Điểm cần nhớ:</span>
                    <ul className="list-disc list-inside text-slate-600 dark:text-slate-400 mt-1 space-y-0.5">
                      {completeSentence.keyPoints.map((pt, i) => (
                        <li key={i}>{pt}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </motion.div>
            )}
          </div>

        </div>
      </motion.div>
    </AnimatePresence>
  );
};
