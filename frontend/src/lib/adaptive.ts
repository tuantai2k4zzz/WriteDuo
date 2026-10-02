import { UserProgressData, GrammarWeakness } from '../types';

export interface SkillVector {
  grammar: number; // 0 - 100
  vocabulary: number;
  translation: number;
  pronunciation: number;
  listening: number;
  reading: number;
  writing: number;
  speaking: number;
}

export interface AdaptiveRecommendation {
  type: 'review' | 'boss' | 'lesson';
  title: string;
  description: string;
  targetSkill: keyof SkillVector;
  urgency: 'low' | 'medium' | 'high';
  actionText: string;
}

/**
 * Computes live skill metrics based on real user data
 */
export function computeSkillVector(
  progress: UserProgressData | null,
  weaknesses: GrammarWeakness[]
): SkillVector {
  const xp = progress?.xp ?? 100;
  const sentencesCount = progress?.completedSentencesCount ?? 15;
  const readingsCount = progress?.completedReadingsCount ?? 3;

  // Weakness penalty calculation
  const totalWeaknessErrors = weaknesses.reduce((acc, w) => acc + w.errorCount, 0);
  const avgWeaknessMastery =
    weaknesses.length > 0
      ? weaknesses.reduce((acc, w) => acc + w.masteryScore, 0) / weaknesses.length
      : 80;

  const baseLevelFactor = Math.min(95, 45 + Math.floor(xp / 25));

  const grammar = Math.max(30, Math.min(98, Math.round(avgWeaknessMastery)));
  const vocabulary = Math.max(35, Math.min(96, Math.round(baseLevelFactor + (sentencesCount * 0.5))));
  const translation = Math.max(40, Math.min(95, Math.round(baseLevelFactor + (readingsCount * 2) - (totalWeaknessErrors * 1.5))));
  const pronunciation = Math.max(35, Math.min(90, Math.round(baseLevelFactor - 5)));
  const listening = Math.max(30, Math.min(88, Math.round(baseLevelFactor - 8)));
  const reading = Math.max(45, Math.min(96, Math.round(baseLevelFactor + 5)));
  const writing = Math.max(35, Math.min(92, Math.round(translation - 4)));
  const speaking = Math.max(30, Math.min(85, Math.round(pronunciation - 3)));

  return {
    grammar,
    vocabulary,
    translation,
    pronunciation,
    listening,
    reading,
    writing,
    speaking,
  };
}

/**
 * Generates an adaptive recommendation for the next best action
 */
export function getAdaptiveRecommendation(
  skills: SkillVector,
  reviewQueueCount: number
): AdaptiveRecommendation {
  if (reviewQueueCount > 0) {
    return {
      type: 'review',
      title: 'Hồi Tưởng Trí Nhớ SRS',
      description: `${reviewQueueCount} cấu trúc đang giảm độ bền trong não bộ. Ôn tập ngay để tránh rơi rụng.`,
      targetSkill: 'grammar',
      urgency: 'high',
      actionText: `Ôn Luyện (${reviewQueueCount})`,
    };
  }

  // Find lowest skill
  const entries = Object.entries(skills) as [keyof SkillVector, number][];
  const lowest = entries.reduce((prev, curr) => (curr[1] < prev[1] ? curr : prev));

  if (lowest[1] < 60) {
    return {
      type: 'lesson',
      title: `Củng cố kỹ năng ${lowest[0].toUpperCase()}`,
      description: `Chỉ số phản xạ ${lowest[0]} hiện đang ở mức ${lowest[1]}%. Hoàn thành thêm 1 bài đọc để nâng cao.`,
      targetSkill: lowest[0],
      urgency: 'medium',
      actionText: 'Luyện Kỹ Năng Này',
    };
  }

  return {
    type: 'boss',
    title: 'Thử Thách Trùm Ngôn Ngữ',
    description: 'Chỉ số học tập của bạn đang đạt phong độ cao. Hãy bước vào màn dịch ngược nguyên đoạn văn!',
    targetSkill: 'writing',
    urgency: 'low',
    actionText: 'Vào Boss Battle',
  };
}
