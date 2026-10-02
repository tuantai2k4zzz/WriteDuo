'use client';

import React, { useState } from 'react';
import { Sentence, Token } from '../types';
import { speakEnglish, speakVietnamese } from '../lib/audio';
import { useLearningStore } from '../lib/store';
import {
  BookOpen,
  HelpCircle,
  Volume2,
  Globe,
  Languages,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Sparkles,
  BookmarkPlus,
  Volume1,
  Lock,
  Unlock,
  AlertTriangle,
  Lightbulb,
  X,
} from 'lucide-react';

import { api } from '../lib/api';

interface ExerciseSidebarProps {
  sentence: Sentence;
  isMobileDrawer?: boolean;
  onCloseMobileDrawer?: () => void;
}

type TabKey =
  | 'vocab'
  | 'grammar'
  | 'hints'
  | 'pronunciation'
  | 'en_meaning'
  | 'vi_meaning'
  | 'reference_answer';

export default function ExerciseSidebar({
  sentence,
  isMobileDrawer = false,
  onCloseMobileDrawer,
}: ExerciseSidebarProps) {
  const { isAnswerRevealed, revealAnswer, exerciseMode } = useLearningStore();
  const isViToEn = exerciseMode === 'vi_to_en';

  // Accordion state: by default ALL collapsed per requirements!
  const [activeTab, setActiveTab] = useState<TabKey | null>(null);

  // Progressive hint level (0 = none, 1 = level 1, 2 = level 2, 3 = level 3)
  const [revealedHintLevel, setRevealedHintLevel] = useState<number>(0);

  // Vietnamese meaning reveal state (hidden by default)
  const [isViMeaningRevealed, setIsViMeaningRevealed] = useState<boolean>(false);

  // Selected token for detailed view inside vocab tab
  const [selectedToken, setSelectedToken] = useState<Token | null>(null);
  const [savedWordSuccess, setSavedWordSuccess] = useState<string | null>(null);

  const toggleTab = (key: TabKey) => {
    setActiveTab((prev) => (prev === key ? null : key));
  };

  const handleSelectToken = (token: Token) => {
    setSelectedToken(token);
    if (!token.meaningVi || token.meaningVi.includes('Đang cập nhật')) {
      api.lookupWord(token.text, sentence.textEn)
        .then((res) => {
          setSelectedToken({
            ...token,
            meaningVi: res.meaningVi,
            ipa: res.ipa || token.ipa,
            pos: res.pos || token.pos,
            cefr: res.cefr || token.cefr,
            exampleEn: res.exampleEn,
            exampleVi: res.exampleVi,
          });
        })
        .catch(() => {});
    }
  };

  const handleSaveWord = async (token: Token) => {
    try {
      const res = await fetch('http://localhost:4000/api/v1/vocabulary/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          word: token.text,
          meaningVi: token.meaningVi,
          pos: token.pos,
          ipa: token.ipa,
          cefr: token.cefr || 'A1',
          exampleEn: token.exampleEn || sentence.textEn,
          exampleVi: token.exampleVi || sentence.primaryTranslationVi,
        }),
      });
      if (res.ok) {
        setSavedWordSuccess(token.text);
        setTimeout(() => setSavedWordSuccess(null), 2500);
      }
    } catch {
      // Offline or network error
    }
  };

  // Safe fallbacks for hints & deep-dives
  const hints = sentence.hints || {
    level1: 'Xác định rõ chủ thể hành động, động từ chính và bối cảnh xảy ra câu.',
    level2: `Từ vựng & cấu trúc trọng tâm: ${sentence.tokens?.slice(0, 3).map((t) => t.text).join(', ') || 'trong câu'}.`,
    level3: 'Gợi ý sắp xếp ý: [Chủ ngữ] + [Hành động] + [Bổ ngữ/Thời gian]. Hãy dịch mượt mà.',
  };

  const tokens = sentence.tokens || [];
  const grammar = sentence.grammarAnalysis || {
    tense: 'Cấu trúc câu',
    tenseExplanationVi: 'Câu tuân theo trật tự tự nhiên trong tiếng Anh.',
    components: [],
    notableStructures: [],
  };

  const pronunciation = sentence.pronunciationGuide || {
    ipaFull: '',
    sentenceStressWords: [],
    linkingRules: [],
    vietnameseCommonPitfalls: [],
    intonation: 'Ngữ điệu hạ xuống ở cuối câu trần thuật (Falling intonation ↘).',
  };

  const grammarDetailed = sentence.grammarDetailed || {
    whyStructure: grammar.tenseExplanationVi || 'Cấu trúc này dùng để diễn đạt chính xác trạng thái và thời gian của hành động.',
    positioningReason: 'Chủ ngữ đứng trước động từ theo trật tự S-V-O cơ bản trong tiếng Anh.',
    prepositionsArticlesNotes: 'Mạo từ và giới từ kết nối các thành phần và tạo ngữ cảnh không gian/thời gian.',
    meaningImpact: 'Cấu trúc này giúp người nghe nắm rõ bản chất sự việc một cách tự nhiên.',
    contrastExamples: 'Nếu dùng thì khác, câu sẽ chuyển từ sự thật hiện tại sang hành động đã kết thúc trong quá khứ.',
  };

  const tabsConfig: Array<{
    key: TabKey;
    title: string;
    icon: React.ReactNode;
    badge?: string;
  }> = [
    { key: 'vocab', title: isViToEn ? '1. Từ vựng trọng tâm' : '1. Từ vựng', icon: <BookOpen className="w-4 h-4 text-emerald-500" />, badge: `${tokens.length} từ` },
    { key: 'grammar', title: isViToEn ? '2. Cấu trúc câu (EN)' : '2. Ngữ pháp', icon: <Sparkles className="w-4 h-4 text-purple-500" />, badge: grammar.tense ? 'Chi tiết' : undefined },
    { key: 'hints', title: isViToEn ? '3. Gợi ý viết câu' : '3. Gợi ý', icon: <Lightbulb className="w-4 h-4 text-amber-500" />, badge: revealedHintLevel > 0 ? `Cấp ${revealedHintLevel}/3` : '3 cấp độ' },
    { key: 'pronunciation', title: isViToEn ? '4. Phát âm câu mẫu' : '4. Phân tích phát âm', icon: <Volume2 className="w-4 h-4 text-sky-500" /> },
    { key: 'en_meaning', title: '5. Nghĩa tiếng Anh', icon: <Globe className="w-4 h-4 text-blue-500" /> },
    { key: 'vi_meaning', title: isViToEn ? '6. Phân tích chuyển ngữ' : '6. Nghĩa tiếng Việt', icon: <Languages className="w-4 h-4 text-teal-500" />, badge: isViMeaningRevealed ? 'Đã mở' : 'Ẩn' },
    { key: 'reference_answer', title: isViToEn ? '7. Đáp án tiếng Anh' : '7. Đáp án tham khảo', icon: <CheckCircle2 className="w-4 h-4 text-rose-500" />, badge: isAnswerRevealed ? 'Đã xem' : 'Bảo vệ' },
  ];

  return (
    <aside
      className={`bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-sm flex flex-col ${
        isMobileDrawer ? 'w-full h-full max-h-[85vh] overflow-y-auto p-4' : 'w-full p-4 lg:p-5'
      }`}
    >
      {/* Mobile Drawer Header */}
      {isMobileDrawer && (
        <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-indigo-500" />
            <h3 className="font-bold text-slate-800 dark:text-slate-100 text-base">
              Hỗ Trợ Học Tập Cá Nhân
            </h3>
          </div>
          <button
            onClick={onCloseMobileDrawer}
            className="p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* Desktop Header */}
      {!isMobileDrawer && (
        <div className="pb-3 mb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                Gia Sư Đồng Hành
              </h3>
            </div>
            <span className="text-[11px] font-medium text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full">
              Ẩn mặc định
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Chủ động suy nghĩ trước khi mở các tab hỗ trợ bên dưới.
          </p>
        </div>
      )}

      {/* Accordion List */}
      <div className="space-y-2 flex-1 overflow-y-auto pr-0.5">
        {tabsConfig.map((tab) => {
          const isOpen = activeTab === tab.key;
          return (
            <div
              key={tab.key}
              className={`border rounded-2xl transition-all ${
                isOpen
                  ? 'border-indigo-200 dark:border-indigo-900/60 bg-indigo-50/20 dark:bg-indigo-950/20 shadow-xs'
                  : 'border-slate-200/80 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-slate-50/40 dark:bg-slate-800/20'
              }`}
            >
              {/* Accordion Tab Header */}
              <button
                type="button"
                onClick={() => toggleTab(tab.key)}
                className="w-full flex items-center justify-between p-3.5 text-left text-sm font-semibold text-slate-700 dark:text-slate-200 hover:text-indigo-600 dark:hover:text-indigo-400 transition"
              >
                <div className="flex items-center gap-2.5">
                  {tab.icon}
                  <span>{tab.title}</span>
                </div>
                <div className="flex items-center gap-2">
                  {tab.badge && (
                    <span className="text-[11px] px-2 py-0.5 rounded-full font-medium bg-slate-200/60 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                      {tab.badge}
                    </span>
                  )}
                  {isOpen ? (
                    <ChevronUp className="w-4 h-4 text-slate-400" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-slate-400" />
                  )}
                </div>
              </button>

              {/* Accordion Content Panel */}
              {isOpen && (
                <div className="px-3.5 pb-4 pt-1 text-xs text-slate-600 dark:text-slate-300 border-t border-slate-100 dark:border-slate-800/80 space-y-3">
                  {/* TAB 1: TỪ VỰNG */}
                  {tab.key === 'vocab' && (
                    <div className="space-y-3 pt-1">
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 italic">
                        Click vào từ bất kỳ để xem ngữ cảnh, từ loại, IPA và ví dụ chi tiết:
                      </p>
                      <div className="grid grid-cols-2 gap-1.5">
                        {tokens.map((token, i) => (
                          <button
                            key={i}
                            onClick={() => handleSelectToken(token)}
                            className={`p-2 rounded-xl text-left border transition flex flex-col justify-between ${
                              selectedToken?.text === token.text
                                ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/40'
                                : 'border-slate-200 dark:border-slate-700/80 bg-white dark:bg-slate-800 hover:border-indigo-300'
                            }`}
                          >
                            <div className="flex items-center justify-between w-full">
                              <span className="font-bold text-slate-800 dark:text-slate-100 text-xs">
                                {token.text}
                              </span>
                              {token.cefr && (
                                <span className="text-[9px] px-1.5 py-0.5 rounded-md font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
                                  {token.cefr}
                                </span>
                              )}
                            </div>
                            <span className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                              {token.meaningVi || token.lemma}
                            </span>
                            <span className="text-[10px] text-indigo-500 font-mono mt-0.5">
                              {token.ipa}
                            </span>
                          </button>
                        ))}
                      </div>

                      {/* Selected Token Detail Card */}
                      {selectedToken && (
                        <div className="p-3 bg-white dark:bg-slate-800 border border-indigo-200 dark:border-indigo-800 rounded-2xl shadow-xs space-y-2 mt-2">
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-sm text-slate-900 dark:text-white">
                                  {selectedToken.text}
                                </span>
                                <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 font-medium">
                                  {selectedToken.pos || 'từ loại'}
                                </span>
                              </div>
                              <span className="text-xs text-indigo-600 dark:text-indigo-400 font-mono">
                                {selectedToken.ipa}
                              </span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <button
                                onClick={() => speakEnglish(selectedToken.text, 0.9)}
                                className="p-1.5 rounded-lg bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-300 hover:bg-indigo-200 transition"
                                title="Phát âm từ"
                              >
                                <Volume2 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleSaveWord(selectedToken)}
                                className="p-1.5 rounded-lg bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 dark:text-emerald-300 hover:bg-emerald-200 transition"
                                title="Lưu vào sổ từ"
                              >
                                <BookmarkPlus className="w-4 h-4" />
                              </button>
                            </div>
                          </div>

                          {savedWordSuccess === selectedToken.text && (
                            <div className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium bg-emerald-50 dark:bg-emerald-950/40 p-1.5 rounded-lg text-center">
                              ✓ Đã lưu vào Sổ từ vựng cá nhân!
                            </div>
                          )}

                          <div className="space-y-1 text-[11px]">
                            <p>
                              <span className="font-semibold text-slate-700 dark:text-slate-300">
                                Nghĩa ngữ cảnh:
                              </span>{' '}
                              <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                                {selectedToken.meaningVi || 'Đang cập nhật'}
                              </span>
                            </p>
                            <p>
                              <span className="font-semibold text-slate-700 dark:text-slate-300">
                                Cách dùng trong câu:
                              </span>{' '}
                              {selectedToken.usageInSentence || `Đóng vai trò là ${selectedToken.pos} trong mệnh đề.`}
                            </p>
                            <p>
                              <span className="font-semibold text-slate-700 dark:text-slate-300">
                                Dạng gốc (Lemma):
                              </span>{' '}
                              <span className="font-mono">{selectedToken.lemma || selectedToken.text}</span>
                            </p>
                            {selectedToken.exampleEn && (
                              <div className="pt-1 border-t border-slate-100 dark:border-slate-700 text-[10px]">
                                <p className="text-slate-600 dark:text-slate-300 italic">
                                  "{selectedToken.exampleEn}"
                                </p>
                                <p className="text-slate-500">
                                  → {selectedToken.exampleVi}
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* TAB 2: NGỮ PHÁP */}
                  {tab.key === 'grammar' && (
                    <div className="space-y-3 pt-1">
                      {/* Tense Badge & Explanation */}
                      <div className="p-3 bg-purple-50/70 dark:bg-purple-950/30 rounded-2xl border border-purple-200/70 dark:border-purple-900/40">
                        <span className="text-[10px] font-bold text-purple-700 dark:text-purple-300 uppercase tracking-wider block">
                          Thì & Cấu trúc ngữ pháp
                        </span>
                        <h4 className="font-bold text-xs text-purple-950 dark:text-purple-100 mt-0.5">
                          {grammar.tense || 'Ngữ pháp câu hoàn chỉnh'}
                        </h4>
                        <p className="text-[11px] text-purple-800/80 dark:text-purple-300/80 mt-1 leading-relaxed">
                          {grammar.tenseExplanationVi}
                        </p>
                      </div>

                      {/* Word by word role S-V-O-C-A */}
                      <div>
                        <span className="font-bold text-[11px] text-slate-700 dark:text-slate-300 block mb-1.5">
                          Phân vai trò từng thành phần trong câu (S-V-O-A):
                        </span>
                        <div className="space-y-1.5">
                          {grammar.components?.map((c, i) => (
                            <div
                              key={i}
                              className="p-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-start gap-2"
                            >
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 shrink-0">
                                {c.role}
                              </span>
                              <div className="text-[11px]">
                                <span className="font-semibold text-slate-800 dark:text-slate-100">
                                  "{c.text}"
                                </span>
                                {c.noteVi && (
                                  <p className="text-slate-500 dark:text-slate-400 text-[10px] mt-0.5">
                                    {c.noteVi}
                                  </p>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Deep-dive Q&A */}
                      <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-[11px]">
                        <div className="bg-slate-50 dark:bg-slate-800/50 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800">
                          <span className="font-bold text-slate-700 dark:text-slate-200 block">
                            💡 Vì sao sử dụng cấu trúc này?
                          </span>
                          <p className="text-slate-600 dark:text-slate-400 mt-0.5 leading-relaxed">
                            {grammarDetailed.whyStructure}
                          </p>
                        </div>

                        <div className="bg-slate-50 dark:bg-slate-800/50 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800">
                          <span className="font-bold text-slate-700 dark:text-slate-200 block">
                            📍 Vì sao từ/cụm từ đứng ở vị trí đó?
                          </span>
                          <p className="text-slate-600 dark:text-slate-400 mt-0.5 leading-relaxed">
                            {grammarDetailed.positioningReason}
                          </p>
                        </div>

                        <div className="bg-slate-50 dark:bg-slate-800/50 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800">
                          <span className="font-bold text-slate-700 dark:text-slate-200 block">
                            ⚖️ Đối chiếu với cấu trúc dễ nhầm lẫn:
                          </span>
                          <p className="text-slate-600 dark:text-slate-400 mt-0.5 leading-relaxed">
                            {grammarDetailed.contrastExamples}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* TAB 3: GỢI Ý (3 CẤP ĐỘ) */}
                  {tab.key === 'hints' && (
                    <div className="space-y-3 pt-1">
                      <div className="p-2.5 bg-amber-50 dark:bg-amber-950/30 rounded-2xl border border-amber-200/70 dark:border-amber-900/40 text-[11px] text-amber-800 dark:text-amber-300">
                        Hệ thống gợi ý từng bước giúp bạn tự kích hoạt tư duy mà không bị lộ đáp án!
                      </div>

                      {/* Level 1 Hint */}
                      <div
                        className={`p-3 rounded-2xl border transition ${
                          revealedHintLevel >= 1
                            ? 'bg-white dark:bg-slate-800 border-amber-300 dark:border-amber-800'
                            : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700 opacity-70'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-xs text-amber-700 dark:text-amber-400">
                            Cấp 1: Hướng suy nghĩ chung
                          </span>
                          {revealedHintLevel >= 1 ? (
                            <span className="text-[10px] text-emerald-600 font-semibold">✓ Đã mở</span>
                          ) : (
                            <Lock className="w-3.5 h-3.5 text-slate-400" />
                          )}
                        </div>
                        {revealedHintLevel >= 1 ? (
                          <p className="mt-1.5 text-slate-700 dark:text-slate-300 leading-relaxed">
                            {hints.level1}
                          </p>
                        ) : (
                          <p className="mt-1 text-slate-400 italic text-[10px]">
                            Nhấn nút bên dưới để mở gợi ý cấp 1.
                          </p>
                        )}
                      </div>

                      {/* Level 2 Hint */}
                      <div
                        className={`p-3 rounded-2xl border transition ${
                          revealedHintLevel >= 2
                            ? 'bg-white dark:bg-slate-800 border-amber-300 dark:border-amber-800'
                            : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700 opacity-70'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-xs text-amber-700 dark:text-amber-400">
                            Cấp 2: Từ vựng & Cấu trúc chìa khóa
                          </span>
                          {revealedHintLevel >= 2 ? (
                            <span className="text-[10px] text-emerald-600 font-semibold">✓ Đã mở</span>
                          ) : (
                            <Lock className="w-3.5 h-3.5 text-slate-400" />
                          )}
                        </div>
                        {revealedHintLevel >= 2 ? (
                          <p className="mt-1.5 text-slate-700 dark:text-slate-300 leading-relaxed">
                            {hints.level2}
                          </p>
                        ) : (
                          <p className="mt-1 text-slate-400 italic text-[10px]">
                            Cần mở cấp 1 trước khi mở cấp 2.
                          </p>
                        )}
                      </div>

                      {/* Level 3 Hint */}
                      <div
                        className={`p-3 rounded-2xl border transition ${
                          revealedHintLevel >= 3
                            ? 'bg-white dark:bg-slate-800 border-amber-300 dark:border-amber-800'
                            : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700 opacity-70'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-xs text-amber-700 dark:text-amber-400">
                            Cấp 3: Gợi ý sắp xếp ý câu
                          </span>
                          {revealedHintLevel >= 3 ? (
                            <span className="text-[10px] text-emerald-600 font-semibold">✓ Đã mở</span>
                          ) : (
                            <Lock className="w-3.5 h-3.5 text-slate-400" />
                          )}
                        </div>
                        {revealedHintLevel >= 3 ? (
                          <p className="mt-1.5 text-slate-700 dark:text-slate-300 leading-relaxed">
                            {hints.level3}
                          </p>
                        ) : (
                          <p className="mt-1 text-slate-400 italic text-[10px]">
                            Khung câu gợi ý trước khi xem toàn bộ bản dịch.
                          </p>
                        )}
                      </div>

                      {/* Unlock Next Hint Button */}
                      {revealedHintLevel < 3 && (
                        <button
                          type="button"
                          onClick={() => setRevealedHintLevel((l) => Math.min(l + 1, 3))}
                          className="w-full py-2 px-3 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs shadow-xs transition flex items-center justify-center gap-1.5"
                        >
                          <Unlock className="w-3.5 h-3.5" />
                          <span>Mở Gợi ý Cấp {revealedHintLevel + 1}</span>
                        </button>
                      )}
                    </div>
                  )}

                  {/* TAB 4: PHÂN TÍCH PHÁT ÂM */}
                  {tab.key === 'pronunciation' && (
                    <div className="space-y-3 pt-1">
                      {/* Audio Controls */}
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => speakEnglish(sentence.textEn, 0.95)}
                          className="flex-1 py-2 px-3 rounded-xl bg-sky-50 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-800 text-sky-700 dark:text-sky-300 font-bold text-xs hover:bg-sky-100 transition flex items-center justify-center gap-2"
                        >
                          <Volume2 className="w-4 h-4" />
                          <span>Nghe chuẩn (1.0x)</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => speakEnglish(sentence.textEn, 0.65)}
                          className="flex-1 py-2 px-3 rounded-xl bg-sky-50 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-800 text-sky-700 dark:text-sky-300 font-bold text-xs hover:bg-sky-100 transition flex items-center justify-center gap-2"
                        >
                          <Volume1 className="w-4 h-4" />
                          <span>Nghe chậm (0.65x)</span>
                        </button>
                      </div>

                      {/* Full IPA */}
                      {pronunciation.ipaFull && (
                        <div className="p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                          <span className="font-bold text-slate-700 dark:text-slate-300 block text-[11px]">
                            Phiên âm IPA toàn câu:
                          </span>
                          <span className="text-xs font-mono text-sky-600 dark:text-sky-400 mt-1 block">
                            {pronunciation.ipaFull}
                          </span>
                        </div>
                      )}

                      {/* Sentence Stress */}
                      {pronunciation.sentenceStressWords?.length > 0 && (
                        <div className="p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                          <span className="font-bold text-slate-700 dark:text-slate-300 block text-[11px] mb-1">
                            Từ khóa nhấn trọng âm câu (Sentence Stress):
                          </span>
                          <div className="flex flex-wrap gap-1.5">
                            {pronunciation.sentenceStressWords.map((word, i) => (
                              <span
                                key={i}
                                className="px-2 py-0.5 rounded-lg bg-sky-100 dark:bg-sky-950 text-sky-800 dark:text-sky-200 font-semibold text-[11px]"
                              >
                                {word}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Intonation */}
                      <div className="p-2.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 text-[11px]">
                        <span className="font-bold text-slate-700 dark:text-slate-200 block">
                          🎵 Ngữ điệu câu (Intonation):
                        </span>
                        <p className="text-slate-600 dark:text-slate-400 mt-0.5">
                          {pronunciation.intonation || 'Ngữ điệu hạ xuống ở cuối câu trần thuật (Falling intonation ↘).'}
                        </p>
                      </div>

                      {/* Linking rules */}
                      {pronunciation.linkingRules?.length > 0 && (
                        <div className="p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                          <span className="font-bold text-slate-700 dark:text-slate-300 block text-[11px] mb-1">
                            Quy tắc nối âm & âm yếu (Connected Speech):
                          </span>
                          <div className="space-y-1 text-[11px]">
                            {pronunciation.linkingRules.map((r, i) => (
                              <p key={i}>
                                <span className="font-semibold text-sky-600 dark:text-sky-400">
                                  {r.words}:
                                </span>{' '}
                                <span className="text-slate-600 dark:text-slate-300">
                                  {r.explanationVi}
                                </span>
                              </p>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Common Vietnamese Pitfalls */}
                      {pronunciation.vietnameseCommonPitfalls?.length > 0 && (
                        <div className="p-3 bg-amber-50/60 dark:bg-amber-950/20 rounded-xl border border-amber-200 dark:border-amber-900/40">
                          <div className="flex items-center gap-1.5 text-amber-800 dark:text-amber-300 font-bold text-[11px] mb-1">
                            <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                            <span>Lỗi phát âm người Việt thường mắc:</span>
                          </div>
                          <ul className="list-disc list-inside space-y-1 text-[11px] text-amber-900 dark:text-amber-200/90">
                            {pronunciation.vietnameseCommonPitfalls.map((pitfall, i) => (
                              <li key={i}>{pitfall}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}

                  {/* TAB 5: NGHĨA TIẾNG ANH */}
                  {tab.key === 'en_meaning' && (
                    <div className="space-y-2 pt-1">
                      <div className="p-3 bg-blue-50/60 dark:bg-blue-950/30 rounded-2xl border border-blue-200 dark:border-blue-900/40">
                        <span className="font-bold text-blue-800 dark:text-blue-300 block text-xs mb-1">
                          Contextual English Explanation
                        </span>
                        <p className="text-slate-700 dark:text-slate-200 leading-relaxed text-xs">
                          {sentence.englishContextMeaning ||
                            `In this context, "${sentence.textEn}" conveys a clear factual statement or description of everyday life.`}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* TAB 6: PHÂN TÍCH CHUYỂN NGỮ (VI -> EN) hoặc NGHĨA TIẾNG VIỆT (EN -> VI) */}
                  {tab.key === 'vi_meaning' && (
                    <div className="space-y-2 pt-1">
                      {isViToEn ? (
                        <div className="space-y-2">
                          <div className="p-3 bg-teal-50/80 dark:bg-teal-950/40 rounded-2xl border border-teal-200 dark:border-teal-800">
                            <span className="text-[10px] font-bold text-teal-700 dark:text-teal-300 uppercase tracking-wider block">
                              Phân tích đối chiếu chuyển ngữ (VI ➔ EN)
                            </span>
                            <p className="text-xs text-slate-700 dark:text-slate-300 mt-1 leading-relaxed">
                              Câu tiếng Việt: <strong className="text-teal-800 dark:text-teal-200">"{sentence.primaryTranslationVi}"</strong>
                            </p>
                            <p className="text-[11px] text-teal-800/80 dark:text-teal-300/80 mt-1 leading-relaxed">
                              {sentence.vietnameseNuance?.contrastExplanation ||
                                'Khi dịch sang tiếng Anh, chú ý trật tự từ S + V + O và chọn thì phù hợp. Tránh dịch thô từng từ (word-by-word) làm câu bị gượng gạo.'}
                            </p>
                          </div>
                        </div>
                      ) : (
                        !isViMeaningRevealed ? (
                          <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 text-center space-y-2">
                            <Lock className="w-6 h-6 text-slate-400 mx-auto" />
                            <p className="text-xs text-slate-600 dark:text-slate-400">
                              Nghĩa tiếng Việt được ẩn để bạn thử sức tự dịch trước.
                            </p>
                            <button
                              type="button"
                              onClick={() => setIsViMeaningRevealed(true)}
                              className="px-3 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs transition"
                            >
                              👁️ Mở xem nghĩa ngữ cảnh & phân tích
                            </button>
                          </div>
                        ) : (
                          <div className="space-y-2">
                            <div className="p-3 bg-teal-50/80 dark:bg-teal-950/40 rounded-2xl border border-teal-200 dark:border-teal-800">
                              <span className="text-[10px] font-bold text-teal-700 dark:text-teal-300 uppercase tracking-wider block">
                                Bản dịch tự nhiên theo ngữ cảnh
                              </span>
                              <p className="text-sm font-semibold text-teal-950 dark:text-teal-100 mt-1">
                                "{sentence.primaryTranslationVi}"
                              </p>
                            </div>

                            <div className="p-3 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 text-[11px] space-y-1">
                              <span className="font-bold text-slate-700 dark:text-slate-200 block">
                                Khác biệt giữa cách diễn đạt EN vs VI:
                              </span>
                              <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                                {sentence.vietnameseNuance?.contrastExplanation ||
                                  'Trong tiếng Anh, các bổ ngữ thời gian/nơi chốn thường ở cuối câu, còn trong tiếng Việt có thể linh hoạt đưa lên đầu để câu văn mượt mà.'}
                              </p>
                            </div>
                          </div>
                        )
                      )}
                    </div>
                  )}

                  {/* TAB 7: ĐÁP ÁN THAM KHẢO (Bảo vệ) */}
                  {tab.key === 'reference_answer' && (
                    <div className="space-y-2 pt-1">
                      {!isAnswerRevealed ? (
                        <div className="p-4 bg-rose-50/60 dark:bg-rose-950/20 rounded-2xl border border-dashed border-rose-300 dark:border-rose-900/50 text-center space-y-2.5">
                          <AlertTriangle className="w-6 h-6 text-rose-500 mx-auto" />
                          <div>
                            <h5 className="font-bold text-xs text-rose-800 dark:text-rose-200">
                              Đáp án đang được bảo vệ
                            </h5>
                            <p className="text-[11px] text-rose-700/80 dark:text-rose-300/80 mt-0.5">
                              Tự suy nghĩ và gõ bản dịch trước sẽ giúp bạn nhớ lâu hơn gấp 3 lần!
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => revealAnswer()}
                            className="px-3.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-xs transition"
                          >
                            🔓 Xem đáp án tham khảo
                          </button>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 rounded-2xl border border-emerald-200 dark:border-emerald-800">
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-300 uppercase tracking-wider block">
                                {isViToEn ? 'Đáp án tiếng Anh chuẩn' : 'Đáp án tiếng Việt chuẩn'}
                              </span>
                              <button
                                type="button"
                                onClick={() =>
                                  isViToEn
                                    ? speakEnglish(sentence.textEn)
                                    : speakVietnamese(sentence.primaryTranslationVi)
                                }
                                className="flex items-center gap-1 text-[11px] text-emerald-700 dark:text-emerald-300 hover:underline font-semibold"
                              >
                                <Volume2 className="w-3.5 h-3.5" />
                                <span>Nghe đọc</span>
                              </button>
                            </div>
                            <p className="text-sm font-bold text-emerald-950 dark:text-emerald-100 mt-1">
                              "{isViToEn ? sentence.textEn : sentence.primaryTranslationVi}"
                            </p>
                          </div>

                          {!isViToEn && sentence.alternativeTranslations?.length > 0 && (
                            <div className="p-2.5 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-[11px]">
                              <span className="font-semibold text-slate-600 dark:text-slate-300 block mb-1">
                                Các cách diễn đạt tương đương khác được chấp nhận:
                              </span>
                              <ul className="list-disc list-inside space-y-0.5 text-slate-500 dark:text-slate-400">
                                {sentence.alternativeTranslations.map((alt, idx) => (
                                  <li key={idx}>"{alt}"</li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </aside>
  );
}
