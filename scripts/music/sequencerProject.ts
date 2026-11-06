import type { Channel, FxInstance, MixerTrack, Pattern, Project, SynthParams } from './types/project';
export const uid = () => crypto.randomUUID();
export const GENRES = [
  { name: 'Рок', bpm: 112, drive: 0.35, duration: 1.8, chords: [[40, 7], [48, 7], [43, 7], [50, 7]] },
  { name: 'Поп', bpm: 108, drive: 0.04, duration: 3.5, chords: [[48, 4], [43, 4], [45, 3], [41, 4]] },
  { name: 'Хип-хоп', bpm: 86, drive: 0.08, duration: 3.5, chords: [[45, 3], [50, 3], [41, 4], [40, 3]] },
  { name: 'Фанк', bpm: 110, drive: 0.1, duration: 0.8, chords: [[40, 3], [40, 3], [45, 3], [40, 3]] },
  { name: 'Хаус', bpm: 124, drive: 0.03, duration: 1.5, chords: [[45, 3], [41, 4], [48, 4], [43, 4]] },
  { name: 'Регги', bpm: 82, drive: 0.02, duration: 0.8, chords: [[43, 4], [48, 4], [50, 4], [43, 4]] },
];
const fx = (type: FxInstance['type'], params: Record<string, number>): FxInstance => ({ id: uid(), type, params, bypass: false });
export function notesFor(genre: number, channelId: string, step: number) {
  const style = GENRES[genre];
  const [root, third] = style.chords[Math.floor(step / 16) % style.chords.length];
  const pitches = channelId === 'part-bass' ? [root - 12] : style.name === 'Рок' ? [root, root + 7, root + 12] : [root, root + third, root + 7];
  return pitches.map(pitch => ({ id: uid(), channelId, pitch, startStep: step, lengthSteps: Math.min(channelId === 'part-bass' ? 1.8 : style.duration, 256 - step), velocity: channelId === 'part-bass' ? 103 : 93 }));
}
/** Keep sixteen bars in memory; the child's length selector controls the played/exported range. */
export function blankProject(genre = 0): Project {
  const kit = [['kick', 'Бочка'], ['snare', 'Барабан'], ['closedHat', 'Тарелка'], ['tom', 'Том']] as const;
  const channels: Channel[] = kit.map(([id, name]) => ({ id: 'rock-' + id, name, drumType: id, kind: 'drum', color: '#d89557', sampleInstrument: 'rock-' + id, mixerTrackId: 'mix-' + id }));
  const synth: SynthParams = { osc1Waveform: 'triangle', osc1Octave: 0, osc1Level: 1, osc2Waveform: 'sine', osc2Octave: 0, osc2Detune: 0, osc2Level: 0, filterType: 'lowpass', filterCutoff: 8000, filterQ: 0.5, filterEnvAmount: 0, attack: 0.002, decay: 0.2, sustain: 0.6, release: 0.12, volume: 0.8 };
  for (const [id, name] of [['guitar', 'Гитара'], ['bass', 'Бас']]) channels.push({ id: 'part-' + id, name, kind: 'synth', color: '#719f94', sampleInstrument: 'rock-' + id, synthParams: { ...synth }, mixerTrackId: 'mix-' + id });
  const mixerTracks: MixerTrack[] = channels.map<MixerTrack>(ch => ({ id: ch.mixerTrackId, name: ch.name, volume: ch.kind === 'drum' ? 0.7 : 0.6, pan: 0, mute: false, solo: false, effects: ch.id === 'part-guitar' ? [fx('distortion', { distortion: GENRES[genre].drive, wet: 1 }), fx('filter', { type: 0, frequency: genre === 0 ? 4800 : 6800, q: 0.5 })] : [] }));
  mixerTracks.push({ id: 'track-master', name: 'Общая громкость', volume: 0.8, pan: 0, mute: false, solo: false, effects: [] });
  const pattern: Pattern = { id: uid(), name: 'Мой трек', bars: 16, notes: [], steps: Object.fromEntries(channels.map(ch => [ch.id, Array.from({ length: 256 }, () => ({ on: false, velocity: 100 }))])) };
  return { bpm: GENRES[genre].bpm, channels, mixerTracks, patterns: [pattern], currentPatternId: pattern.id, song: { tracks: [] } };
}
export function exportPattern(p: Pattern, bars: number): Pattern {
  return { ...p, bars, steps: Object.fromEntries(Object.entries(p.steps).map(([id, steps]) => [id, steps.slice(0, bars * 16)])), notes: p.notes.filter(n => n.startStep < bars * 16).map(n => ({ ...n, lengthSteps: Math.min(n.lengthSteps, bars * 16 - n.startStep) })) };
}
