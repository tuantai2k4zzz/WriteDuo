/**
 * Lightweight Learning Telemetry & Event System for VSpeak MAX PRO
 */

export type LearningEventType =
  | 'answer_submitted'
  | 'answer_correct'
  | 'answer_incorrect'
  | 'hint_opened'
  | 'hint_level_revealed'
  | 'reference_answer_revealed'
  | 'vocabulary_opened'
  | 'vocabulary_saved'
  | 'grammar_opened'
  | 'pronunciation_played'
  | 'retry'
  | 'review_completed'
  | 'lesson_started'
  | 'lesson_completed'
  | 'boss_started'
  | 'boss_completed';

export interface TelemetryEvent {
  type: LearningEventType;
  timestamp: number;
  payload?: Record<string, any>;
}

class TelemetryLogger {
  private buffer: TelemetryEvent[] = [];
  private maxBufferSize = 100;

  public track(type: LearningEventType, payload?: Record<string, any>) {
    const event: TelemetryEvent = {
      type,
      timestamp: Date.now(),
      payload,
    };

    this.buffer.push(event);
    if (this.buffer.length > this.maxBufferSize) {
      this.buffer.shift();
    }

    // Dispatched to custom browser event for reactive UI hooks
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('vspeak:telemetry', { detail: event })
      );
    }
  }

  public getRecentEvents(): TelemetryEvent[] {
    return [...this.buffer];
  }
}

export const telemetry = new TelemetryLogger();
