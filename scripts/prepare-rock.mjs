import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
const manifest = JSON.parse(readFileSync(new URL('../public/rock-audio/sources.json', import.meta.url), 'utf8'));
export function prepareRock(directory) {
  function edit(file, before, after) {
    const path = join(directory, 'src', file);
    const source = readFileSync(path, 'utf8');
    if (!source.includes(before)) throw new Error('Pinned music source changed: ' + file);
    writeFileSync(path, source.replace(before, after));
  }
  const sampleFile = join(directory, 'src/audio/samples.ts');
  let s = readFileSync(sampleFile, 'utf8');
  s = s.replace("  piano: ['soft', 'mid', 'hard'],", "  piano: ['soft', 'mid', 'hard'],\n" + Object.keys(manifest.roots).map(k => `  '${k}': ${JSON.stringify(k === 'rock-guitar' || k === 'rock-bass' ? ['soft', 'hard'] : ['soft', 'mid', 'hard'])},`).join('\n'));
  s = s.replace('`${SAMPLE_BASE}${instrument}${layer ? `/${layer}` : \'\'}/${Math.round(midi)}.mp3`;', "`${instrument.startsWith('rock-') ? '/TO_startup/rock-audio/' : SAMPLE_BASE}${instrument}${layer ? `/${layer}` : ''}/${Math.round(midi)}.mp3`;\n\nconst ROCK_ROOTS: Record<string, number[]> = " + JSON.stringify(manifest.roots) + ";\nconst sampleRoot = (instrument: string, midi: number): number => {\n  const roots = ROCK_ROOTS[instrument];\n  return roots ? roots.reduce((best, root) => Math.abs(root - midi) < Math.abs(best - midi) ? root : best, roots[0]) : midi;\n};");
  s = s.replace('  private readonly inflight = new Set<string>();', '  private readonly inflight = new Set<string>();\n  private pendingLoads: Promise<void>[] = [];');
  s = s.replace('set.has(midi)', 'set.has(sampleRoot(this.instrument, midi))');
  s = s.replace('    const jobs: { midi: number; li: number }[] = [];', '    midis = midis.map(midi => sampleRoot(this.instrument, midi));\n    const jobs: { midi: number; li: number }[] = [];');
  s = s.replace('    if (jobs.length === 0) return;', '    if (jobs.length === 0) { await Promise.all(this.pendingLoads); return; }');
  s = s.replace('    await Promise.all(\n      Array.from({ length: Math.min(CONCURRENCY, jobs.length) }, worker),\n    );', '    const pending = Promise.all(Array.from({ length: Math.min(CONCURRENCY, jobs.length) }, worker)).then(() => {});\n    this.pendingLoads.push(pending);\n    await pending;\n    this.pendingLoads = this.pendingLoads.filter(p => p !== pending);\n    await Promise.all(this.pendingLoads);');
  s = s.replace('  private pickLayer(midi: number, velocity: number): number {', '  private pickLayer(midi: number, velocity: number): number {\n    midi = sampleRoot(this.instrument, midi);');
  const siteBase = '/' + (process.env.SITE_BASE_PATH || '/TO_startup/').replace(/^\/+|\/+$/g, '');
  s = s.replace("'/TO_startup/rock-audio/'", JSON.stringify(siteBase.replace(/\/$/, '') + '/rock-audio/'));
  writeFileSync(sampleFile, s);
  edit('audio/engine.ts', '    if (c.kind === \'drum\' && c.drumType) {\n      const drum =', `    if (c.kind === 'drum' && c.sampleInstrument?.startsWith('rock-')) {
      const sample = new SampleVoice(c.sampleInstrument);
      sample.output.connect(gain);
      return { gain, panner, drum: null, poly: null, sample, sig, paramSig: '' };
    }
    if (c.kind === 'drum' && c.drumType) {
      const drum =`);
  edit('audio/engine.ts', '    if (nodes.drum) {\n      nodes.drum.trigger', `    if (ch.kind === 'drum' && nodes.sample) {
      nodes.sample.trigger(60, 12, time, velocity / 127);
      return;
    }
    if (nodes.drum) {
      nodes.drum.trigger`);
  edit('audio/engine.ts', '    const transport = Tone.getTransport();\n    this.applyLoop(true);', '    await this.prepareAudio();\n    const transport = Tone.getTransport();\n    this.applyLoop(true);');
  edit('audio/engine.ts', '      void nodes.sample.prepare([midi]);', "      void nodes.sample.prepare([midi]);\n      if (nodes.sample.instrument.startsWith('rock-')) return;");
  edit('audio/engine.ts', '    this.releaseAllHeld(); //', "    for (const nodes of this.channels.values()) { nodes.sample?.stop(); nodes.poly?.releaseAll(); }\n    this.releaseAllHeld(); //");
  edit('audio/samples.ts', '  dispose(): void {', "  stop(): void { for (const sampler of this.samplers) sampler.releaseAll(); this.active.clear(); }\n\n  dispose(): void {");
  edit('audio/offlineRender.ts', 'const TAIL_SECONDS = 2.5;', 'const TAIL_SECONDS = 6;');
  edit('audio/engine.ts', '  private prepareSampledNotes(proj: Project): void {', `  async prepareAudio(): Promise<void> {
    this.init();
    const proj = useProjectStore.getState();
    await Promise.all(proj.channels.map(async ch => {
      const sample = this.channels.get(ch.id)?.sample;
      if (!sample) return;
      const midis = ch.kind === 'drum' ? [60] : proj.patterns.flatMap(p => p.notes.filter(n => n.channelId === ch.id).map(n => n.pitch));
      await sample.prepare(midis);
      if (ch.sampleInstrument?.startsWith('rock-') && midis.some(m => !sample.isLoaded(m))) throw new Error('Не удалось загрузить записи инструментов. Проверьте соединение.');
    }));
  }

  private prepareSampledNotes(proj: Project): void {`);
  edit('audio/engine.ts', '      if (midis.length) void nodes.sample.prepare(midis);', "      if (c.kind === 'drum') midis.push(60);\n      if (midis.length) void nodes.sample.prepare(midis);");
  edit('audio/engine.ts', '    this.triggerSynthNote(channelId, midi, velocity, Tone.now() + 0.02, 1);', `    const sample = this.channels.get(channelId)?.sample;
    if (sample?.instrument.startsWith('rock-')) {
      await sample.prepare([midi]);
      if (!sample.isLoaded(midi)) throw new Error('Запись ноты не загрузилась');
    }
    this.triggerSynthNote(channelId, midi, velocity, Tone.now() + 0.02, 1);`);
  edit('audio/offlineRender.ts', "        if (ch.kind === 'drum' && ch.drumType) {", `        if (ch.kind === 'drum' && ch.sampleInstrument?.startsWith('rock-')) {
          const sample = new SampleVoice(ch.sampleInstrument);
          sample.output.connect(routeTarget);
          pendingReady.push(sample.prepare([60]).then(() => { if (!sample.isLoaded(60)) throw new Error('Записи барабанов не загрузились'); }));
          voices.set(ch.id, { drum: null, poly: null, sample, semis: 0, stepSeconds: secPerStep });
        } else if (ch.kind === 'drum' && ch.drumType) {`);
  edit('audio/offlineRender.ts', 'if (midis.length) pendingReady.push(sample.prepare(midis));', "if (midis.length) pendingReady.push(sample.prepare(midis).then(() => { if (ch.sampleInstrument?.startsWith('rock-') && midis.some(m => !sample.isLoaded(m))) throw new Error('Записи инструмента не загрузились'); }));");
  edit('audio/offlineRender.ts', '          if (v.drum) {\n            v.drum.trigger', "          if (ch.kind === 'drum' && v.sample) {\n            v.sample.trigger(60, 12, time, vel01(sd.velocity));\n          } else if (v.drum) {\n            v.drum.trigger");
  edit('types/project.ts', 'bars: 1 | 2 | 4 | 8;', 'bars: number;');
  edit('audio/offlineRender.ts', 'const MAX_RENDER_SECONDS = 300;', 'const MAX_RENDER_SECONDS = 600;');
  edit('audio/offlineRender.ts', '  const duration = Math.min(MAX_RENDER_SECONDS, totalSteps * secPerStep + TAIL_SECONDS);', "  if (totalSteps * secPerStep + TAIL_SECONDS > MAX_RENDER_SECONDS) throw new Error('Трек длиннее 10 минут. Выберите меньший участок для экспорта.');\n  const duration = totalSteps * secPerStep + TAIL_SECONDS;");
  edit('audio/engine.ts', 'export class AudioEngine {', `export class AudioEngine {
  private playbackRange: { startBar: number; endBar: number } | null = null;
  private rangeStartStep = 0;
  setPlaybackRange(range: { startBar: number; endBar: number } | null): void {
    this.playbackRange = range;
    this.applyLoop(true);
  }`);
  edit('audio/engine.ts', "    transport.start('+0.05');", "    this.step = Math.max(this.rangeStartStep, this.step);\n    transport.ticks = this.step * transport.PPQ / 4;\n    transport.start('+0.05');");
  edit('audio/engine.ts', 'const clamped = Math.max(0, Math.min(region - 1, Math.floor(step)));', 'const clamped = Math.max(this.rangeStartStep, Math.min(region - 1, Math.floor(step)));');
  edit('audio/engine.ts', 'this.step = next >= total ? 0 : next;', 'this.step = next >= total ? this.rangeStartStep : next;');
  edit('audio/engine.ts', '    const regionSteps = regionBars * 16;', `    const range = ui.playMode === 'pattern' ? this.playbackRange : null;
    const startBar = range ? Math.max(0, Math.min(patBars - 1, range.startBar)) : 0;
    const endBar = range ? Math.max(startBar + 1, Math.min(patBars, range.endBar)) : regionBars;
    this.rangeStartStep = startBar * 16;
    const regionSteps = endBar * 16;`);
  edit('audio/engine.ts', 'const sig = `${ui.loopOn}|${ui.playMode}|${regionBars}|${proj.currentPatternId}`;', 'const sig = `${ui.loopOn}|${ui.playMode}|${startBar}|${endBar}|${proj.currentPatternId}`;');
  edit('audio/engine.ts', '      transport.loopStart = 0;\n      transport.loopEnd = `${regionBars}m`;', '      transport.loopStart = `${startBar}m`;\n      transport.loopEnd = `${endBar}m`;');

  edit('audio/engine.ts', '      if (n.startStep === patternStep) {', `      if (n.startStep === patternStep || (this.playbackRange && patternStep === this.rangeStartStep && n.startStep < patternStep && n.startStep + n.lengthSteps > patternStep)) {`);
  edit('audio/engine.ts', '        this.triggerSynthNote(n.channelId, n.pitch, n.velocity, time, n.lengthSteps);', `        const length = this.playbackRange ? Math.min(n.startStep + n.lengthSteps, this.loopCtx.steps) - patternStep : n.lengthSteps;
        this.triggerSynthNote(n.channelId, n.pitch, n.velocity, time, length);`);

}
