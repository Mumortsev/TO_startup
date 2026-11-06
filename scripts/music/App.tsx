import { useEffect, useRef, useState } from 'react';
import { engine } from './audio/engine';
import { getProjectSnapshot, useProjectStore } from './stores/projectStore';
import { useUiStore } from './stores/uiStore';
import { useHistoryStore } from './stores/historyStore';
import { exportProjectToFile, readProjectFile } from './utils/projectIO';
import type { DrumType } from './types/project';
import './rhythm.css';

type Genre = { name: string; bpm: number; hits: Partial<Record<DrumType, number[]>> };
const genres: Genre[] = [
  { name: 'Рок', bpm: 120, hits: { kick: [0, 8, 10], snare: [4, 12], closedHat: [0, 2, 4, 6, 8, 10, 12, 14] } },
  { name: 'Поп', bpm: 110, hits: { kick: [0, 6, 8], snare: [4, 12], clap: [4, 12], closedHat: [0, 2, 4, 6, 8, 10, 12, 14] } },
  { name: 'Хип-хоп', bpm: 90, hits: { kick: [0, 7, 10], snare: [4, 12], closedHat: [0, 2, 4, 6, 8, 10, 11, 14] } },
  { name: 'Фанк', bpm: 105, hits: { kick: [0, 3, 6, 10], snare: [4, 12, 15], closedHat: [0, 2, 4, 5, 6, 8, 10, 12, 13, 14], openHat: [7] } },
  { name: 'Хаус', bpm: 124, hits: { kick: [0, 4, 8, 12], clap: [4, 12], closedHat: [0, 4, 8, 12], openHat: [2, 6, 10, 14] } },
  { name: 'Регги', bpm: 80, hits: { kick: [8], snare: [8], closedHat: [2, 6, 10, 14], tom: [15] } },
];
const names: Record<DrumType, string> = { kick: 'Бочка', snare: 'Малый барабан', clap: 'Хлопок', closedHat: 'Закрытый хэт', openHat: 'Открытый хэт', tom: 'Том' };

/** Presentation only: original engine, persistence key and complete project schema are retained. */
export default function App() {
  const project = useProjectStore();
  const playing = useUiStore(s => s.isPlaying);
  const currentStep = useUiStore(s => s.currentStep);
  const playMode = useUiStore(s => s.playMode);
  const [message, setMessage] = useState('');
  const input = useRef<HTMLInputElement>(null);
  const pattern = project.patterns.find(p => p.id === project.currentPatternId);
  const drums = project.channels.filter(c => c.kind === 'drum');
  useEffect(() => {
    document.documentElement.lang = 'ru';
    document.title = 'Ритм-секвенсор | stARTup';
    engine.init();
    const stop = () => engine.stop();
    window.addEventListener('pagehide', stop);
    return () => { stop(); window.removeEventListener('pagehide', stop); };
  }, []);
  async function play() {
    try { await engine.togglePlay(); setMessage(''); }
    catch { setMessage('Не удалось включить звук. Нажмите воспроизведение ещё раз.'); }
  }
  useEffect(() => {
    const key = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement;
      if (event.code !== 'Space' || event.repeat || /INPUT|SELECT|TEXTAREA|BUTTON/.test(target.tagName)) return;
      event.preventDefault();
      void play();
    };
    window.addEventListener('keydown', key);
    return () => window.removeEventListener('keydown', key);
  }, []);
  function addGenre(genre: Genre) {
    engine.stop();
    const before = getProjectSnapshot();
    const id = 'rhythm-' + crypto.randomUUID();
    useProjectStore.setState(state => ({
      bpm: genre.bpm,
      currentPatternId: id,
      patterns: [...state.patterns, {
        id, name: genre.name, bars: 1, notes: [],
        steps: Object.fromEntries(state.channels.map(channel => [channel.id,
          Array.from({ length: 16 }, (_, i) => ({
            on: channel.kind === 'drum' && !!channel.drumType && !!genre.hits[channel.drumType]?.includes(i),
            velocity: i % 4 === 0 ? 110 : 88,
          }))
        ])),
      }],
    }));
    useHistoryStore.getState().record('Добавить ритм: ' + genre.name, before, getProjectSnapshot());
    useUiStore.getState().setPlayMode('pattern');
    setMessage(genre.name + ': добавлен новый ритм. Прежние ритмы сохранены в списке.');
  }
  async function importFile(file?: File) {
    if (!file) return;
    try {
      const data = await readProjectFile(file);
      if (!window.confirm('Заменить текущий проект? Сначала сохраните его в файл, если хотите оставить копию.')) return;
      engine.stop();
      if (!project.importProject(data)) throw new Error();
      setMessage('Проект открыт. Все его дорожки и настройки сохранены.');
    } catch { setMessage('Не удалось открыть проект. Выберите файл проекта NeonDAW в формате JSON.'); }
  }
  return (
    <main className="rhythm-app">
      <header className="rhythm-heading"><p>stARTup / твой ритм</p><h1>Сначала ритм.<br /><em>Потом всё остальное.</em></h1><p>Выбери жанр или включай шаги, чтобы придумать своё звучание.</p></header>
      <section className="genre-list" aria-label="Жанры">{genres.map(g => <button key={g.name} onClick={() => addGenre(g)}>{g.name}</button>)}</section>
      <p className="rhythm-hint">Каждый жанр добавляет новый ритм. Сохранённые проекты остаются в этом браузере.</p>
      <section className="rhythm-controls" aria-label="Воспроизведение">
        <button className="rhythm-play" onClick={() => void play()} aria-pressed={playing}>{playing ? 'Стоп' : 'Играть'}</button>
        <label>Темп <input type="number" min="60" max="200" value={project.bpm} onChange={e => { if (e.target.value) project.setBpm(Number(e.target.value)); }} /> BPM</label>
        <label>Ритм <select value={project.currentPatternId} onChange={e => { engine.stop(); project.setCurrentPatternId(e.target.value); }}>{project.patterns.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select></label>
        <label>Слушать <select value={playMode} onChange={e => { engine.stop(); useUiStore.getState().setPlayMode(e.target.value === 'song' ? 'song' : 'pattern'); }}><option value="pattern">Текущий ритм</option><option value="song">Проект целиком</option></select></label>
      </section>
      {pattern ? <section className="rhythm-score" aria-label="Ритм-секвенсор">
        {Array.from({ length: pattern.bars }, (_, bar) => <div className="rhythm-bar" key={bar}>
          <p>Такт {bar + 1}</p>
          <div className="rhythm-row rhythm-numbers" aria-hidden="true"><span />{Array.from({ length: 16 }, (_, i) => <span key={i}>{i + 1}</span>)}</div>
          {drums.map(channel => <div className="rhythm-row" key={channel.id}>
            <button className="drum-name" onClick={() => void engine.previewChannel(channel.id, 100).catch(() => setMessage('Не удалось включить звук. Попробуйте ещё раз.'))}>{channel.drumType ? names[channel.drumType] : channel.name}</button>
            {Array.from({ length: 16 }, (_, i) => {
              const step = bar * 16 + i;
              const on = !!pattern.steps[channel.id]?.[step]?.on;
              return <button key={i} className={'rhythm-step' + (on ? ' is-on' : '') + (playing && currentStep % (pattern.bars * 16) === step ? ' is-current' : '')} aria-label={`${channel.drumType ? names[channel.drumType] : channel.name}, шаг ${step + 1}`} aria-pressed={on} onClick={() => project.toggleStep(channel.id, step)} />;
            })}
          </div>)}
        </div>)}
      </section> : <p role="status">В проекте нет ритмов. Выберите жанр, чтобы добавить первый.</p>}
      <section className="rhythm-files" aria-label="Проекты">
        <button onClick={() => exportProjectToFile(getProjectSnapshot())}>Сохранить проект</button>
        <button onClick={() => input.current?.click()}>Открыть проект</button>
        <button onClick={() => useHistoryStore.getState().undo()}>Отменить</button>
        <button onClick={() => useHistoryStore.getState().redo()}>Повторить</button>
        <input ref={input} type="file" accept=".json,application/json" hidden onChange={e => { void importFile(e.target.files?.[0]); e.target.value = ''; }} />
      </section>
      <p className="rhythm-hint">Нажимай на название барабана, чтобы услышать его. Активные шаги звучат по кругу. В старых проектах сохранены также мелодии, эффекты и аранжировка.</p>
      <p role="status" className="rhythm-message">{message}</p>
    </main>
  );
}
