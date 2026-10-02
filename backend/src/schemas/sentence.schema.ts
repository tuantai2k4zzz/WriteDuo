import { Prop, Schema, SchemaFactory, raw } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { Reading } from './reading.schema';

export type SentenceDocument = Sentence & Document;

export class Token {
  text: string;
  lemma: string;
  pos: string;
  ipa: string;
  cefr: string;
  meaningVi: string;
}

export class GrammarComponent {
  role: string; // 'Subject' | 'Verb' | 'Object' | 'Auxiliary' | 'Adverbial' | 'TimeExpression'
  text: string;
  noteVi?: string;
}

export class GrammarAnalysis {
  tense: string;
  tenseExplanationVi: string;
  components: GrammarComponent[];
  notableStructures: string[];
}

export class LinkingRule {
  words: string;
  explanationVi: string;
}

export class PronunciationGuide {
  ipaFull: string;
  sentenceStressWords: string[];
  linkingRules: LinkingRule[];
  vietnameseCommonPitfalls: string[];
}

@Schema({ timestamps: true })
export class Sentence {
  @Prop({ type: Types.ObjectId, ref: 'Reading', required: true, index: true })
  readingId: Types.ObjectId;

  @Prop({ required: true })
  paragraphIndex: number;

  @Prop({ required: true })
  sentenceIndex: number;

  @Prop({ required: true })
  textEn: string;

  @Prop({ default: '' })
  audioUrl: string;

  @Prop({ default: '' })
  primaryTranslationVi: string;

  @Prop({ type: [String], default: [] })
  alternativeTranslations: string[];

  @Prop({ type: [raw({
    text: { type: String },
    lemma: { type: String },
    pos: { type: String },
    ipa: { type: String },
    cefr: { type: String },
    meaningVi: { type: String }
  })], default: [] })
  tokens: Token[];

  @Prop({ type: raw({
    tense: { type: String, default: '' },
    tenseExplanationVi: { type: String, default: '' },
    components: [{
      role: { type: String },
      text: { type: String },
      noteVi: { type: String }
    }],
    notableStructures: [{ type: String }]
  }), default: () => ({ tense: '', tenseExplanationVi: '', components: [], notableStructures: [] }) })
  grammarAnalysis: GrammarAnalysis;

  @Prop({ type: raw({
    ipaFull: { type: String, default: '' },
    sentenceStressWords: [{ type: String }],
    linkingRules: [{
      words: { type: String },
      explanationVi: { type: String }
    }],
    vietnameseCommonPitfalls: [{ type: String }]
  }), default: () => ({ ipaFull: '', sentenceStressWords: [], linkingRules: [], vietnameseCommonPitfalls: [] }) })
  pronunciationGuide: PronunciationGuide;

  @Prop({ default: false, index: true })
  isAnalyzed: boolean;
}

export const SentenceSchema = SchemaFactory.createForClass(Sentence);
SentenceSchema.index({ readingId: 1, paragraphIndex: 1, sentenceIndex: 1 });
