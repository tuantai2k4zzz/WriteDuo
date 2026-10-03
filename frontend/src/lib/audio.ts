// Web Speech Synthesis & Web Audio Sound Effects (Mobile & Desktop Optimized)

let currentAudio: HTMLAudioElement | null = null;
let currentSessionId = 0;

// Global reference to prevent WebKit/Android GC from destroying SpeechSynthesisUtterance mid-speech
declare global {
  interface Window {
    __vspeak_active_utterance?: SpeechSynthesisUtterance | null;
  }
}

function isMobileBrowser(): boolean {
  if (typeof window === 'undefined') return false;
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}

/**
 * Split long text into <= 150 char chunks at natural punctuation boundaries
 */
function chunkText(text: string, maxLen = 150): string[] {
  if (!text || typeof text !== 'string') return [];
  const clean = text.trim();
  if (!clean || clean.toLowerCase() === 'undefined' || clean.toLowerCase() === 'null') return [];
  if (clean.length <= maxLen) return [clean];

  const sentences = clean.match(/[^.!?,\n]+[.!?,\n]+|[^.!?,\n]+$/g) || [clean];
  const chunks: string[] = [];
  let current = '';

  for (const part of sentences) {
    const trimmed = part.trim();
    if (!trimmed || trimmed.toLowerCase() === 'undefined' || trimmed.toLowerCase() === 'null') continue;
    if ((current + ' ' + trimmed).trim().length <= maxLen) {
      current = (current ? current + ' ' : '') + trimmed;
    } else {
      if (current) chunks.push(current);
      if (trimmed.length > maxLen) {
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
  return chunks.filter((c) => c && c.trim() && c.toLowerCase() !== 'undefined' && c.toLowerCase() !== 'null');
}

/**
 * Stop any current speech synthesis or HTML5 audio playback
 */
export function stopAllSpeech() {
  currentSessionId++;

  if (typeof window === 'undefined') return;

  if (window.speechSynthesis) {
    try {
      window.speechSynthesis.cancel();
      window.__vspeak_active_utterance = null;
    } catch {}
  }

  if (currentAudio) {
    try {
      currentAudio.onended = null;
      currentAudio.onerror = null;
      currentAudio.pause();
      currentAudio.currentTime = 0;
      currentAudio.src = '';
    } catch {}
    currentAudio = null;
  }
}

/**
 * Play high-fidelity TTS audio stream via /api/tts proxy (works on all mobile & desktop browsers)
 */
function playStreamingTTS(text: string, lang: 'en' | 'vi', rate: number = 1.0): Promise<void> {
  if (!text || typeof text !== 'string') return Promise.resolve();
  const cleanText = text.trim();
  if (!cleanText || cleanText.toLowerCase() === 'undefined' || cleanText.toLowerCase() === 'null') {
    return Promise.resolve();
  }

  return new Promise((resolve) => {
    stopAllSpeech();
    const sessionId = currentSessionId;

    const chunks = chunkText(cleanText);
    if (chunks.length === 0) {
      resolve();
      return;
    }

    let currentIndex = 0;
    const playNext = () => {
      // Abort if a newer speech session was initiated
      if (sessionId !== currentSessionId) {
        resolve();
        return;
      }

      // Finish when all chunks played
      if (currentIndex >= chunks.length) {
        if (currentAudio) {
          currentAudio = null;
        }
        resolve();
        return; // Essential return to avoid playing chunks[out_of_bounds] as "undefined"
      }

      const rawChunk = chunks[currentIndex++];
      if (!rawChunk || typeof rawChunk !== 'string') {
        playNext();
        return;
      }
      const chunk = rawChunk.trim();
      if (!chunk || chunk.toLowerCase() === 'undefined' || chunk.toLowerCase() === 'null') {
        playNext();
        return;
      }

      // Primary: Local Next.js route handler /api/tts
      const primaryUrl = `/api/tts?text=${encodeURIComponent(chunk)}&lang=${lang}`;
      const audio = new Audio(primaryUrl);
      currentAudio = audio;
      audio.playbackRate = Math.max(0.6, Math.min(1.5, rate));

      audio.onended = () => {
        if (sessionId !== currentSessionId) return;
        playNext();
      };

      audio.onerror = () => {
        if (sessionId !== currentSessionId) return;
        // Fallback: try backend API /api/v1/tts if Next.js route fails
        const backendBase = (
          process.env.NEXT_PUBLIC_API_URL || 'https://write-duo-ye5x-peach.vercel.app/api/v1'
        ).replace(/\/+$/, '');
        const fallbackUrl = `${backendBase}/tts?text=${encodeURIComponent(chunk)}&lang=${lang}`;

        const fallbackAudio = new Audio(fallbackUrl);
        currentAudio = fallbackAudio;
        fallbackAudio.playbackRate = Math.max(0.6, Math.min(1.5, rate));

        fallbackAudio.onended = () => {
          if (sessionId !== currentSessionId) return;
          playNext();
        };
        fallbackAudio.onerror = () => {
          if (sessionId !== currentSessionId) return;
          // If both streaming routes fail, fallback to local Web Speech API
          playWebSpeechFallback(chunk, lang, rate, sessionId).then(() => {
            if (sessionId !== currentSessionId) return;
            playNext();
          });
        };

        fallbackAudio.play().catch(() => {
          if (sessionId !== currentSessionId) return;
          playWebSpeechFallback(chunk, lang, rate, sessionId).then(() => {
            if (sessionId !== currentSessionId) return;
            playNext();
          });
        });
      };

      audio.play().catch(() => {
        if (sessionId !== currentSessionId) return;
        // Autoplay policy or error, fallback to Web Speech API
        playWebSpeechFallback(chunk, lang, rate, sessionId).then(() => {
          if (sessionId !== currentSessionId) return;
          playNext();
        });
      });
    };

    playNext();
  });
}

/**
 * Local Web Speech API playback fallback
 */
function playWebSpeechFallback(text: string, lang: 'en' | 'vi', rate: number = 1.0, sessionId?: number): Promise<void> {
  return new Promise((resolve) => {
    if (typeof window === 'undefined' || !window.speechSynthesis || (sessionId !== undefined && sessionId !== currentSessionId)) {
      resolve();
      return;
    }

    try {
      if (window.speechSynthesis.paused) {
        window.speechSynthesis.resume();
      }

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = lang === 'vi' ? 'vi-VN' : 'en-US';
      utterance.rate = rate;

      const voices = window.speechSynthesis.getVoices();
      if (voices.length > 0) {
        const voice = voices.find((v) => v.lang.startsWith(lang));
        if (voice) utterance.voice = voice;
      }

      window.__vspeak_active_utterance = utterance;

      utterance.onend = () => {
        window.__vspeak_active_utterance = null;
        resolve();
      };
      utterance.onerror = () => {
        window.__vspeak_active_utterance = null;
        resolve();
      };

      window.speechSynthesis.speak(utterance);
    } catch {
      resolve();
    }
  });
}

/**
 * Speak English text with mobile-first audio stream and desktop WebSpeech
 */
export function speakEnglish(text: string, rate: number = 0.95) {
  if (typeof window === 'undefined' || !text || typeof text !== 'string') return;
  const cleanText = text.trim();
  if (!cleanText || cleanText.toLowerCase() === 'undefined' || cleanText.toLowerCase() === 'null') return;

  // On mobile browsers, always use our reliable high-fidelity MP3 audio stream
  if (isMobileBrowser()) {
    playStreamingTTS(cleanText, 'en', rate);
    return;
  }

  // On desktop, try Web Speech API first for instant latency, with streaming fallback
  if (typeof window.speechSynthesis !== 'undefined') {
    try {
      if (window.speechSynthesis.paused) {
        window.speechSynthesis.resume();
      }

      const utterance = new SpeechSynthesisUtterance(cleanText);
      utterance.lang = 'en-US';
      utterance.rate = rate;

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

      window.__vspeak_active_utterance = utterance;

      utterance.onend = () => {
        window.__vspeak_active_utterance = null;
      };

      utterance.onerror = (e) => {
        window.__vspeak_active_utterance = null;
        if (e.error !== 'canceled' && e.error !== 'interrupted') {
          playStreamingTTS(cleanText, 'en', rate);
        }
      };

      window.speechSynthesis.speak(utterance);
      return;
    } catch {
      // Fallback
    }
  }

  playStreamingTTS(cleanText, 'en', rate);
}

/**
 * Speak Vietnamese text (uses high-fidelity streaming TTS since native Vietnamese voice is rare on OS)
 */
export function speakVietnamese(text: string, rate: number = 1.0) {
  if (typeof window === 'undefined' || !text || typeof text !== 'string') return;
  const cleanText = text.trim();
  if (!cleanText || cleanText.toLowerCase() === 'undefined' || cleanText.toLowerCase() === 'null') return;

  // On both mobile and desktop, streaming Google TTS provides fluent, natural Vietnamese
  playStreamingTTS(cleanText, 'vi', rate);
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

