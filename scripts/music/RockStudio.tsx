import { useEffect, useRef, useState } from 'react';
import { engine } from './audio/engine';
import { getProjectSnapshot, useProjectStore } from './stores/projectStore';
import { useUiStore } from './stores/uiStore';
import { useHistoryStore } from './stores/historyStore';
import { renderProject, estimateRenderSeconds, type RenderTarget } from './audio/offlineRender';
import { downloadBlob, encodeWav } from './audio/wavEncoder';
import { exportProjectToFile, readProjectFile } from './utils/projectIO';
import type { Pattern, Project } from './types/project';
import { makeRockProject, NOTE_NAMES, noteLabel, uid, type RockStyle } from './rockProject';

type SavedProject = { id: string; name: string; project: Project };
const LIBRARY_KEY = 'startup:rock-project-library:v1';
function readLibrary(): SavedProject[] {
  try { const value = JSON.parse(localStorage.getItem(LIBRARY_KEY) || '[]'); return Array.isArray(value) ? value : []; } catch { return []; }
}
export default function RockStudio({ onBusyChange }: { onBusyChange: (value: boolean) => void }) {
  const project = useProjectStore();
  const playing = useUiStore(s => s.isPlaying);
  const playMode = useUiStore(s => s.playMode);
  const loopOn = useUiStore(s => s.loopOn);
  const currentStep = useUiStore(s => s.currentStep);
  const [style, setStyle] = useState<RockStyle>('classic');
  const [tonic, setTonic] = useState(40);
  const [length, setLength] = useState<16 | 32 | 48>(32);
  const [variation, setVariation] = useState(0);
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const lock = useRef(false);
  const [progress, setProgress] = useState('');
  const [library, setLibrary] = useState<SavedProject[]>(readLibrary);
  const [savedId, setSavedId] = useState('');
  const fileInput = useRef<HTMLInputElement>(null);
  const [bar, setBar] = useState(0);
  const [channelId, setChannelId] = useState('part-lead');
  const [octave, setOctave] = useState(60);
  const [noteLength, setNoteLength] = useState(2);
  const pattern = project.patterns.find(p => p.id === project.currentPatternId);
  const melodic = project.channels.filter(c => c.kind === 'synth');
  const selectedChannel = melodic.find(c => c.id === channelId) || melodic[0];
  const selectedBar = Math.min(bar, (pattern?.bars || 1) - 1);
  const clips = project.song.tracks.flatMap(t => t.clips);
  const endBars = Math.max(0, ...clips.map(c => c.startBar + (project.patterns.find(p => p.id === c.patternId)?.bars || 1)));
  useEffect(() => {
    document.documentElement.lang = 'ru'; document.title = 'Рок-студия | stARTup'; engine.init();
    const stop = () => engine.stop();
    window.addEventListener('pagehide', stop);
    return () => { stop(); window.removeEventListener('pagehide', stop); };
  }, []);
  useEffect(() => { onBusyChange(busy); }, [busy, onBusyChange]);
  function archiveCurrent(label = 'Проект') {
    try {
      const next = [...readLibrary(), { id: uid(), name: label + ' · ' + new Date().toLocaleString('ru'), project: getProjectSnapshot() }];
      localStorage.setItem(LIBRARY_KEY, JSON.stringify(next)); setLibrary(next); return true;
    } catch { setMessage('Не удалось сохранить резервную копию. Скачайте текущий проект JSON и освободите место в браузере.'); return false; }
  }
  function create() {
    if (!archiveCurrent('Перед созданием основы')) return;
    engine.stop();
    project.importProject(makeRockProject(style, tonic, length, variation));
    setVariation(v => v + 1); setBar(0);
    useUiStore.getState().setPlayMode('song'); useUiStore.getState().setLoopOn(false);
    setMessage('Рок-основа готова. Предыдущий проект сохранён в библиотеке ниже. Выберите часть песни, чтобы изменить её ноты.');
  }
  async function play() {
    if (lock.current) return;
    if (playing) { engine.stop(); return; }
    lock.current = true; setBusy(true); setProgress('Загружаем записи инструментов…');
    try { const ok = await engine.play(); if (!ok) throw new Error('Браузер не включил звук. Нажмите «Играть» ещё раз.'); setMessage(''); }
    catch (error) { setMessage(error instanceof Error ? error.message : 'Не удалось включить звук.'); }
    finally { lock.current = false; setBusy(false); setProgress(''); }
  }
  async function exportAudio() {
    if (lock.current) return;
    const snapshot = getProjectSnapshot();
    const target: RenderTarget = clips.length ? { kind: 'song' } : { kind: 'pattern', patternId: snapshot.currentPatternId, loops: 4 };
    const seconds = estimateRenderSeconds(snapshot, target);
    if (seconds > 300) { setMessage('Для одного WAV доступно до 5 минут. Уменьшите число частей композиции или увеличьте темп.'); return; }
    engine.stop(); lock.current = true; setBusy(true); setProgress('Подготавливаем WAV…');
    try {
      const buffer = await renderProject(snapshot, target, event => setProgress(event.phase === 'schedule' ? 'Подготавливаем дорожки… ' + Math.round(event.value * 100) + '%' : 'Создаём аудиофайл…'));
      const wav = await encodeWav(buffer, value => setProgress('Сохраняем WAV… ' + Math.round(value * 100) + '%'));
      downloadBlob(wav, 'stARTup-rock-' + new Date().toISOString().slice(0, 10) + '.wav');
      setMessage('WAV готов, скачивание запущено. Сохраните также проект JSON, чтобы продолжить редактирование.');
    } catch (error) { setMessage(error instanceof Error ? error.message : 'Не удалось создать WAV. Попробуйте сократить композицию.'); }
    finally { lock.current = false; setBusy(false); setProgress(''); }
  }
  function editProject(label: string, change: (p: Project) => Partial<Project>) {
    engine.stop(); const before = getProjectSnapshot();
    useProjectStore.setState(change(before)); useHistoryStore.getState().record(label, before, getProjectSnapshot());
  }
  function transpose(delta: number) {
    editProject('Изменить тональность', p => ({ patterns: p.patterns.map(pat => ({ ...pat, notes: pat.notes.map(n => ({ ...n, pitch: Math.min(127, Math.max(0, n.pitch + delta)) })) })) }));
  }
  function arrangement(index: number, action: 'up' | 'down' | 'copy' | 'remove') {
    editProject('Изменить структуру', p => {
      const track = p.song.tracks[0]; if (!track || p.song.tracks.length !== 1) return {};
      const next = [...track.clips]; let patterns = [...p.patterns];
      if (action === 'remove') { if (next.length <= 1) return {}; next.splice(index, 1); }
      else if (action === 'copy') {
        const original = patterns.find(pat => pat.id === next[index].patternId); if (!original) return {};
        const copy: Pattern = { ...original, id: uid(), name: original.name + ' · копия', steps: structuredClone(original.steps), notes: original.notes.map(n => ({ ...n, id: uid() })) };
        patterns.push(copy); next.splice(index + 1, 0, { id: uid(), patternId: copy.id, startBar: 0 });
      } else {
        const target = index + (action === 'up' ? -1 : 1); if (target < 0 || target >= next.length) return {};
        [next[index], next[target]] = [next[target], next[index]];
      }
      let startBar = 0;
      const arranged = next.map(clip => { const result = { ...clip, startBar }; startBar += patterns.find(pat => pat.id === clip.patternId)?.bars || 1; return result; });
      return { patterns, song: { tracks: [{ ...track, clips: arranged }] } };
    });
  }
  async function openFile(file?: File) {
    if (!file) return;
    try { const data = await readProjectFile(file); if (!archiveCurrent('Перед открытием файла')) return; engine.stop(); if (!project.importProject(data)) throw new Error(); setBar(0); setMessage('Проект открыт.'); }
    catch { setMessage('Не удалось открыть файл проекта. Выберите сохранённый JSON NeonDAW или stARTup.'); }
  }
  function editNote(pitch: number, step: number) {
    if (!pattern || !selectedChannel) return;
    const startStep = selectedBar * 16 + step;
    const existing = pattern.notes.find(n => n.channelId === selectedChannel.id && n.pitch === pitch && n.startStep === startStep);
    if (existing) project.removeNote(existing.id);
    else { project.addNote({ channelId: selectedChannel.id, pitch, startStep, lengthSteps: Math.min(noteLength, pattern.bars * 16 - startStep), velocity: 100 }); void engine.previewNote(selectedChannel.id, pitch, 100).catch(() => setMessage('Не удалось прослушать ноту.')); }
  }
  function selectPattern(id: string) { engine.stop(); project.setCurrentPatternId(id); setBar(0); }
  return <main className="rhythm-app rock-studio" aria-busy={busy}>
    <header className="rhythm-heading"><p>stARTup / твоя группа</p><h1>Твой рок.<br /><em>От идеи до инструментала.</em></h1><p>Создай основу, измени мелодию и партии, скачай свою композицию.</p></header>
    <p className="rock-status" role="status" aria-live="polite">{busy ? progress : message}</p>
    <fieldset disabled={busy} className="rock-fieldset">
      <section className="rock-panel">
        <h2>1. Готовая основа</h2>
        <div className="rhythm-controls">
          <label>Характер<select value={style} onChange={e => setStyle(e.target.value as RockStyle)}><option value="classic">Классический рок</option><option value="hard">Тяжёлый рок</option><option value="ballad">Рок-баллада</option></select></label>
          <label>Тональность<select value={tonic} onChange={e => setTonic(Number(e.target.value))}>{Array.from({ length: 12 }, (_, i) => <option key={i} value={36 + i}>{NOTE_NAMES[i]} минор</option>)}</select></label>
          <label>Длина<select value={length} onChange={e => setLength(Number(e.target.value) as 16 | 32 | 48)}><option value={16}>16 тактов</option><option value={32}>32 такта</option><option value={48}>48 тактов</option></select></label>
          <button className="rhythm-play" onClick={create}>Создать рок-основу</button>
        </div>
        <p className="rhythm-hint">Каждое нажатие создаёт другой вариант. Текущий проект сначала сохраняется в библиотеке.</p>
      </section>
      <section className="rock-panel">
        <h2>2. Послушай и собери песню</h2>
        <div className="rhythm-controls">
          <button className="rhythm-play" onClick={() => void play()}>{playing ? 'Стоп' : 'Играть'}</button>
          <label>Темп<input type="number" min={60} max={200} value={project.bpm} onChange={e => { if (e.target.value) project.setBpm(Number(e.target.value)); }} /> BPM</label>
          <label>Слушать<select value={playMode} onChange={e => { engine.stop(); useUiStore.getState().setPlayMode(e.target.value === 'song' ? 'song' : 'pattern'); }}><option value="song">Всю композицию</option><option value="pattern">Выбранную часть</option></select></label>
          <label><input type="checkbox" checked={loopOn} onChange={e => useUiStore.getState().setLoopOn(e.target.checked)} />По кругу</label>
          <button onClick={() => transpose(-1)}>Тональность −1</button><button onClick={() => transpose(1)}>Тональность +1</button>
        </div>
        <p className="rhythm-hint">{endBars} тактов · около {Math.round(endBars * 4 * 60 / project.bpm)} секунд. Для прослушивания целиком нужна структура ниже.</p>
        <div className="rock-arrangement">{clips.map((clip, index) => {
          const p = project.patterns.find(p => p.id === clip.patternId);
          return <article key={clip.id} className={pattern?.id === clip.patternId ? 'active' : ''}>
            <button aria-pressed={pattern?.id === clip.patternId} onClick={() => selectPattern(clip.patternId)}>{p?.name || 'Часть'}<small>С такта {clip.startBar + 1} · {p?.bars || 1} такта</small></button>
            {project.song.tracks.length === 1 && <div><button aria-label="Раньше" disabled={index === 0} onClick={() => arrangement(index, 'up')}>←</button><button aria-label="Позже" disabled={index === clips.length - 1} onClick={() => arrangement(index, 'down')}>→</button><button onClick={() => arrangement(index, 'copy')}>Копия</button><button aria-label="Удалить часть" disabled={clips.length <= 1} onClick={() => arrangement(index, 'remove')}>×</button></div>}
          </article>;
        })}</div>
        {!clips.length && <p className="rhythm-hint">Создай рок-основу, чтобы получить структуру песни. Существующий ритм можно слушать в режиме «Выбранную часть».</p>}
      </section>
      <section className="rock-panel">
        <h2>3. Измени партии</h2>
        <div className="rhythm-controls">
          <label>Часть<select value={project.currentPatternId} onChange={e => selectPattern(e.target.value)}>{project.patterns.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select></label>
          {pattern && <label>Название<input value={pattern.name} maxLength={70} onChange={e => project.renamePattern(pattern.id, e.target.value)} /></label>}
          <label>Такт<select value={selectedBar} onChange={e => setBar(Number(e.target.value))}>{Array.from({ length: pattern?.bars || 1 }, (_, i) => <option key={i} value={i}>{i + 1}</option>)}</select></label>
          <button onClick={() => useHistoryStore.getState().undo()}>Отменить</button><button onClick={() => useHistoryStore.getState().redo()}>Повторить</button>
        </div>
        <h3>Барабаны</h3>
        <div className="rock-drum-scroll">{pattern && project.channels.filter(c => c.kind === 'drum').map(ch => <div className="rhythm-row" key={ch.id}>
          <button className="drum-name" onClick={() => { void engine.prepareAudio().then(() => engine.previewChannel(ch.id, 100)).catch(() => setMessage('Не удалось загрузить звук.')); }}>{ch.name}</button>
          {Array.from({ length: 16 }, (_, i) => { const step = selectedBar * 16 + i; const on = !!pattern.steps[ch.id]?.[step]?.on; return <button key={i} className={'rhythm-step' + (on ? ' is-on' : '') + (playing && playMode === 'pattern' && currentStep % (pattern.bars * 16) === step ? ' is-current' : '')} aria-label={`${ch.name}: шаг ${i + 1}`} aria-pressed={on} onClick={() => project.toggleStep(ch.id, step)} />; })}
        </div>)}</div>
        <h3>Гитары и бас</h3>
        <div className="rhythm-controls">
          <label>Инструмент<select value={selectedChannel?.id || ''} onChange={e => { setChannelId(e.target.value); setOctave(e.target.value === 'part-bass' ? 24 : e.target.value === 'part-guitar' ? 36 : 60); }}>{melodic.map(ch => <option key={ch.id} value={ch.id}>{ch.name}</option>)}</select></label>
          <label>Диапазон<select value={octave} onChange={e => setOctave(Number(e.target.value))}>{[24, 36, 48, 60, 72].map(n => <option key={n} value={n}>{noteLabel(n)} — {noteLabel(n + 23)}</option>)}</select></label>
          <label>Длина ноты<select value={noteLength} onChange={e => setNoteLength(Number(e.target.value))}><option value={1}>1 шаг</option><option value={2}>2 шага</option><option value={4}>4 шага</option><option value={8}>8 шагов</option><option value={16}>Такт</option></select></label>
        </div>
        <p className="rhythm-hint">Нажми на пустую клетку, чтобы добавить ноту; на начало ноты — удалить. Полоска показывает её длину. Для изменения длины удали ноту и поставь заново.</p>
        {pattern && selectedChannel && <div className="rock-piano-scroll" tabIndex={0} aria-label="Редактор нот: прокрутка по горизонтали">
          <div className="rock-piano">
            <div className="rock-piano-row rock-piano-numbers"><span />{Array.from({ length: 16 }, (_, i) => <span key={i}>{i + 1}</span>)}</div>
            {Array.from({ length: 24 }, (_, row) => octave + 23 - row).map(pitch => <div className="rock-piano-row" key={pitch}>
              <span>{noteLabel(pitch)}</span>
              {Array.from({ length: 16 }, (_, i) => {
                const step = selectedBar * 16 + i;
                const note = pattern.notes.find(n => n.channelId === selectedChannel.id && n.pitch === pitch && n.startStep <= step && n.startStep + n.lengthSteps > step);
                const start = note?.startStep === step;
                return <button key={i} aria-label={`${noteLabel(pitch)}, шаг ${i + 1}${start ? ', удалить ноту' : ', добавить ноту'}`} aria-pressed={!!start} className={(note ? 'note-held' : '') + (start ? ' note-start' : '') + ([1, 3, 6, 8, 10].includes(pitch % 12) ? ' black-key' : '')} onClick={() => editNote(pitch, i)} />;
              })}
            </div>)}
          </div>
        </div>}
      </section>
      <section className="rock-panel"><h2>4. Звучание и баланс</h2><div className="rock-mixer">{project.mixerTracks.map(track => <article key={track.id}>
        <h3>{track.name}</h3>
        <label>Громкость {Math.round(track.volume * 100)}%<input type="range" min={0} max={1} step={0.01} value={track.volume} onChange={e => project.setTrackVolume(track.id, Number(e.target.value))} /></label>
        {track.id !== 'track-master' && <><button aria-pressed={track.mute} onClick={() => project.toggleTrackMute(track.id)}>Без звука</button><button aria-pressed={track.solo} onClick={() => project.toggleTrackSolo(track.id)}>Соло</button><label>Панорама<input type="range" min={-1} max={1} step={0.05} value={track.pan} onChange={e => project.setTrackPan(track.id, Number(e.target.value))} /></label></>}
        {track.effects.filter(fx => fx.type === 'distortion' || fx.type === 'reverb').map(fx => <label key={fx.id}>{fx.type === 'distortion' ? 'Перегруз' : 'Пространство'}<input type="range" min={0} max={fx.type === 'reverb' ? 0.6 : 0.9} step={0.01} value={fx.params[fx.type === 'distortion' ? 'distortion' : 'wet']} onChange={e => project.setEffectParam(track.id, fx.id, fx.type === 'distortion' ? 'distortion' : 'wet', Number(e.target.value))} /></label>)}
      </article>)}</div></section>
      <section className="rock-panel"><h2>5. Сохрани себе</h2><div className="rhythm-files">
        <button className="rock-download" onClick={() => void exportAudio()}>Скачать инструментал WAV</button>
        <button onClick={() => exportProjectToFile(getProjectSnapshot())}>Скачать проект JSON</button>
        <button onClick={() => fileInput.current?.click()}>Открыть JSON</button>
        <button onClick={() => { if (archiveCurrent()) setMessage('Проект сохранён в библиотеке этого браузера.'); }}>Сохранить в библиотеку</button>
        <input type="file" ref={fileInput} accept=".json,application/json" hidden onChange={e => { void openFile(e.target.files?.[0]); e.target.value = ''; }} />
      </div><p className="rhythm-hint">WAV — готовая музыка: стерео, 44,1 кГц, 16 бит, до 5 минут. JSON — проект для дальнейшего редактирования. Библиотека хранится только в этом браузере.</p>
      {library.length > 0 && <div className="rhythm-controls"><label>Библиотека<select value={savedId} onChange={e => setSavedId(e.target.value)}><option value="">Выбрать проект…</option>{library.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label><button disabled={!savedId} onClick={() => { const item = library.find(p => p.id === savedId); if (item && archiveCurrent('Перед восстановлением')) { engine.stop(); project.importProject(item.project); setBar(0); setMessage('Проект восстановлен из библиотеки.'); } }}>Открыть выбранный</button></div>}
      </section>
    </fieldset>
    <p className="rhythm-hint">Записи настоящих инструментов: Big Rusty Drums, Emilyguitar, Black And Blue Basses — Karoryfer Samples, CC0. <a href="/TO_startup/licenses/" target="_blank" rel="noreferrer">Источники и лицензии</a>. Для личного использования не нужны подписки или установка программ.</p>
  </main>;
}
