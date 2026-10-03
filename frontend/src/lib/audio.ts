// Web Speech Synthesis & Web Audio Sound Effects (Mobile & Desktop Optimized)

let currentAudio: HTMLAudioElement | null = null;
let audioQueue: string[] = [];
let isPlayingQueue = false;

// Global reference to prevent WebKit/Android GC from destroying SpeechSynthesisUtterance mid-speech
declare global {
  interface Window {
    __vspeak_active_utterance?: SpeechSynthesisUtterance | null;
  }
}

/**
 * Split long text into <= 150 char chunks at natural punctuation boundaries for Google TTS fallback
 */
function chunkText(text: string, maxLen = 150): string[] {
  const clean = text.trim();
  if (clean.length <= maxLen) return [clean];

  const sentences = clean.match(/[^.!?,\n]+[.!?,\n]+|[^.!?,\n]+$/g) || [clean];
  const chunks: string[] = [];
  let current = '';

  for (const part of sentences) {
    const trimmed = part.trim();
    if (!trimmed) continue;
    if ((current + ' ' + trimmed).trim().length <= maxLen) {
      current = (current ? current + ' ' : '') + trimmed;
    } else {
      if (current) chunks.push(current);
      if (trimmed.length > maxLen) {
        // Fallback: split by words
        const words = trimmed.split(/\s+/);
        let wordChunk = '';
        for (const w of words) {
          if ((wordChunk + ' ' + w).trim().length <= maxLen) {
            wordChunk = (wordChunk ? wordChunk + ' ' : '') + w;
          } else {
            if (wordChunk) chunks.push(wordChunk);
            wordChunk = w;
          }
        }
        if (wordChunk) chunks.push(wordChunk);
        current = '';
      } else {
        current = trimmed;
      }
    }
  }
  if (current) chunks.push(current);
  return chunks.length > 0 ? chunks : [clean];
}

/**
 * Stop any current speech synthesis or HTML5 audio playback
 */
export function stopAllSpeech() {
  if (typeof window === 'undefined') return;

  if (window.speechSynthesis) {
    try {
      window.speechSynthesis.cancel();
      window.__vspeak_active_utterance = null;
    } catch {}
  }

  if (currentAudio) {
    try {
      currentAudio.pause();
      currentAudio.currentTime = 0;
      currentAudio = null;
    } catch {}
  }
  audioQueue = [];
  isPlayingQueue = false;
}

/**
 * Play audio chunks sequentially using HTML5 Audio (Google TTS stream)
 */
function playGoogleTTSFallback(text: string, lang: 'en' | 'vi', rate: number = 1.0): Promise<void> {
  return new Promise((resolve) => {
    stopAllSpeech();

    const chunks = chunkText(text);
    if (chunks.length === 0) {
      resolve();
      return;
    }

    let currentIndex = 0;
    const playNext = () => {
      if (currentIndex >= chunks.length) {
        currentAudio = null;
        resolve();
        return;
      }

      const chunk = chunks[currentIndex++];
      const url = `https://translate.google.com/translate_tts?ie=UTF-8&client=tw-ob&tl=${lang}&q=${encodeURIComponent(chunk)}`;
      const audio = new Audio(url);
      currentAudio = audio;
      audio.playbackRate = Math.max(0.6, Math.min(1.5, rate));

      audio.onended = () => {
        playNext();
      };
      audio.onerror = () => {
        // Skip to next chunk or resolve on error
        playNext();
      };

      audio.play().catch(() => {
        // Autoplay policy or network issue
        resolve();
      });
    };

    playNext();
  });
}

/**
 * Speak English text with mobile-safe SpeechSynthesis and Google TTS fallback
 */
export function speakEnglish(text: string, rate: number = 0.95) {
  if (typeof window === 'undefined' || !text?.trim()) return;

  const cleanText = text.trim();

  // Try Web Speech API if supported
  if (typeof window.speechSynthesis !== 'undefined') {
    try {
      // Unfreeze paused speech synthesis on mobile browsers
      if (window.speechSynthesis.paused) {
        window.speechSynthesis.resume();
      }

      // Avoid canceling immediately before speak in same tick
      if (window.speechSynthesis.speaking) {
        window.speechSynthesis.cancel();
      }

      let started = false;
      const utterance = new SpeechSynthesisUtterance(cleanText);
      utterance.lang = 'en-US';
      utterance.rate = rate;

      // Select high-quality English voice if available
      const voices = window.speechSynthesis.getVoices();
      if (voices.length > 0) {
        const preferredVoice = voices.find(
          (v) =>
            v.lang.startsWith('en') &&
            (v.name.includes('Google') ||
              v.name.includes('Natural') ||
              v.name.includes('Samantha') ||
              v.name.includes('Daniel') ||
              v.name.includes('Karen') ||
              v.name.includes('US English'))
        ) || voices.find((v) => v.lang.startsWith('en'));

        if (preferredVoice) {
          utterance.voice = preferredVoice;
        }
      }

      // Retain reference on window to prevent aggressive WebKit garbage collection
      window.__vspeak_active_utterance = utterance;

      let fallbackTimer: NodeJS.Timeout | null = null;

      utterance.onstart = () => {
        started = true;
        if (fallbackTimer) clearTimeout(fallbackTimer);
      };

      utterance.onend = () => {
        window.__vspeak_active_utterance = null;
        if (fallbackTimer) clearTimeout(fallbackTimer);
      };

      utterance.onerror = (e) => {
        window.__vspeak_active_utterance = null;
        if (fallbackTimer) clearTimeout(fallbackTimer);
        // If canceled intentionally, do not trigger fallback
        if (e.error !== 'canceled' && e.error !== 'interrupted') {
          playGoogleTTSFallback(cleanText, 'en', rate);
        }
      };

      // Fallback timer: if onstart does not fire within 500ms (common on mobile when synthesis fails silently)
      fallbackTimer = setTimeout(() => {
        if (!started) {
          try {
            window.speechSynthesis.cancel();
          } catch {}
          window.__vspeak_active_utterance = null;
          playGoogleTTSFallback(cleanText, 'en', rate);
        }
      }, 500);

      window.speechSynthesis.speak(utterance);
      return;
    } catch {
      // Fallback below
    }
  }

  // Fallback to HTML5 audio stream
  playGoogleTTSFallback(cleanText, 'en', rate);
}

/**
 * Speak Vietnamese text with mobile-safe SpeechSynthesis and Google TTS fallback
 */
export function speakVietnamese(text: string, rate: number = 1.0) {
  if (typeof window === 'undefined' || !text?.trim()) return;

  const cleanText = text.trim();

  // On mobile, native Vietnamese TTS is frequently absent. We check if a Vietnamese voice exists.
  if (typeof window.speechSynthesis !== 'undefined') {
    try {
      if (window.speechSynthesis.paused) {
        window.speechSynthesis.resume();
      }

      const voices = window.speechSynthesis.getVoices();
      const viVoice = voices.find((v) => v.lang.startsWith('vi'));

      // If a Vietnamese voice is confirmed installed in the browser:
      if (viVoice) {
        if (window.speechSynthesis.speaking) {
          window.speechSynthesis.cancel();
        }

        let started = false;
        const utterance = new SpeechSynthesisUtterance(cleanText);
        utterance.lang = 'vi-VN';
        utterance.voice = viVoice;
        utterance.rate = rate;

        window.__vspeak_active_utterance = utterance;

        let fallbackTimer: NodeJS.Timeout | null = null;

        utterance.onstart = () => {
          started = true;
          if (fallbackTimer) clearTimeout(fallbackTimer);
        };

        utterance.onend = () => {
          window.__vspeak_active_utterance = null;
          if (fallbackTimer) clearTimeout(fallbackTimer);
        };

        utterance.onerror = (e) => {
          window.__vspeak_active_utterance = null;
          if (fallbackTimer) clearTimeout(fallbackTimer);
          if (e.error !== 'canceled' && e.error !== 'interrupted') {
            playGoogleTTSFallback(cleanText, 'vi', rate);
          }
        };

        fallbackTimer = setTimeout(() => {
          if (!started) {
            try {
              window.speechSynthesis.cancel();
            } catch {}
            window.__vspeak_active_utterance = null;
            playGoogleTTSFallback(cleanText, 'vi', rate);
          }
        }, 500);

        window.speechSynthesis.speak(utterance);
        return;
      }
    } catch {
      // Fall through to Google TTS
    }
  }

  // Google TTS provides natural Vietnamese audio stream on all mobile devices
  playGoogleTTSFallback(cleanText, 'vi', rate);
}

export function playSound(
  type:
    | 'correct'
    | 'almost'
    | 'incorrect'
    | 'complete'
    | 'click'
    | 'mode_switch'
    | 'ironman_power'
) {
  if (typeof window === 'undefined') return;

  try {
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContext) return;

    const ctx = new AudioContext();
    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }

    if (type === 'correct') {
      // Pleasant high double chime (Duolingo style)
      const now = ctx.currentTime;
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();

      osc1.type = 'sine';
      osc2.type = 'sine';

      osc1.frequency.setValueAtTime(587.33, now); // D5
      osc1.frequency.setValueAtTime(880, now + 0.12); // A5

      osc2.frequency.setValueAtTime(880, now);
      osc2.frequency.setValueAtTime(1174.66, now + 0.12); // D6

      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(ctx.destination);

      osc1.start(now);
      osc2.start(now);
      osc1.stop(now + 0.45);
      osc2.stop(now + 0.45);
    } else if (type === 'almost') {
      // Warm neutral chime
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(440, now);
      osc.frequency.setValueAtTime(659.25, now + 0.1);
      gain.gain.setValueAtTime(0.18, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.35);
    } else if (type === 'incorrect') {
      // Low buzz
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(220, now); // A3
      osc.frequency.setValueAtTime(196, now + 0.12); // G3

      gain.gain.setValueAtTime(0.25, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.4);
    } else if (type === 'complete') {
      // Celebratory arpeggio
      const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
      notes.forEach((freq, idx) => {
        const now = ctx.currentTime + idx * 0.1;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now);
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.3);
      });
    } else if (type === 'click') {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(800, now);
      gain.gain.setValueAtTime(0.05, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.05);
    } else if (type === 'mode_switch') {
      // 3D Stark Tech holographic mode switch sound (frequency sweep)
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(300, now);
      osc.frequency.exponentialRampToValueAtTime(1200, now + 0.15);
      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.2);
    } else if (type === 'ironman_power') {
      // Arc reactor surge chime
      const now = ctx.currentTime;
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();
      osc1.type = 'triangle';
      osc2.type = 'sine';
      osc1.frequency.setValueAtTime(440, now);
      osc1.frequency.exponentialRampToValueAtTime(880, now + 0.25);
      osc2.frequency.setValueAtTime(660, now);
      osc2.frequency.exponentialRampToValueAtTime(1320, now + 0.25);
      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(ctx.destination);
      osc1.start(now);
      osc2.start(now);
      osc1.stop(now + 0.4);
      osc2.stop(now + 0.4);
    }
  } catch {
    // AudioContext not allowed before user interaction
  }
}

