/** Russian presentation dictionary for pinned NeonDAW. Audio/project data are unchanged. */
import { translateMusicLabel } from "./music-labels";
export const ru = {
  label: (text: string) => translateMusicLabel(text, "ru"),
  app: { title: "NeonDAW · Музыкальная студия stARTup" },
  common: {
    mute: "Выключить звук",
    unmute: "Включить звук",
    solo: "Соло",
    volume: "Громкость",
    pan: "Панорама",
    delete: "Удалить",
    copy: "Копировать",
    add: "+ Добавить",
    off: "Выкл.",
  },
  nav: {
    moduleNav: "Разделы студии",
    select: "Выбрать раздел",
    close: "Закрыть навигацию",
    open: "Разделы студии",
    home: "К обзору инструментов",
    enter: (label: string) => `Открыть: ${label}`,
    keyHint: (k: string) => `Клавиша ${k}`,
  },
  modules: {
    name: {
      channelRack: "Ритм-секвенсор",
      pianoRoll: "Редактор нот",
      mixer: "Микшер",
      synth: "Синтезатор",
      song: "Аранжировка",
      keyboard: "Клавиши",
      random: "Генератор музыки",
      files: "Файлы",
    } as Record<string, string>,
    desc: {
      channelRack: "Создание ритма и партий ударных",
      pianoRoll: "Редактор мелодий и гармоний",
      mixer: "Громкость, панорама и эффекты",
      synth: "Настройка звука и тембров",
      song: "Сборка композиции из фрагментов",
      keyboard: "Игра на клавишах и запись в цикл",
      random: "Создание композиции в выбранном стиле",
      files: "Проекты и экспорт аудио",
    } as Record<string, string>,
    statChannels: (n: number) => `Каналов: ${n}`,
    statNotes: (n: number) => `Нот: ${n}`,
    statTracks: (n: number) => `Дорожек: ${n}`,
    statSynths: (n: number) => `Синтезаторов: ${n}`,
    statClips: (n: number) => `Фрагментов: ${n}`,
    statVoices: (n: number) => `Тембров: ${n}`,
    statPatterns: (n: number) => `Паттернов: ${n}`,
  },
  topbar: {
    play: "Воспроизвести (Пробел)",
    stop: "Остановить (Пробел)",
    stopRestart: "Остановить и вернуться в начало",
    loopOff: "Цикл выключен — нажми, чтобы включить",
    loopSong: "Цикл: вся композиция",
    loopPattern: (reps: number, bars: number) =>
      `Цикл: паттерн ×${reps}, тактов: ${bars}`,
    metronome: "Метроном",
    metronomeTurnOn: "Включить метроном",
    metronomeTurnOff: "Выключить метроном",
    bpmTip: "Потяни или прокрути, чтобы изменить темп (Shift ×10)",
    pattern: "Паттерн",
    manage: "Управление паттернами",
    manageAria: (name: string) => `Управление паттернами (текущий: ${name})`,
    mode: "Режим",
    modePattern: "Паттерн",
    modeSong: "Композиция",
    undo: "Отменить (Ctrl+Z)",
    undoNone: "Нечего отменять",
    redo: "Повторить (Ctrl+Shift+Z)",
    redoNone: "Нечего повторять",
    master: "Общая громкость",
    level: "Уровень",
    exportProject: "Сохранить проект в JSON",
    importProject: "Открыть проект из JSON",
    invalid: "Некорректная структура файла",
    importFail: "Не удалось открыть проект",
    more: "Дополнительные настройки",
    overflowTitle: "Воспроизведение и громкость",
    loopRepeat: "Повторы цикла",
    loopRepeatHint:
      "Режим паттерна: повторить целый паттерн заданное число раз",
    playMode: "Режим воспроизведения",
    songWhole: "Вся композиция",
    patternLoop: "Цикл паттерна",
    undoRedo: "Отмена и повтор",
    masterLevel: "Общая громкость и уровень",
    language: "Язык",
    reset: "Сбросить композицию",
    resetConfirm:
      "Создать пустой проект? Все паттерны, ноты и настройки микшера будут удалены. Это действие нельзя отменить.",
  },
  statusbar: {
    loopWhole: "Цикл: вся композиция",
    loopBars: (bars: number) => `Цикл: тактов ${bars}`,
    loopBarsReps: (bars: number, reps: number) =>
      `Цикл: тактов ${bars} ×${reps}`,
    click: "Метроном",
  },
  channelRack: {
    pattern: "Паттерн",
    rename: "Нажми, чтобы переименовать",
    list: "Список паттернов: создать, копировать, очистить, удалить",
    length: "Длина",
    mode: "Режим",
    draw: "Ноты",
    vel: "Сила нажатия",
    hintDesktop:
      "Нажми на шаг, чтобы включить или выключить его. Alt + перетаскивание или правая кнопка — сила нажатия.",
    hintTouch:
      "Коснись шага, чтобы включить или выключить его. Для изменения громкости выбери «Сила нажатия».",
    hintVel:
      "Нажми на включённый шаг и потяни вверх или вниз, чтобы изменить силу нажатия.",
  },
  pianoRoll: {
    zoomOut: "Уменьшить масштаб",
    zoomIn: "Увеличить масштаб",
    bar: "Такт",
    velocity: "Сила нажатия",
    deleteN: (n: number) => `Удалить: ${n}`,
    hintDesktop:
      "Нажми, чтобы добавить ноту. Перетаскивай для перемещения, тяни край для длины. Правая кнопка или Delete — удалить. Ctrl + прокрутка — масштаб.",
    hintTouch:
      "Коснись для добавления ноты, перетаскивай для перемещения. Удержание — удалить. Потяни пустую область для прокрутки.",
  },
  mixer: {
    fxChain: (name: string, count: number) => `${name}: эффектов ${count}`,
    empty: "Эффекты пока не добавлены",
    emptyHint: "Нажми «+ Добавить» в ячейке эффектов дорожки.",
    bypass: "Отключить эффект",
    unbypass: "Включить эффект",
    bypassTip: "Отключить эффект для сравнения с исходным звуком",
    deleteFx: "Удалить эффект",
    selectFx: (name: string) => `Открыть эффекты: ${name}`,
    panReset: "Панорама: двойное нажатие для сброса",
    masterMute: "Выключить общий звук",
    doubleReset:
      "Двойное нажатие сбрасывает регулятор. Изменения применяются сразу.",
  },
  fx: {
    name: {
      reverb: "Реверберация",
      feedbackDelay: "Эхо с обратной связью",
      pingPongDelay: "Стереоэхо",
      eq3: "Эквалайзер",
      filter: "Фильтр",
      autoFilter: "Автофильтр",
      compressor: "Компрессор",
      chorus: "Хорус",
      phaser: "Фейзер",
      distortion: "Искажение",
      bitCrusher: "Биткрашер",
      tremolo: "Тремоло",
      limiter: "Лимитер",
      stereoWidener: "Расширение стерео",
    } as Record<string, string>,
  },
  synth: {
    library: "Библиотека тембров — нажми, чтобы послушать и выбрать",
    librarySheet: "Библиотека тембров",
    channel: "Канал",
    emptyChannels:
      "В проекте нет синтезаторов. Добавь канал в ритм-секвенсоре или создай композицию в генераторе.",
    keyboard: (name: string) => `Виртуальная клавиатура: ${name}`,
    adsr: "Огибающая звука ADSR",
  },
  song: {
    paint: "Добавление",
    hintDesktop:
      "Нажми на пустую ячейку, чтобы добавить фрагмент. Перетаскивай для перемещения; наведи курсор для копирования или удаления.",
    hintTouch:
      "Коснись пустой ячейки, чтобы добавить фрагмент. Перетаскивай для перемещения; выбери фрагмент для копирования или удаления.",
    track: (n: number | string) => `Дорожка ${n}`,
    barsUnit: (n: number) => `(тактов: ${n})`,
    clipTitle: (name: string, bar: number) => `${name}, такт ${bar}`,
    copyClip: "Копировать фрагмент",
    deleteClip: "Удалить фрагмент",
    ruler: "Позиция воспроизведения: нажми или потяни для перемотки",
  },
  liveKeys: {
    preset: "Тембр",
    emptyChannels:
      "Нет канала синтезатора. Добавь его в ритм-секвенсоре или создай композицию в генераторе.",
    recorded: (bar: number, beat: number, note: string, steps: number) =>
      `Записано в цикл ${bar}:${beat}: ${note}, шагов ${steps}`,
    octaveDown: "На октаву ниже",
    octaveUp: "На октаву выше",
    recordOn: "Включить запись в цикл",
    recordOff: "Выключить запись в цикл",
    recording: "Идёт запись",
    playOnly: "Только игра",
    songNoOverdub:
      "В режиме всей композиции ноты не записываются. Для записи переключись на цикл паттерна.",
    overdub:
      "Цикл играет — нажимай клавиши, чтобы записать ноты в текущий паттерн.",
    playOnlyMsg:
      "Запись выключена: можно играть и слушать, ноты не сохраняются.",
    pressSpace: "Нажми Пробел или",
    startLoop: "запусти цикл паттерна, затем играй на клавишах для записи.",
  },
  random: {
    key: "Тональность",
    progression: "Гармония",
    cadence: "Каденция",
    motif: "Мотив",
    texture: "Фактура",
    textureBeat: "Ритм и аккорды без солирующей мелодии",
    beatChords: "Только ритм и аккорды",
    beatChordsHint:
      "Убрать солирующую мелодию, оставить ударные, бас и гармонию",
    arrangement: "Инструменты",
    form: (bars: number) => `Форма: тактов ${bars}`,
    validationFail:
      "Не удалось проверить созданную композицию. Попробуй ещё раз.",
    record: (name: string) => `Генерация: ${name}`,
    genFail: "Не удалось создать композицию",
    rolling: "Подбираем звучание…",
    again: "Создать ещё",
    draw: "Создать композицию",
    patterns: "Паттерны",
    patternsHint: "Больше паттернов — длиннее и насыщеннее композиция",
    patternsTier: (n: number): string =>
      n <= 3
        ? "Дуэт"
        : n === 4
          ? "Лёгкая"
          : n === 5
            ? "Стандартная"
            : n === 6
              ? "Полная"
              : n === 7
                ? "Насыщенная"
                : "Максимальная",
    intro: (n: number) =>
      `Генератор выбирает один из ${n} стилей и создаёт проект с подходящей тональностью, гармонией, ритмом, развитием мотива и формой.`,
    resetNote:
      "Аранжировка заменена, включён режим композиции. Ctrl+Z отменяет генерацию.",
    warning:
      "Генерация заменит текущий проект: паттерны, ноты, звуки, микшер и аранжировку. Сначала сохрани JSON проекта в разделе «Файлы».",
    tabGacha: "Любой стиль",
    tabStyle: "Выбрать стиль",
    pickStyle: "Стиль",
    pickStyleHint:
      "Выбери стиль, чтобы создавать новые варианты тональности, темпа, гармонии, ритма, мотива и тембров.",
    drawInStyle: "Создать в этом стиле",
    shuffleStyle: "Выбрать случайный стиль",
    styleBpm: "Темп",
    styleForm: "Форма",
    resultPlaceholder:
      "Создай композицию — здесь появятся её стиль и музыкальные детали.",
    rhythm: "Ритм-игра",
    rhythmStart: "Начать игру",
    rhythmStartStage: "Играть на весь экран",
    rhythmNeedsDraw: "Сначала создай композицию для ритм-игры.",
    rhythmIdle: "Создай композицию — её ноты появятся здесь.",
    rhythmHint:
      "Ноты движутся по четырём дорожкам. Нажимай A S W D или кнопки под дорожками.",
    rhythmHintTouch:
      "Ноты движутся по четырём дорожкам. Нажимай четыре кнопки внизу.",
    stageExit: "Выйти",
    accuracy: "Точность",
    maxCombo: "Лучшая серия",
    again2: "Играть ещё",
    close: "Назад",
  },
  files: {
    schedule: "Подготовка нот",
    render: "Создание аудио",
    encode: "Кодирование WAV",
    progressAria: "Ход экспорта",
    imported: (name: string) => `Проект «${name}» открыт`,
    invalidProject: "Некорректная структура файла. Текущий проект не изменён.",
    importFail: "Не удалось открыть проект",
    jsonDownloading: "Началось скачивание JSON проекта",
    newConfirm:
      "Новый проект заменит текущий. Сначала сохрани резервную копию. Продолжить?",
    newDone: "Создан пустой проект",
    exportOk: (sec: string, mb: string, secs: string) =>
      `Экспортировано: ${sec} с, ${mb} МБ; время обработки ${secs} с`,
    renderFail: "Не удалось создать аудио",
    importTitle: "Открыть проект",
    importDesc: "JSON-файл заменит текущий проект",
    exportTitle: "Сохранить проект",
    exportDesc: "Резервная копия проекта в JSON",
    audioTitle: "Сохранить аудио",
    audioDesc: "Создание WAV в браузере",
    targetGroup: "Что экспортировать",
    targetPattern: "Текущий паттерн",
    targetSong: "Вся композиция",
    repeat: "Повторы",
    exporting: "Сохраняем…",
    exportWav: "Скачать аудио WAV",
    pickJson: "Выбрать проект .json",
    newProject: "Создать пустой проект",
    exportProjectBtn: "Скачать проект (.json)",
    estTime: (sec: string) =>
      `Длина ≈ ${sec} с, с эффектами и настройками микшера`,
    projSummary: (patterns: number, channels: number, bpm: number) =>
      `Паттернов: ${patterns}, каналов: ${channels}, темп: ${bpm} уд/мин`,
    jsonHint:
      "JSON можно открыть здесь на любом устройстве. Создание и изменение паттернов — в меню «Управление паттернами».",
  },
  patternManager: {
    title: "Управление паттернами",
    add: "Создать паттерн",
    rename: "Нажми, чтобы переименовать",
    current: "Текущий",
    setCurrent: "Сделать текущим",
    isCurrent: "Уже выбран",
    duplicate: "Копировать",
    clear: "Очистить",
    del: "Удалить",
    keepOne: "Нужно оставить хотя бы один паттерн",
    meta: (bars: number, steps: number, notes: number, refs: number) =>
      `Тактов: ${bars}, шагов: ${steps}, нот: ${notes}, фрагментов: ${refs}`,
    deleteSuffix: (n: number) => ` и связанные фрагменты композиции (${n})`,
    deleteConfirm: (name: string, suffix: string) =>
      `Удалить «${name}»${suffix}? Ctrl+Z отменит это действие.`,
    clearConfirm: (name: string) =>
      `Очистить все шаги и ноты паттерна «${name}»?`,
    undoNote:
      "Ctrl+Z отменяет изменения. При удалении паттерна удаляются и его фрагменты в аранжировке.",
    currentAria: "Редактируемый паттерн",
  },
  overlay: { close: (title: string) => `Закрыть: ${title}` },
  lang: { en: "EN", zh: "中文", ru: "РУС", aria: "Выбрать язык" },
};
