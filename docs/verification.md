# Проверка релиза

Дата: 2026-11-06. До публикации выполнены проверки ниже; статус GitHub Actions и публичного сайта добавляется после развёртывания.

## Подтверждённые локальные результаты

| Проверка | Результат |
| --- | --- |
| TypeScript + Vite 7 production build | Успешно |
| Pinned NeonDAW TypeScript + production build | Успешно, upstream 81eef8ae073bd600adeed531670167b02a7dacb5 |
| Vitest | 8/8 |
| Playwright | 35 passed, 1 expected duplicate-matrix skip; Chromium desktop/Pixel 7, Firefox desktop, WebKit/iPhone 13 |
| Размеры страницы | 320, 390, 768, 1024, 1440, 1920, 2560 px; переполнение ≤1 px |
| Axe WCAG 2 A/AA + 2.1 AA | 0 нарушений на главной, обеих студиях и в галерее раскрасок, desktop/mobile Chromium |
| 69 SVG | 69/69: decode, растеризация, области, видимая заливка; финальный максимум 310 мс при одновременном межбраузерном QA |
| Ресурсы/JS | Ошибки загрузки ресурсов и pageerror в покрытых сценариях отсутствуют |
| npm audit | 0 уязвимостей в основном проекте, включая build/dev dependencies; upstream toolkit закреплён и не переписывался |
| Lighthouse mobile, локальный preview | Performance 100, Accessibility 100, Best Practices 100, SEO 100 |

Lighthouse: FCP/LCP 0,8 с, TBT 0 мс, CLS 0,001. Это лабораторная оценка текущей среды, не полевые CrUX-данные. JSON: [performance.json](performance.json).

## Что проверяется реальным браузером

Выбор мира одним нажатием, мобильное меню, навигация, галерея/стрелки/Escape/возврат фокуса, доступность, reduced motion, все изображения и отсутствие горизонтального скролла. Раскраска: заливка, перекраска, undo, clear+undo, IndexedDB после reload, поиск, категории, пустое состояние, keyboard, zoom, PNG с проверкой сигнатуры и размеров. NeonDAW: загрузка/retry, редактирование шага мышью и клавиатурой, сохранение после reload, Play/Stop, JSON, настоящий WAV с RIFF/WAVE и ненулевыми аудиоданными.

Для Firefox отсутствие AudioContext.resume в первой попытке воспроизведено на чистом Web Audio без приложения. Причина — отсутствие аудиобэкенда worker. После запуска настоящего PulseAudio null sink те же проверки прошли без моков, browser prefs и изменений движка. CI запускает тот же класс аудиовыхода.

## Визуальная проверка

Просмотрены desktop, tablet и mobile скриншоты. Во время QA найдены и исправлены переполнения 320/768 px, контраст подписи, потеря undo из-за отложенного React state и ориентация пяти SVG. [Главная desktop](screenshots/home-desktop.webp), [главная mobile](screenshots/home-mobile.webp), [Рыбка desktop](screenshots/art-desktop.webp), [Рыбка mobile](screenshots/art-mobile.webp), [stARTup desktop](screenshots/music-desktop.webp), [stARTup mobile](screenshots/music-mobile.webp), [все иллюстрации](screenshots/coloring-gallery.webp).

## Практические пределы

Аппаратные iPhone/Android, физические динамики и микрофон не доступны в этой среде. WebKit — проверка движка браузера с эмуляцией iPhone, не реального Safari на iOS. Автоматический axe не заменяет полный ручной аудит незрячим пользователем; Canvas имеет текстовые инструкции и keyboard области, но не описывает композицию иллюстрации. Оригинальный музыкальный интерфейс EN/中文; до первого жеста возможны штатные upstream AudioContext warnings. Стоковые фото явно иллюстративны. Прогресс локален; старый localStorage v2 не мигрируется в новую геометрию.
