import type { Channel, DrumType, FxInstance, MixerTrack, Note, Pattern, Project, SynthParams } from './types/project';
export type RockStyle = 'classic' | 'hard' | 'ballad';
export const NOTE_NAMES = ['До', 'До♯', 'Ре', 'Ре♯', 'Ми', 'Фа', 'Фа♯', 'Соль', 'Соль♯', 'Ля', 'Ля♯', 'Си'];
export const noteLabel = (midi: number) => NOTE_NAMES[((midi % 12) + 12) % 12] + (Math.floor(midi / 12) - 1);
export const uid = () => crypto.randomUUID();
const synth: SynthParams = { osc1Waveform: 'triangle', osc1Octave: 0, osc1Level: 1, osc2Waveform: 'sine', osc2Octave: 0, osc2Detune: 0, osc2Level: 0, filterType: 'lowpass', filterCutoff: 8000, filterQ: 0.5, filterEnvAmount: 0, attack: 0.002, decay: 0.2, sustain: 0.6, release: 0.12, volume: 0.8 };
const effect = (type: FxInstance['type'], params: Record<string, number>): FxInstance => ({ id: uid(), type, params, bypass: false });

/** Original musical patterns assembled from individual CC0 recordings; no song recordings. */
export function makeRockProject(style: RockStyle, tonic: number, bars: 16 | 32 | 48, variation: number): Project {
  const kit: [string, string, DrumType][] = [['kick', 'Бочка', 'kick'], ['snare', 'Малый', 'snare'], ['closedHat', 'Хэт', 'closedHat'], ['openHat', 'Открытый хэт', 'openHat'], ['tom', 'Том', 'tom'], ['crash', 'Крэш', 'clap'], ['ride', 'Райд', 'openHat']];
  const channels: Channel[] = kit.map(([id, name, drumType]) => ({ id: 'rock-' + id, name, kind: 'drum', color: '#d89557', drumType, sampleInstrument: 'rock-' + id, mixerTrackId: 'rock-drums' }));
  for (const [id, name, sampleInstrument] of [['bass', 'Бас-гитара', 'rock-bass'], ['guitar', 'Ритм-гитара', 'rock-guitar'], ['lead', 'Мелодия', 'rock-guitar']]) channels.push({ id: 'part-' + id, name, kind: 'synth', color: '#719f94', sampleInstrument, synthParams: { ...synth }, mixerTrackId: 'mix-' + id });
  const track = (id: string, name: string, volume: number, pan: number, effects: FxInstance[] = []): MixerTrack => ({ id, name, volume, pan, effects, mute: false, solo: false });
  const drive = style === 'hard' ? 0.65 : style === 'classic' ? 0.28 : 0.03;
  const guitarFx = (lead: boolean) => [effect('distortion', { distortion: drive, wet: 1 }), effect('filter', { type: 0, frequency: lead ? 5200 : 4200, q: 0.5 }), effect('reverb', { decay: lead ? 1.8 : 0.9, preDelay: 0.015, wet: lead ? 0.16 : 0.07 })];
  const mixerTracks = [track('track-master', 'Общая громкость', 0.8, 0), track('rock-drums', 'Барабаны', 0.78, 0, [effect('compressor', { threshold: -18, knee: 16, ratio: 3, attack: 0.01, release: 0.15 })]), track('mix-bass', 'Бас-гитара', 0.72, 0), track('mix-guitar', 'Ритм-гитара', 0.52, -0.22, guitarFx(false)), track('mix-lead', 'Мелодия', 0.55, 0.18, guitarFx(true))];
  const structure = bars === 16 ? ['Вступление', 'Куплет', 'Припев', 'Финал'] : bars === 32 ? ['Вступление', 'Куплет 1', 'Куплет 1', 'Припев', 'Припев', 'Куплет 2', 'Припев', 'Финал'] : ['Вступление', 'Куплет 1', 'Куплет 1', 'Припев', 'Припев', 'Переход', 'Куплет 2', 'Куплет 2', 'Припев', 'Припев', 'Соло', 'Финал'];
  const progressions = [[0, 8, 3, 10], [0, 3, 10, 8], [0, 10, 8, 10]];
  const progression = progressions[variation % progressions.length];
  const scale = [0, 2, 3, 5, 7, 8, 10, 12];
  const patterns: Pattern[] = structure.map((section, sectionIndex) => {
    const p: Pattern = { id: uid(), name: section, bars: 4, steps: Object.fromEntries(channels.map(ch => [ch.id, Array.from({ length: 64 }, () => ({ on: false, velocity: 90 }))])), notes: [] };
    const chorus = section.includes('Припев') || section === 'Соло';
    const intro = section === 'Вступление';
    const ending = section === 'Финал';
    const hit = (drum: string, step: number, velocity = 100) => { p.steps['rock-' + drum][step] = { on: true, velocity }; };
    const note = (channel: string, pitch: number, step: number, length: number, velocity: number) => { const n: Note = { id: uid(), channelId: 'part-' + channel, pitch, startStep: step, lengthSteps: Math.min(length, 64 - step), velocity }; p.notes.push(n); };
    for (let bar = 0; bar < 4; bar++) {
      const base = bar * 16;
      const degree = ending && bar === 3 ? 0 : progression[bar];
      const root = tonic + degree;
      const lastHit = ending && bar === 3;
      const kicks = lastHit ? [0] : style === 'ballad' ? [0, 8] : chorus ? [0, 6, 8, 10] : [0, 8, 10];
      kicks.forEach(step => hit('kick', base + step, step === 0 ? 113 : 96));
      if (!lastHit) {
        [4, 12].forEach(step => hit('snare', base + step, chorus ? 115 : 100));
        for (let i = 0; i < 16; i += 2) hit(chorus ? 'ride' : 'closedHat', base + i, i % 4 === 0 ? 91 : 73);
        if (bar === 3 && !intro) { [13, 14, 15].forEach((step, i) => hit('tom', base + step, 85 + i * 10)); hit('openHat', base + 14, 92); }
      }
      if (bar === 0 || lastHit) hit('crash', base, 105);
      const guitarSteps = lastHit ? [0] : style === 'ballad' ? [0, 8] : chorus ? [0, 2, 4, 6, 8, 10, 12, 14] : [0, 3, 6, 8, 11, 14];
      for (const step of guitarSteps) {
        const length = lastHit ? 16 : style === 'ballad' ? 7 : 1.7;
        [0, 7, 12].forEach((interval, i) => note('guitar', root + interval, base + step, length, 92 - i * 7 + (step % 4 === 0 ? 9 : 0)));
      }
      const bassSteps = lastHit ? [0] : chorus ? [0, 2, 4, 6, 8, 10, 12, 14] : [0, 4, 8, 12];
      for (const step of bassSteps) note('bass', root - 12 + (step === 14 ? 7 : 0), base + step, lastHit ? 16 : 1.8, step % 4 === 0 ? 105 : 90);
      if ((!intro || bar >= 2) && !lastHit) {
        const steps = chorus ? [0, 3, 6, 8, 10, 12, 14] : [0, 6, 8, 12];
        steps.forEach((step, i) => {
          const idx = (bar * 2 + i + variation + (chorus ? 2 : 0)) % scale.length;
          const pitch = i === 0 ? tonic + 24 + degree : tonic + 24 + scale[idx];
          note('lead', pitch, base + step, i === steps.length - 1 ? 2 : 1.8, 88 + (i % 3) * 6);
        });
      }
      if (lastHit) note('lead', tonic + 24, base, 15, 95);
    }
    if (sectionIndex === 0 && style === 'ballad') p.steps['rock-snare'].fill({ on: false, velocity: 90 });
    return p;
  });
  return { bpm: style === 'ballad' ? 82 : style === 'hard' ? 144 : 116, currentPatternId: patterns[0].id, channels, patterns, mixerTracks, song: { tracks: [{ id: 'rock-arrangement', clips: patterns.map((p, i) => ({ id: uid(), patternId: p.id, startBar: i * 4 })) }] } };
}
