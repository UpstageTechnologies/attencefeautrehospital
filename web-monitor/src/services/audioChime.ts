// Web Audio API Synthesized Hospital Chime & Announcement Engine
// Plays crisp dual-tone bell (Ding-Dong) and optional room voice call

class AudioChimeService {
  private audioCtx: AudioContext | null = null;
  private soundEnabled: boolean = false;

  public enableAudio(): void {
    if (!this.audioCtx) {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioContextClass) {
        this.audioCtx = new AudioContextClass();
      }
    }
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
    this.soundEnabled = true;
  }

  public isEnabled(): boolean {
    return this.soundEnabled;
  }

  // Play pleasant acoustic dual-tone bell (G4 -> C5 chime)
  public playChime(): void {
    if (!this.soundEnabled || !this.audioCtx) return;

    try {
      const now = this.audioCtx.currentTime;

      // First Tone (G4 ~ 392 Hz)
      const osc1 = this.audioCtx.createOscillator();
      const gain1 = this.audioCtx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(392, now);
      gain1.gain.setValueAtTime(0, now);
      gain1.gain.linearRampToValueAtTime(0.4, now + 0.05);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.8);
      osc1.connect(gain1);
      gain1.connect(this.audioCtx.destination);
      osc1.start(now);
      osc1.stop(now + 0.8);

      // Second Tone (C5 ~ 523.25 Hz) after 300ms
      const osc2 = this.audioCtx.createOscillator();
      const gain2 = this.audioCtx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(523.25, now + 0.32);
      gain2.gain.setValueAtTime(0, now + 0.32);
      gain2.gain.linearRampToValueAtTime(0.45, now + 0.37);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 1.4);
      osc2.connect(gain2);
      gain2.connect(this.audioCtx.destination);
      osc2.start(now + 0.32);
      osc2.stop(now + 1.4);
    } catch (e) {
      console.warn('Audio chime playback issue:', e);
    }
  }

  // Announce Token via Web Speech Synthesis API
  public announceToken(tokenNumber: number, roomNumber: string): void {
    if (!this.soundEnabled) return;

    // Play chime first
    this.playChime();

    if ('speechSynthesis' in window) {
      setTimeout(() => {
        window.speechSynthesis.cancel();
        const text = `Token number ${tokenNumber}, please proceed to ${roomNumber}.`;
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 0.95;
        utterance.pitch = 1.05;
        window.speechSynthesis.speak(utterance);
      }, 700);
    }
  }
}

export const audioChime = new AudioChimeService();
