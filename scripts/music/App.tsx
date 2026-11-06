import { useEffect, useMemo, useRef, useState } from 'react';
import { engine } from './audio/engine';
import { getProjectSnapshot, useProjectStore } from './stores/projectStore';
import { useUiStore } from './stores/uiStore';
import { useHistoryStore } from './stores/historyStore';
import { renderProject, estimateRenderSeconds } from './audio/offlineRender';
import { downloadBlob, encodeWav } from './audio/wavEncoder';
import { exportProjectToFile, readProjectFile } from './utils/projectIO';
import type { Channel, Note, Pattern, Project } from './types/project';
import { blankProject, emptyPattern, slicePattern, resizePattern, GENRES, CHORDS, noteName, uid } from './sequencerProject';
import './rhythm.css';

type Saved = { id: string; name: string; project: Project };
const LIBRARY = 'startup:rock-project-library:v1';
function savedProjects(): Saved[] { try { const data = JSON.parse(localStorage.getItem(LIBRARY) || '[]'); return Array.isArray(data) ? data : []; } catch { return []; } }
function erase(p: Pattern, a: number, b: number): Pattern {
  return { ...p, steps: Object.fromEntries(Object.entries(p.steps).map(([id, steps]) => [id, steps.map((s, i) => i >= a && i < b ? { ...s, on: false } : s)])), notes: p.notes.flatMap(n => {
    const end = n.startStep + n.lengthSteps;
    if (end <= a || n.startStep >= b) return [n];
    return [...(n.startStep < a ? [{ ...n, lengthSteps: a - n.startStep }] : []), ...(end > b ? [{ ...n, id: uid(), startStep: b, lengthSteps: end - b }] : [])];
  }) };
}
export default function App() {
  const project = useProjectStore();
  const playing = useUiStore(s => s.isPlaying);
  const currentStep = useUiStore(s => s.currentStep);
  const loop = useUiStore(s => s.loopOn);
  const p = project.patterns.find(p => p.id === project.currentPatternId);
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const lock = useRef(false);
  const input = useRef<HTMLInputElement>(null);
  const [scope, setScope] = useState<'whole' | 'range'>('whole');
  const [from, setFrom] = useState(1), [to, setTo] = useState(8), [destination, setDestination] = useState(1);
  const [page, setPage] = useState(0), [viewBars, setViewBars] = useState(2);
  const [copied, setCopied] = useState<Pattern | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [selected, setSelected] = useState<{ channel: string; step: number } | null>(null);
  const [pitch, setPitch] = useState(40), [chord, setChord] = useState('power'), [duration, setDuration] = useState(2), [velocity, setVelocity] = useState(100);
  const [library, setLibrary] = useState<Saved[]>(savedProjects), [savedId, setSavedId] = useState('');
  const a = Math.max(1, Math.min(from, p?.bars || 1));
  const b = Math.max(a, Math.min(to, p?.bars || 1));
  const firstBar = Math.min(page, Math.max(0, (p?.bars || 1) - 1));
  const shownBars = Math.min(viewBars, (p?.bars || 1) - firstBar);
  const steps = Array.from({ length: shownBars * 16 }, (_, i) => firstBar * 16 + i);
  const cells = useMemo(() => {
    const starts = new Map<string, Note[]>(), held = new Set<string>();
    for (const n of p?.notes || []) {
      const key = n.channelId + ':' + n.startStep;
      starts.set(key, [...(starts.get(key) || []), n]);
      for (let step = Math.max(n.startStep + 1, firstBar * 16); step < Math.min(n.startStep + n.lengthSteps, (firstBar + shownBars) * 16); step++) held.add(n.channelId + ':' + step);
    }
    return { starts, held };
  }, [p?.notes, firstBar, shownBars]);
  useEffect(() => {
    document.documentElement.lang = 'ru'; document.title = 'Ритм-секвенсор | stARTup';
    try {
      if (!localStorage.getItem('startup:long-sequencer:v1')) {
        if (localStorage.getItem('web-music-studio:project')) {
          const next = [...savedProjects(), { id: uid(), name: 'До обновления секвенсора · ' + new Date().toLocaleString('ru'), project: getProjectSnapshot() }];
          localStorage.setItem(LIBRARY, JSON.stringify(next)); setLibrary(next);
        }
        useProjectStore.getState().importProject(blankProject());
        localStorage.setItem('startup:long-sequencer:v1', '1');
      }
    } catch { setMessage('Прежний проект сохранён открытым: резервное хранение недоступно.'); }
    engine.init();
    const stop = () => engine.stop(); window.addEventListener('pagehide', stop);
    return () => { stop(); engine.setPlaybackRange(null); window.removeEventListener('pagehide', stop); };
  }, []);
  useEffect(() => {
    engine.stop(); useUiStore.getState().setPlayMode('pattern'); useUiStore.getState().setLoopBars(1);
    engine.setPlaybackRange(scope === 'range' ? { startBar: a - 1, endBar: b } : null);
  }, [p?.id, p?.bars, scope, a, b]);
  function archive() {
    try { const next = [...savedProjects(), { id: uid(), name: (p?.name || 'Проект') + ' · ' + new Date().toLocaleString('ru'), project: getProjectSnapshot() }]; localStorage.setItem(LIBRARY, JSON.stringify(next)); setLibrary(next); return true; }
    catch { setMessage('Не удалось сохранить резервную копию. Скачайте JSON и освободите место в браузере.'); return false; }
  }
  function edit(label: string, change: (p: Project) => Partial<Project>) {
    engine.stop(); const before = getProjectSnapshot(); useProjectStore.setState(change(before)); useHistoryStore.getState().record(label, before, getProjectSnapshot());
  }
  function editPattern(label: string, change: (p: Pattern) => Pattern) {
    edit(label, state => ({ patterns: state.patterns.map(pat => pat.id === state.currentPatternId ? change(pat) : pat) }));
  }
  function newProject() {
    if (!archive()) return; engine.stop(); project.importProject(blankProject()); setPage(0); setFrom(1); setTo(8); setScope('whole'); setSelected(null); setCopied(null); setMessage('Новый трек: 8 тактов. Предыдущий проект сохранён в библиотеке.');
  }
  function resize(bars: number) {
    if (!p) return;
    if (bars < p.bars && (p.notes.some(n => n.startStep + n.lengthSteps > bars * 16) || Object.values(p.steps).some(arr => arr.slice(bars * 16).some(s => s.on))) && !window.confirm('Сократить трек? Шаги за новой границей будут удалены. Изменение можно отменить.')) return;
    editPattern('Изменить длину', p => resizePattern(p, bars)); setSelected(null);
  }
  async function play() {
    if (lock.current) return; if (playing) { engine.stop(); return; }
    lock.current = true; setBusy(true); setMessage('Загружаем записи инструментов…');
    try { if (!await engine.play()) throw new Error('Браузер не включил звук. Нажмите «Играть» ещё раз.'); setMessage(''); }
    catch (error) { setMessage(error instanceof Error ? error.message : 'Не удалось включить звук.'); }
    finally { lock.current = false; setBusy(false); }
  }
  async function exportAudio() {
    if (!p || lock.current) return;
    const target = scope === 'range' ? slicePattern(p, a - 1, b) : p;
    const snapshot = { ...getProjectSnapshot(), patterns: [target], currentPatternId: target.id };
    const renderTarget = { kind: 'pattern' as const, patternId: target.id, loops: 1 };
    if (estimateRenderSeconds(snapshot, renderTarget) > 600) { setMessage('Экспорт WAV доступен до 10 минут. Выберите меньший участок.'); return; }
    engine.stop(); lock.current = true; setBusy(true); setMessage('Подготавливаем WAV…');
    try { const buffer = await renderProject(snapshot, renderTarget, progress => setMessage(progress.phase === 'schedule' ? 'Подготавливаем шаги… ' + Math.round(progress.value * 100) + '%' : 'Создаём аудио…'));
      const blob = await encodeWav(buffer, value => setMessage('Записываем WAV… ' + Math.round(value * 100) + '%'));
      downloadBlob(blob, (p.name || 'stARTup') + (scope === 'range' ? `-${a}-${b}` : '') + '.wav'); setMessage('WAV готов, скачивание запущено.');
    } catch (error) { setMessage(error instanceof Error ? error.message : 'Не удалось создать WAV. Попробуйте экспортировать меньший участок.'); }
    finally { lock.current = false; setBusy(false); }
  }
  function writeCell(channel: Channel, step: number, force = false) {
    if (!p || step < 0 || step >= p.bars * 16) return;
    const on = channel.kind === 'drum' ? !!p.steps[channel.id]?.[step]?.on : p.notes.some(n => n.channelId === channel.id && n.startStep === step);
    setSelected({ channel: channel.id, step });
    if (editMode && !force) {
      const note = p.notes.find(n => n.channelId === channel.id && n.startStep === step);
      if (note) { setPitch(note.pitch); setDuration(note.lengthSteps); setVelocity(note.velocity); const intervals = p.notes.filter(n => n.channelId === channel.id && n.startStep === step).map(n => n.pitch - note.pitch).sort((x, y) => x - y); setChord(Object.keys(CHORDS).find(key => JSON.stringify(CHORDS[key]) === JSON.stringify(intervals)) || 'note'); }
      else setVelocity(p.steps[channel.id]?.[step]?.velocity || 100);
      return;
    }
    editPattern('Изменить шаг', pat => {
      if (channel.kind === 'drum') return { ...pat, steps: { ...pat.steps, [channel.id]: Array.from({ length: pat.bars * 16 }, (_, i) => i === step ? { on: force || !on, velocity } : pat.steps[channel.id]?.[i] || { on: false, velocity: 100 }) } };
      const notes = pat.notes.filter(n => !(n.channelId === channel.id && n.startStep === step));
      if (force || !on) for (const interval of CHORDS[chord]) notes.push({ id: uid(), channelId: channel.id, pitch: Math.min(127, pitch + interval), startStep: step, lengthSteps: Math.min(duration, pat.bars * 16 - step), velocity });
      return { ...pat, notes };
    });
  }
  function paste(source: Pattern, repeat: boolean) {
    const start = Math.max(0, Math.min((p?.bars || 1) - 1, destination - 1));
    editPattern(repeat ? 'Повторить участок' : 'Вставить участок', original => {
      let result = original;
      for (let dest = start; dest < original.bars; dest += source.bars) {
        const offset = dest * 16, end = Math.min(original.bars, dest + source.bars) * 16;
        result = erase(result, offset, end);
        for (const [id, arr] of Object.entries(result.steps)) result.steps[id] = arr.map((s, i) => i >= offset && i < end && source.steps[id]?.[i - offset] ? { ...source.steps[id][i - offset] } : s);
        result.notes.push(...source.notes.filter(n => n.startStep + offset < end).map(n => ({ ...n, id: uid(), startStep: n.startStep + offset, lengthSteps: Math.min(n.lengthSteps, end - offset - n.startStep) })));
        if (!repeat) break;
      }
      return result;
    });
    setMessage(repeat ? 'Участок повторён до конца трека.' : 'Участок вставлен. Можно отменить.');
  }
  function addGenre(index: number) {
    const genre = GENRES[index]; const pat = emptyPattern(project.channels, 8, genre.name);
    for (const ch of project.channels.filter(c => c.kind === 'drum')) for (let i = 0; i < 128; i++) if (ch.drumType && genre.hits[ch.drumType]?.includes(i % 16) && !['rock-crash', 'rock-ride'].includes(ch.id)) pat.steps[ch.id][i] = { on: true, velocity: i % 4 === 0 ? 105 : 83 };
    edit('Добавить ритм', state => ({ patterns: [...state.patterns, pat], currentPatternId: pat.id, bpm: genre.bpm })); setPage(0); setSelected(null); setCopied(null);
  }
  function flattenSong() {
    const clips = project.song.tracks.flatMap(t => t.clips);
    const bars = Math.max(0, ...clips.map(c => c.startBar + (project.patterns.find(p => p.id === c.patternId)?.bars || 1)));
    if (!bars || bars > 128) { setMessage('Для переноса прежней композиции нужно от 1 до 128 тактов. Исходный проект остаётся без изменений.'); return; }
    const next = emptyPattern(project.channels, bars, 'Прежняя композиция');
    const seen = new Set<string>();
    for (const clip of clips) { const source = project.patterns.find(p => p.id === clip.patternId); if (!source) continue;
      for (const [id, arr] of Object.entries(source.steps)) arr.forEach((step, i) => { const dest = clip.startBar * 16 + i; if (step.on && next.steps[id]?.[dest]) next.steps[id][dest] = { on: true, velocity: Math.max(next.steps[id][dest].on ? next.steps[id][dest].velocity : 0, step.velocity) }; });
      for (const n of source.notes) { const startStep = n.startStep + clip.startBar * 16; const key = [n.channelId, n.pitch, startStep, n.lengthSteps].join(':'); if (!seen.has(key)) { next.notes.push({ ...n, id: uid(), startStep }); seen.add(key); } }
    }
    edit('Перенести прежнюю композицию', state => ({ patterns: [...state.patterns, next], currentPatternId: next.id })); setPage(0); setSelected(null); setCopied(null); setMessage('Прежняя композиция перенесена в длинную сетку. Исходные части и аранжировка сохранены.');
  }
  async function openFile(file?: File) {
    if (!file) return;
    try { const data = await readProjectFile(file); if (!archive()) return; engine.stop(); if (!project.importProject(data)) throw new Error(); setPage(0); setSelected(null); setCopied(null); setMessage('Проект открыт.'); }
    catch { setMessage('Не удалось открыть проект. Выберите сохранённый JSON.'); }
  }
  const selectedChannel = project.channels.find(ch => ch.id === selected?.channel);
  return <main className="seq-app" aria-busy={busy}>
    <header className="seq-heading"><p>stARTup / твой ритм</p><h1>Собери своё <em>звучание.</em></h1><p>Барабаны, гитара и бас в одной сетке. От 8 до 128 тактов.</p></header>
    <p role="status" className="seq-message">{message}</p>
    <fieldset disabled={busy}>
      <section className="seq-toolbar" aria-label="Трек">
        <button className="seq-primary" onClick={() => void play()}>{playing ? 'Стоп' : 'Играть'}</button>
        <label>Трек<select value={project.currentPatternId} onChange={e => { engine.stop(); project.setCurrentPatternId(e.target.value); setPage(0); setSelected(null); setCopied(null); }}>{project.patterns.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select></label>
        {p && <label>Название<input value={p.name} maxLength={70} onChange={e => project.renamePattern(p.id, e.target.value)} /></label>}
        <label>Тактов<select value={p?.bars || 8} onChange={e => resize(Number(e.target.value))}>{[...new Set([...(p ? [p.bars] : []), 8, 16, 32, 64, 128])].sort((x, y) => x - y).map(n => <option key={n} value={n}>{n}</option>)}</select></label>
        <label>Темп<input type="number" min={60} max={200} value={project.bpm} onChange={e => { if (e.target.value) project.setBpm(Number(e.target.value)); }} /> BPM</label>
        <label><input type="checkbox" checked={loop} onChange={e => useUiStore.getState().setLoopOn(e.target.checked)} />По кругу</label>
        <button onClick={() => useHistoryStore.getState().undo()}>Отменить</button><button onClick={() => useHistoryStore.getState().redo()}>Повторить</button>
      </section>
      <details className="seq-details"><summary>Начать с готового барабанного ритма</summary><div className="seq-toolbar">{GENRES.map((g, i) => <button key={g.name} onClick={() => addGenre(i)}>{g.name}</button>)}</div><p>Добавляется отдельный трек из 8 тактов. Остальные треки сохраняются.</p></details>
      <section className="seq-range" aria-label="Участок трека">
        <label>С такта<input type="number" min={1} max={p?.bars || 1} value={a} onChange={e => setFrom(Math.max(1, Number(e.target.value)))} /></label>
        <label>По такт<input type="number" min={a} max={p?.bars || 1} value={b} onChange={e => setTo(Math.max(a, Number(e.target.value)))} /></label>
        <label>Слушать и скачать<select value={scope} onChange={e => setScope(e.target.value as 'whole' | 'range')}><option value="whole">Весь трек</option><option value="range">Выбранный участок</option></select></label>
        <button disabled={!p} onClick={() => { if (p) { setCopied(slicePattern(p, a - 1, b)); setMessage(`Скопированы такты ${a}–${b}.`); } }}>Копировать участок</button>
        <button disabled={!p} onClick={() => { editPattern('Очистить участок', p => erase(p, (a - 1) * 16, b * 16)); setMessage('Участок очищен. Можно отменить.'); }}>Очистить участок</button>
        <label>Вставить с такта<input type="number" min={1} max={p?.bars || 1} value={destination} onChange={e => setDestination(Math.max(1, Number(e.target.value)))} /></label>
        <button disabled={!copied} onClick={() => copied && paste(copied, false)}>Вставить{copied ? ` (${copied.bars} такт.)` : ''}</button><button disabled={!copied} onClick={() => copied && paste(copied, true)}>Повторить до конца</button>
      </section>
      <nav className="seq-timeline" aria-label="Обзор тактов">{Array.from({ length: Math.min(128, p?.bars || 0) }, (_, i) => <button key={i} aria-label={`Показать такт ${i + 1}`} aria-current={i >= firstBar && i < firstBar + shownBars ? 'true' : undefined} className={playing && Math.floor(currentStep / 16) === i ? 'playing' : ''} onClick={() => setPage(i)}>{i + 1}</button>)}</nav>
      <section className="seq-toolbar seq-pager"><button disabled={firstBar === 0} onClick={() => setPage(Math.max(0, firstBar - viewBars))}>← Раньше</button><span>Такты {firstBar + 1}–{firstBar + shownBars} из {p?.bars || 0}</span><button disabled={firstBar + shownBars >= (p?.bars || 1)} onClick={() => setPage(firstBar + viewBars)}>Позже →</button><label>В сетке<select value={viewBars} onChange={e => setViewBars(Number(e.target.value))}><option value={1}>1 такт</option><option value={2}>2 такта</option><option value={4}>4 такта</option></select></label>{playing && <button onClick={() => setPage(Math.floor(currentStep / 16))}>К звучащему такту</button>}</section>
      <section className="seq-note-tools" aria-label="Настройка шагов">
        <label><input type="checkbox" checked={editMode} onChange={e => setEditMode(e.target.checked)} />Настроить выбранный шаг</label>
        <label>Нота<select value={pitch} onChange={e => setPitch(Number(e.target.value))}>{Array.from({ length: 61 }, (_, i) => i + 24).map(m => <option key={m} value={m}>{noteName(m)}</option>)}</select></label>
        <label>Созвучие<select value={chord} onChange={e => setChord(e.target.value)}><option value="note">Одна нота</option><option value="power">Квинта / power chord</option><option value="major">Мажор</option><option value="minor">Минор</option></select></label>
        <label>Длина<select value={duration} onChange={e => setDuration(Number(e.target.value))}>{[...new Set([duration, 1, 2, 4, 8, 16, 32, 64])].sort((x, y) => x - y).map(n => <option key={n} value={n}>{n} шаг.</option>)}</select></label>
        <label>Сила {velocity}<input type="range" min={1} max={127} value={velocity} onChange={e => setVelocity(Number(e.target.value))} /></label>
        {editMode && selected && selectedChannel && <><span>{selectedChannel.name} · такт {Math.floor(selected.step / 16) + 1}, шаг {selected.step % 16 + 1}</span><button onClick={() => writeCell(selectedChannel, selected.step, true)}>Применить к шагу</button></>}
      </section>
      <p className="seq-hint">Нажми на клетку, чтобы включить или убрать удар, ноту или аккорд. Для гитары и баса выбери ноту и длину сверху. «Настроить выбранный шаг» позволяет изменить существующий шаг. Сетку можно прокручивать вправо.</p>
      {p && <div className="seq-grid-scroll" tabIndex={0} aria-label="Сетка секвенсора, горизонтальная прокрутка"><div className="seq-grid" style={{ gridTemplateColumns: `170px repeat(${steps.length}, 32px)` }}>
        <div className="seq-row-title seq-grid-corner">Инструмент</div>{steps.map(step => <div className={'seq-column' + (step % 16 === 0 ? ' bar-start' : '')} key={'label-' + step}><small>{step % 16 === 0 ? `Такт ${step / 16 + 1}` : ''}</small><span>{step % 16 + 1}</span></div>)}
        {project.channels.map(ch => { const track = project.mixerTracks.find(t => t.id === ch.mixerTrackId); return <div className="seq-instrument" key={ch.id}>
          <div className="seq-row-title"><button className="seq-name" onClick={() => { void engine.prepareAudio().then(() => ch.kind === 'drum' ? engine.previewChannel(ch.id, velocity) : engine.previewNote(ch.id, pitch, velocity)).catch(() => setMessage('Не удалось загрузить звук.')); }}>{ch.name}</button>{track && <div className="seq-row-settings"><input aria-label={`Громкость: ${ch.name}`} type="range" min={0} max={1} step={0.01} value={track.volume} onChange={e => project.setTrackVolume(track.id, Number(e.target.value))} /><button aria-label={`Без звука: ${ch.name}`} aria-pressed={track.mute} onClick={() => project.toggleTrackMute(track.id)}>M</button><button aria-label={`Соло: ${ch.name}`} aria-pressed={track.solo} onClick={() => project.toggleTrackSolo(track.id)}>S</button></div>}</div>
          {steps.map(step => { const notes = cells.starts.get(ch.id + ':' + step) || []; const held = ch.kind !== 'drum' && cells.held.has(ch.id + ':' + step); const on = ch.kind === 'drum' ? !!p.steps[ch.id]?.[step]?.on : notes.length > 0; return <button key={step} className={'seq-step' + (on ? ' on' : '') + (held ? ' held' : '') + (step % 16 === 0 ? ' bar-start' : '') + (step % 4 === 0 ? ' beat' : '') + (playing && currentStep === step ? ' playing' : '') + (selected?.channel === ch.id && selected.step === step ? ' selected' : '')} aria-pressed={on} aria-label={`${ch.name}: такт ${Math.floor(step / 16) + 1}, шаг ${step % 16 + 1}${notes.length ? ', ' + notes.map(n => noteName(n.pitch)).join(' ') : ''}`} title={notes.map(n => noteName(n.pitch)).join(' + ')} onClick={() => writeCell(ch, step)}>{notes.length ? <small>{noteName(notes[0].pitch)}{notes.length > 1 ? '+' : ''}</small> : ''}</button>; })}
        </div>; })}
      </div></div>}
      <details className="seq-details"><summary>Звучание инструментов</summary><div className="seq-sound-settings">{project.mixerTracks.filter(t => t.id === 'track-master' || t.effects.some(fx => fx.type === 'distortion')).map(track => <div key={track.id}><strong>{track.name}</strong><label>Громкость<input type="range" min={0} max={1} step={0.01} value={track.volume} onChange={e => project.setTrackVolume(track.id, Number(e.target.value))} /></label>{track.effects.filter(fx => fx.type === 'distortion').map(fx => <label key={fx.id}>Перегруз<input type="range" min={0} max={0.9} step={0.01} value={fx.params.distortion} onChange={e => project.setEffectParam(track.id, fx.id, 'distortion', Number(e.target.value))} /></label>)}</div>)}</div></details>
      <section className="seq-toolbar seq-files"><button className="seq-primary" disabled={!p} onClick={() => void exportAudio()}>Скачать WAV</button><button onClick={() => exportProjectToFile(getProjectSnapshot())}>Скачать проект JSON</button><button onClick={() => input.current?.click()}>Открыть JSON</button><button onClick={newProject}>Новый трек</button><button onClick={() => { if (archive()) setMessage('Проект сохранён в библиотеке этого браузера.'); }}>Сохранить в библиотеку</button><input ref={input} type="file" accept=".json,application/json" hidden onChange={e => { void openFile(e.target.files?.[0]); e.target.value = ''; }} /></section>
      <p className="seq-hint">WAV: весь трек или выбранный участок, стерео 44,1 кГц / 16 бит, до 10 минут. При 128 тактах и 60 BPM — около 8,5 минут музыки. JSON сохраняет все треки и настройки.</p>
      <details className="seq-details"><summary>Сохранённые и прежние проекты</summary>{project.song.tracks.some(t => t.clips.length) && <button onClick={flattenSong}>Перенести прежнюю композицию в сетку</button>}{library.length > 0 && <div className="seq-toolbar"><label>Библиотека<select value={savedId} onChange={e => setSavedId(e.target.value)}><option value="">Выбрать проект…</option>{library.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label><button disabled={!savedId} onClick={() => { const item = library.find(item => item.id === savedId); if (item && archive()) { engine.stop(); project.importProject(item.project); setPage(0); setSelected(null); setCopied(null); setMessage('Проект восстановлен.'); } }}>Открыть</button></div>}<p>Библиотека хранится в этом браузере. Перед созданием нового проекта или открытием файла текущий проект сохраняется в неё.</p></details>
    </fieldset>
    <p className="seq-hint">Записи настоящих барабанов, гитары и баса — Karoryfer Samples, CC0. <a href="/TO_startup/licenses/" target="_blank" rel="noreferrer">Источники и лицензии</a>.</p>
  </main>;
}
