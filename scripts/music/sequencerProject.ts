import type { Channel, DrumType, FxInstance, MixerTrack, Pattern, Project, SynthParams } from './types/project';
export const uid = () => crypto.randomUUID();
const fx = (type: FxInstance['type'], params: Record<string, number>): FxInstance => ({ id: uid(), type, params, bypass: false });
export const NOTES = ['До', 'До♯', 'Ре', 'Ре♯', 'Ми', 'Фа', 'Фа♯', 'Соль', 'Соль♯', 'Ля', 'Ля♯', 'Си'];
export const noteName = (m: number) => NOTES[m % 12] + (Math.floor(m / 12) - 1);
export const CHORDS: Record<string, number[]> = { note: [0], power: [0, 7, 12], major: [0, 4, 7], minor: [0, 3, 7] };
export const GENRES: { name: string; bpm: number; hits: Partial<Record<DrumType, number[]>> }[] = [
  { name: 'Рок', bpm: 120, hits: { kick: [0, 8, 10], snare: [4, 12], closedHat: [0, 2, 4, 6, 8, 10, 12, 14] } },
  { name: 'Поп', bpm: 110, hits: { kick: [0, 6, 8], snare: [4, 12], closedHat: [0, 2, 4, 6, 8, 10, 12, 14] } },
  { name: 'Хип-хоп', bpm: 90, hits: { kick: [0, 7, 10], snare: [4, 12], closedHat: [0, 2, 4, 6, 8, 10, 11, 14] } },
  { name: 'Фанк', bpm: 105, hits: { kick: [0, 3, 6, 10], snare: [4, 12, 15], closedHat: [0, 2, 4, 5, 6, 8, 10, 12, 13, 14], openHat: [7] } },
  { name: 'Хаус', bpm: 124, hits: { kick: [0, 4, 8, 12], snare: [4, 12], closedHat: [0, 4, 8, 12], openHat: [2, 6, 10, 14] } },
  { name: 'Регги', bpm: 80, hits: { kick: [8], snare: [8], closedHat: [2, 6, 10, 14], tom: [15] } },
];
export function emptyPattern(channels: Channel[], bars = 8, name = 'Мой трек'): Pattern {
  return { id: uid(), name, bars, notes: [], steps: Object.fromEntries(channels.map(ch => [ch.id, Array.from({ length: bars * 16 }, () => ({ on: false, velocity: 100 }))])) };
}
export function blankProject(): Project {
  const kit: [string, string, DrumType][] = [['kick', 'Бочка', 'kick'], ['snare', 'Малый барабан', 'snare'], ['closedHat', 'Закрытый хэт', 'closedHat'], ['openHat', 'Открытый хэт', 'openHat'], ['tom', 'Том', 'tom'], ['crash', 'Крэш', 'clap'], ['ride', 'Райд', 'openHat']];
  const channels: Channel[] = kit.map(([id, name, drumType]) => ({ id: 'rock-' + id, name, drumType, kind: 'drum', color: '#d89557', sampleInstrument: 'rock-' + id, mixerTrackId: 'mix-' + id }));
  const synth: SynthParams = { osc1Waveform: 'triangle', osc1Octave: 0, osc1Level: 1, osc2Waveform: 'sine', osc2Octave: 0, osc2Detune: 0, osc2Level: 0, filterType: 'lowpass', filterCutoff: 8000, filterQ: 0.5, filterEnvAmount: 0, attack: 0.002, decay: 0.2, sustain: 0.6, release: 0.12, volume: 0.8 };
  for (const [id, name] of [['guitar', 'Гитара'], ['bass', 'Бас-гитара']]) channels.push({ id: 'part-' + id, name, kind: 'synth', color: '#719f94', sampleInstrument: 'rock-' + id, synthParams: { ...synth }, mixerTrackId: 'mix-' + id });
  const mixerTracks: MixerTrack[] = channels.map<MixerTrack>(ch => ({ id: ch.mixerTrackId, name: ch.name, volume: ch.kind === 'drum' ? 0.7 : 0.6, pan: 0, mute: false, solo: false, effects: ch.id === 'part-guitar' ? [fx('distortion', { distortion: 0.25, wet: 1 }), fx('filter', { type: 0, frequency: 4800, q: 0.5 })] : [] }));
  mixerTracks.push({ id: 'track-master', name: 'Общая громкость', volume: 0.8, pan: 0, mute: false, solo: false, effects: [] });
  const p = emptyPattern(channels);
  return { bpm: 120, channels, mixerTracks, patterns: [p], currentPatternId: p.id, song: { tracks: [] } };
}
/** Clip boundary notes as well as steps, so export and range operations agree. */
export function slicePattern(p: Pattern, fromBar: number, toBar: number): Pattern {
  const a = fromBar * 16, b = toBar * 16;
  return { ...p, bars: toBar - fromBar, steps: Object.fromEntries(Object.entries(p.steps).map(([id, steps]) => [id, steps.slice(a, b).map(s => ({ ...s }))])), notes: p.notes.filter(n => n.startStep < b && n.startStep + n.lengthSteps > a).map(n => ({ ...n, id: uid(), startStep: Math.max(0, n.startStep - a), lengthSteps: Math.min(b, n.startStep + n.lengthSteps) - Math.max(a, n.startStep) })) };
}
export function resizePattern(p: Pattern, bars: number): Pattern {
  return { ...p, bars, steps: Object.fromEntries(Object.entries(p.steps).map(([id, steps]) => [id, Array.from({ length: bars * 16 }, (_, i) => steps[i] ? { ...steps[i] } : { on: false, velocity: 100 })])), notes: p.notes.filter(n => n.startStep < bars * 16).map(n => ({ ...n, lengthSteps: Math.min(n.lengthSteps, bars * 16 - n.startStep) })) };
}
