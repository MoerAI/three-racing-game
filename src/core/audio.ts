export interface AudioSystem {
  ctx: AudioContext | null;
  masterGain: GainNode | null;
  engineOscillator: OscillatorNode | null;
  engineGain: GainNode | null;
  isActive: boolean;
}

export function createAudioSystem(): AudioSystem {
  const audioSystem: AudioSystem = {
    ctx: null,
    masterGain: null,
    engineOscillator: null,
    engineGain: null,
    isActive: false,
  };

  // Activate on first user interaction (autoplay policy)
  function activate(): void {
    if (audioSystem.isActive) return;

    const ctx = new AudioContext();
    const masterGain = ctx.createGain();
    masterGain.gain.value = 0.3;
    masterGain.connect(ctx.destination);

    // Engine hum: continuous oscillator, pitch varies with speed
    const engineOscillator = ctx.createOscillator();
    engineOscillator.type = 'sawtooth';
    engineOscillator.frequency.value = 80;
    const engineGain = ctx.createGain();
    engineGain.gain.value = 0.15;
    engineOscillator.connect(engineGain);
    engineGain.connect(masterGain);
    engineOscillator.start();

    audioSystem.ctx = ctx;
    audioSystem.masterGain = masterGain;
    audioSystem.engineOscillator = engineOscillator;
    audioSystem.engineGain = engineGain;
    audioSystem.isActive = true;

    window.__DEBUG__.audioContextActive = true;

    document.removeEventListener('click', activate);
    document.removeEventListener('keydown', activate);
  }

  document.addEventListener('click', activate);
  document.addEventListener('keydown', activate);

  return audioSystem;
}

export function updateEngineSound(audioSystem: AudioSystem, speed: number): void {
  if (!audioSystem.isActive || !audioSystem.engineOscillator) return;
  // Pitch: 80Hz at rest, up to 280Hz at max speed (88)
  const targetFreq = 80 + Math.abs(speed) * 2.27;
  audioSystem.engineOscillator.frequency.value = targetFreq;
}

export function playCollisionSound(audioSystem: AudioSystem): void {
  if (!audioSystem.isActive || !audioSystem.ctx || !audioSystem.masterGain) return;
  const ctx = audioSystem.ctx;

  const oscillator = ctx.createOscillator();
  const gainNode = ctx.createGain();
  oscillator.type = 'sine';
  oscillator.frequency.value = 60;
  gainNode.gain.setValueAtTime(0.5, ctx.currentTime);
  gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2);
  oscillator.connect(gainNode);
  gainNode.connect(audioSystem.masterGain);
  oscillator.start(ctx.currentTime);
  oscillator.stop(ctx.currentTime + 0.2);
}

export function playBoostSound(audioSystem: AudioSystem): void {
  if (!audioSystem.isActive || !audioSystem.ctx || !audioSystem.masterGain) return;
  const ctx = audioSystem.ctx;

  const oscillator = ctx.createOscillator();
  const gainNode = ctx.createGain();
  oscillator.type = 'sine';
  oscillator.frequency.setValueAtTime(200, ctx.currentTime);
  oscillator.frequency.linearRampToValueAtTime(800, ctx.currentTime + 0.3);
  gainNode.gain.setValueAtTime(0.3, ctx.currentTime);
  gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
  oscillator.connect(gainNode);
  gainNode.connect(audioSystem.masterGain);
  oscillator.start(ctx.currentTime);
  oscillator.stop(ctx.currentTime + 0.3);
}

export function playLapChime(audioSystem: AudioSystem): void {
  if (!audioSystem.isActive || !audioSystem.ctx || !audioSystem.masterGain) return;
  const ctx = audioSystem.ctx;
  const masterGain = audioSystem.masterGain;

  // Two-tone chime: 440Hz then 660Hz
  [440, 660].forEach((freq, index) => {
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();
    oscillator.type = 'sine';
    oscillator.frequency.value = freq;
    const startTime = ctx.currentTime + index * 0.15;
    gainNode.gain.setValueAtTime(0.4, startTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, startTime + 0.15);
    oscillator.connect(gainNode);
    gainNode.connect(masterGain);
    oscillator.start(startTime);
    oscillator.stop(startTime + 0.15);
  });
}
