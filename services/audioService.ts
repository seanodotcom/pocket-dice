class AudioService {
  private ctx: AudioContext | null = null;
  private enabled: boolean = true;
  private noiseBuffer: AudioBuffer | null = null;

  constructor() {
    try {
      this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    } catch (e) {
      console.warn('Web Audio API not supported');
    }
  }

  private getNoiseBuffer(): AudioBuffer | null {
      if (!this.ctx) return null;
      if (!this.noiseBuffer) {
          const duration = 0.1; // Short bursts
          const bufferSize = this.ctx.sampleRate * duration;
          const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
          const data = buffer.getChannelData(0);
          for (let i = 0; i < bufferSize; i++) {
              data[i] = Math.random() * 2 - 1;
          }
          this.noiseBuffer = buffer;
      }
      return this.noiseBuffer;
  }

  private playTone(freq: number, type: OscillatorType, duration: number, vol: number = 0.1) {
    if (!this.enabled || !this.ctx) return;
    
    // Resume context if suspended (browser policy)
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
    
    gain.gain.setValueAtTime(vol, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + duration);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start();
    osc.stop(this.ctx.currentTime + duration);
  }

  playBeep() {
    this.playTone(800, 'square', 0.1);
  }

  playSelect() {
    this.playTone(1200, 'square', 0.05);
  }

  playEnter() {
    this.playTone(600, 'square', 0.1);
    setTimeout(() => this.playTone(800, 'square', 0.1), 100);
  }

  playRoll() {
    if (!this.enabled || !this.ctx) return;
    if (this.ctx.state === 'suspended') this.ctx.resume();

    const now = this.ctx.currentTime;
    // Increased count and spacing to make it last ~1 second
    const count = 12 + Math.floor(Math.random() * 4); 
    
    for (let i = 0; i < count; i++) {
        const offset = i * 0.07 + (Math.random() * 0.03); 
        this.playClack(now + offset);
    }
  }

  private playClack(time: number) {
      if (!this.ctx) return;
      const buffer = this.getNoiseBuffer();
      if (!buffer) return;

      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(1200, time);
      filter.frequency.exponentialRampToValueAtTime(600, time + 0.06);

      const gain = this.ctx.createGain();
      const vol = 0.15 + Math.random() * 0.25;
      gain.gain.setValueAtTime(vol, time);
      gain.gain.exponentialRampToValueAtTime(0.01, time + 0.06);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);
      
      noise.start(time);
  }

  playWin() {
    this.playTone(523.25, 'square', 0.1); // C5
    setTimeout(() => this.playTone(659.25, 'square', 0.1), 150); // E5
    setTimeout(() => this.playTone(783.99, 'square', 0.2), 300); // G5
    setTimeout(() => this.playTone(1046.50, 'square', 0.4), 450); // C6
  }

  toggleSound(on: boolean) {
    this.enabled = on;
  }
}

export const audioService = new AudioService();