import { useEffect, useMemo, useRef, useState } from 'react';
import { engine } from './audio/engine';
import { getProjectSnapshot, useProjectStore } from './stores/projectStore';
import { useUiStore } from './stores/uiStore';
import { renderProject } from './audio/offlineRender';
import { downloadBlob, encodeWav } from './audio/wavEncoder';
import type { Channel } from './types/project';
import { blankProject, exportPattern, GENRES, notesFor, uid } from './sequencerProject';
import './rhythm.css';

/** Preserve previous work privately; children always begin with a blank grid. */
function preservePrevious() {
  const project = getProjectSnapshot();
  const hasWork = project.patterns.some(p => p.notes.length || Object.values(p.steps).some(steps => steps.some(s => s.on))) || project.song.tracks.some(t => t.clips.length);
  if (!hasWork) return;
  const key = 'startup:rock-project-library:v1';
  const raw = localStorage.getItem(key);
  const library = raw ? JSON.parse(raw) : [];
  if (!Array.isArray(library)) throw new Error('Backup unavailable');
  if (JSON.stringify(library[library.length - 1]?.project) === JSON.stringify(project)) return;
  localStorage.setItem(key, JSON.stringify([...library, { id: uid(), name: 'До открытия детского секвенсора · ' + new Date().toLocaleString('ru'), project }]));
}
export default function App() {
  const project = useProjectStore();
  const playing = useUiStore(s => s.isPlaying);
  const currentStep = useUiStore(s => s.currentStep);
  const p = project.patterns.find(p => p.id === project.currentPatternId);
  const [genre, setGenre] = useState(0), [bars, setBars] = useState(4);
  const [ready, setReady] = useState(false), [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [columns, setColumns] = useState(16), [page, setPage] = useState(0);
  const initialized = useRef(false), lock = useRef(false);
  const active = useMemo(() => {
    const cells = new Set<string>();
    if (p) {
      for (const [id, steps] of Object.entries(p.steps)) steps.forEach((s, i) => { if (s.on) cells.add(id + ':' + i); });
      p.notes.forEach(n => cells.add(n.channelId + ':' + n.startStep));
    }
    return cells;
  }, [p?.steps, p?.notes]);
  const audible = p && (p.notes.some(n => n.startStep < bars * 16) || Object.values(p.steps).some(steps => steps.slice(0, bars * 16).some(s => s.on)));
  const lastPage = bars * 16 / columns - 1;
  const visiblePage = Math.min(page, lastPage);
  const start = visiblePage * columns;
  useEffect(() => {
    document.documentElement.lang = 'ru'; document.title = 'Мой ритм | stARTup';
    if (!initialized.current) {
      try { preservePrevious(); useProjectStore.getState().importProject(blankProject()); initialized.current = true; setReady(true); }
      catch { setMessage('Не удалось сохранить прежний проект. Освободите место в браузере и откройте страницу снова.'); }
    }
    engine.init(); useUiStore.getState().setPlayMode('pattern'); useUiStore.getState().setLoopBars(1); useUiStore.getState().setLoopOn(true);
    const stop = () => engine.stop(); window.addEventListener('pagehide', stop);
    return () => { stop(); engine.setPlaybackRange(null); window.removeEventListener('pagehide', stop); };
  }, []);
  useEffect(() => {
    const media = window.matchMedia('(max-width: 700px)');
    const resize = () => { setColumns(media.matches ? 8 : 16); setPage(0); };
    resize(); media.addEventListener('change', resize); return () => media.removeEventListener('change', resize);
  }, []);
  useEffect(() => { if (ready) { engine.stop(); engine.setPlaybackRange({ startBar: 0, endBar: bars }); setPage(0); } }, [bars, ready]);
  useEffect(() => { if (playing) setPage(Math.floor(currentStep / columns)); }, [playing, currentStep, columns]);
  function changeGenre(index: number) {
    if (!p) return;
    engine.stop();
    const next = blankProject(index), pattern = next.patterns[0];
    for (const ch of next.channels) {
      if (ch.kind === 'drum') pattern.steps[ch.id] = p.steps[ch.id].map(s => ({ ...s }));
      else for (let step = 0; step < 256; step++) if (active.has(ch.id + ':' + step)) pattern.notes.push(...notesFor(index, ch.id, step));
    }
    project.importProject(next); setGenre(index); setMessage('');
  }
  function toggle(ch: Channel, step: number) {
    const on = active.has(ch.id + ':' + step);
    if (ch.kind === 'drum') project.toggleStep(ch.id, step);
    else useProjectStore.setState(state => ({ patterns: state.patterns.map(pat => pat.id === state.currentPatternId ? { ...pat, notes: [...pat.notes.filter(n => !(n.channelId === ch.id && n.startStep === step)), ...(on ? [] : notesFor(genre, ch.id, step))] } : pat) }));
    setMessage('');
    if (!on && !playing) {
      const preview = ch.kind === 'drum' ? engine.prepareAudio().then(() => engine.previewChannel(ch.id, 100)) : engine.previewNote(ch.id, notesFor(genre, ch.id, step)[0].pitch, 95);
      void preview.catch(() => setMessage('Звук не загрузился. Попробуй ещё раз.'));
    }
  }
  async function play() {
    if (lock.current) return;
    if (playing) { engine.stop(); return; }
    lock.current = true; setBusy(true); setMessage('Готовим звуки…');
    try { if (!await engine.play()) throw new Error(); setMessage(''); }
    catch { setMessage('Не удалось включить звук. Нажми «Играть» ещё раз.'); }
    finally { lock.current = false; setBusy(false); }
  }
  function clear() {
    engine.stop(); const fresh = blankProject(genre); fresh.bpm = project.bpm; project.importProject(fresh); setPage(0); setMessage('Чистый лист! Придумай новый ритм.');
  }
  async function download() {
    if (!p || lock.current) return;
    engine.stop(); lock.current = true; setBusy(true); setMessage('Собираем твою музыку…');
    const target = exportPattern(p, bars);
    const snapshot = { ...getProjectSnapshot(), patterns: [target] };
    try {
      const buffer = await renderProject(snapshot, { kind: 'pattern', patternId: target.id, loops: 1 });
      const wav = await encodeWav(buffer); downloadBlob(wav, 'Мой-трек-' + GENRES[genre].name + '.wav'); setMessage('Готово! Скачивание музыки началось.');
    } catch { setMessage('Не удалось скачать музыку. Попробуй ещё раз.'); }
    finally { lock.current = false; setBusy(false); }
  }
  return <main className="kids-sequencer" aria-busy={busy}>
    <header><p className="kids-label">stARTup / музыка своими руками</p><h1>Придумай свой <em>ритм!</em></h1><p>Выбери жанр и нажимай на квадратики. Ещё раз — и звук исчезнет.</p></header>
    <fieldset disabled={!ready || busy}>
      <div className="kids-genres" role="group" aria-label="Жанр музыки">{GENRES.map((g, i) => <button key={g.name} className={genre === i ? 'chosen' : ''} aria-pressed={genre === i} onClick={() => changeGenre(i)}>{g.name}</button>)}</div>
      <div className="kids-controls">
        <button className="kids-play" onClick={() => void play()}>{playing ? '■ Стоп' : '▶ Играть'}</button>
        <div className="kids-tempo" role="group" aria-label="Скорость музыки"><button disabled={project.bpm <= 60} aria-label="Медленнее" onClick={() => project.setBpm(project.bpm - 10)}>−</button><span>Темп <strong>{ready ? project.bpm : 112}</strong></span><button disabled={project.bpm >= 180} aria-label="Быстрее" onClick={() => project.setBpm(Math.min(180, project.bpm + 10))}>+</button></div>
        <div className="kids-length" role="group" aria-label="Длина трека">{[4, 8, 16].map(n => <button key={n} className={bars === n ? 'chosen' : ''} aria-pressed={bars === n} onClick={() => setBars(n)}>{n} такт.</button>)}</div>
      </div>
      <div className="kids-pages"><button aria-label="Предыдущие шаги" disabled={visiblePage === 0} onClick={() => { engine.stop(); setPage(visiblePage - 1); }}>←</button><span>Такт {Math.floor(start / 16) + 1} из {bars}{columns === 8 ? ` · шаги ${start % 16 + 1}–${start % 16 + 8}` : ''}</span><button aria-label="Следующие шаги" disabled={visiblePage === lastPage} onClick={() => { engine.stop(); setPage(visiblePage + 1); }}>→</button></div>
      {ready && p && <div className="kids-grid" style={{ gridTemplateColumns: `88px repeat(${columns}, minmax(0, 1fr))` }} aria-label="Квадратики со звуками">
        <div className="kids-grid-label" aria-hidden="true">Звуки</div>{Array.from({ length: columns }, (_, i) => <span key={'count-' + i} className={'kids-count' + (playing && currentStep === start + i ? ' current' : '')} aria-hidden="true">{start % 16 + i + 1}</span>)}
        {project.channels.map(ch => <div className="kids-row" key={ch.id}><span className="kids-instrument"><span aria-hidden="true">{ch.kind === 'drum' ? '🥁' : ch.id === 'part-bass' ? '🎵' : '🎸'}</span>{ch.name}</span>{Array.from({ length: columns }, (_, i) => { const step = start + i, on = active.has(ch.id + ':' + step), now = playing && currentStep === step; return <button key={step} className={'kids-cell' + (on ? ' enabled' : '') + (now ? ' playhead' : '') + (on && now ? ' sounding' : '') + (step % 4 === 0 ? ' beat' : '')} aria-label={`${ch.name}, такт ${Math.floor(step / 16) + 1}, шаг ${step % 16 + 1}`} aria-pressed={on} onClick={() => toggle(ch, step)}><span aria-hidden="true">{on ? '●' : ''}</span></button>; })}</div>)}
      </div>}
      <p className="kids-hint">Зажжённые квадратики звучат. Когда музыка доходит до них, они вспыхивают!</p>
      <div className="kids-actions"><button onClick={clear} disabled={!active.size}>Очистить</button><button className="kids-download" onClick={() => void download()} disabled={!audible}>Скачать музыку</button></div>
    </fieldset>
    <p className="kids-message" role="status" aria-live="polite">{message}</p>
  </main>;
}
