import { useEffect, useLayoutEffect, useRef, useState } from "react";
import {
  coloringPages,
  COLORING_REVISION,
  type ColoringPage,
} from "./coloringPages";
import {
  makeRegions,
  findRegion,
  paintRegions,
  transparentInk,
  type RegionMap,
} from "./coloringEngine";
import {
  listProgress,
  readProgress,
  writeProgress,
  importLegacyArtwork,
  readLegacyArtwork,
  restoreColors,
} from "./coloringStorage";
import {
  loadLegacyImage,
  migrateLegacyColors,
  ROTATED_LEGACY_PAGES,
} from "./legacyColoring";
import "./MagicColoring.css";
const BASE = import.meta.env.BASE_URL + "coloring/";
const COLORS = [
  "#ffb86b",
  "#ff806f",
  "#ed6d9d",
  "#a38de5",
  "#68c5ee",
  "#61c4ae",
  "#a5d86a",
  "#f9e16c",
  "#ffffff",
  "#5a79b4",
  "#a77754",
  "#343f59",
];
const COLOR_NAMES = [
  "Абрикосовый",
  "Коралловый",
  "Розовый",
  "Сиреневый",
  "Голубой",
  "Бирюзовый",
  "Зелёный",
  "Жёлтый",
  "Белый",
  "Синий",
  "Коричневый",
  "Графитовый",
];
const SIZE = 850;
const source = (id: string) => BASE + id + ".svg";
export default function Draw({ onBack }: { onBack: () => void }) {
  const [category, setCategory] = useState(() => window.history.state?.coloringGallery?.category || "all"),
    [query, setQuery] = useState(() => window.history.state?.coloringGallery?.query || ""),
    [page, setPage] = useState<ColoringPage | null>(() => coloringPages.find(p => p.id === window.history.state?.drawing) || null),
    [color, setColor] = useState(COLORS[0]);
  const [legacyIds, setLegacyIds] = useState<string[]>([]);
  const importedLegacy = useRef<Promise<string[]> | null>(null);
  const [saved, setSaved] = useState<string[]>([]),
    [history, setHistory] = useState<string[][]>([]),
    [loading, setLoading] = useState(false),
    [error, setError] = useState(""),
    [status, setStatus] = useState(""),
    [dialog, setDialog] = useState<"help" | "reset" | null>(null),
    [zoom, setZoom] = useState(1),
    [keyboardRegion, setKeyboardRegion] = useState(-1);
  const paint = useRef<HTMLCanvasElement>(null),
    outline = useRef<HTMLCanvasElement>(null),
    geometry = useRef<RegionMap | null>(null),
    colors = useRef<string[]>([]),
    modal = useRef<HTMLDivElement>(null),
    returnFocus = useRef<HTMLElement | null>(null),
    saveSequence = useRef(0),
    pageRef = useRef(page),
    pointerStart = useRef<{ x: number; y: number } | null>(null);
  pageRef.current = page;
  const scroller = useRef<HTMLElement>(null);
  const galleryScroll = useRef(window.history.state?.coloringGallery?.scroll || 0);
  useEffect(() => {
    const update = () => {
      setDialog(null);
      setPage(coloringPages.find(p => p.id === window.history.state?.drawing) || null);
    };
    window.addEventListener("popstate", update);
    return () => window.removeEventListener("popstate", update);
  }, []);
  useEffect(() => {
    if (page) return;
    window.history.replaceState({ ...window.history.state,
      coloringGallery: { query, category, scroll: galleryScroll.current }
    }, "");
  }, [query, category, page]);
  useLayoutEffect(() => {
    scroller.current?.scrollTo({ top: page ? 0 : galleryScroll.current, behavior: "instant" });
  }, [page]);
  function openPage(next: ColoringPage) {
    galleryScroll.current = scroller.current?.scrollTop || 0;
    window.history.replaceState({ ...window.history.state,
      coloringGallery: { query, category, scroll: galleryScroll.current }
    }, "");
    window.history.pushState({ ...window.history.state, drawing: next.id }, "", "#drawing=" + next.id);
    setPage(next);
  }

  const list = coloringPages.filter(
    (p) =>
      (category === "all" || p.category === category) &&
      p.name
        .toLocaleLowerCase("ru")
        .includes(query.trim().toLocaleLowerCase("ru")),
  );
  useEffect(() => {
    listProgress()
      .then((keys) =>
        setSaved((s) => Array.from(new Set([...s, ...keys.map(String)]))),
      )
      .catch(() =>
        setStatus(
          "Автосохранение недоступно. Скачайте рисунок перед закрытием.",
        ),
      );
  }, []);
  useEffect(() => {
    const pending = importLegacyArtwork(() =>
      setStatus(
        "Не все прежние рисунки удалось перенести. Исходные данные сохранены в браузере; попробуйте освободить место и перезагрузить страницу.",
      ),
    );
    importedLegacy.current = pending;
    pending
      .then(setLegacyIds)
      .catch(() =>
        setStatus(
          "Прежние рисунки остались в браузере, но пока не удалось открыть их. Попробуйте перезагрузить страницу.",
        ),
      );
  }, []);
  useEffect(() => {
    if (!dialog) return;
    returnFocus.current = document.activeElement as HTMLElement;
    modal.current?.querySelector<HTMLButtonElement>("button")?.focus();
    return () => returnFocus.current?.focus();
  }, [dialog]);
  function render() {
    const ctx = paint.current?.getContext("2d");
    if (!ctx || !geometry.current) return;
    const pixels = ctx.createImageData(SIZE, SIZE);
    paintRegions(pixels.data, geometry.current, colors.current);
    ctx.putImageData(pixels, 0, 0);
  }
  useEffect(() => {
    geometry.current = null;
    colors.current = [];
    setHistory([]);
    setZoom(1);
    setKeyboardRegion(-1);
    setError("");
    setStatus("");
    if (!page) return;
    let cancelled = false;
    setLoading(true);
    const image = new Image();
    image.onload = async () => {
      if (cancelled) return;
      const oc = outline.current;
      if (!oc) return;
      const ctx = oc.getContext("2d", { willReadFrequently: true });
      if (!ctx) return;
      ctx.clearRect(0, 0, SIZE, SIZE);
      const scale = Math.min(
          (SIZE - 36) / image.naturalWidth,
          (SIZE - 36) / image.naturalHeight,
        ),
        w = image.naturalWidth * scale,
        h = image.naturalHeight * scale;
      ctx.drawImage(image, (SIZE - w) / 2, (SIZE - h) / 2, w, h);
      const raster = ctx.getImageData(0, 0, SIZE, SIZE);
      const map = makeRegions(raster.data, SIZE, SIZE);
      transparentInk(raster.data);
      ctx.putImageData(raster, 0, 0);
      let progress;
      try {
        progress = await readProgress(page.id);
      } catch {
        if (!cancelled) {
          setLoading(false);
          setError(
            "Не удалось открыть сохранённый рисунок. Вернитесь в галерею и попробуйте ещё раз. Прежняя работа остаётся в браузере.",
          );
        }
        return;
      }
      if (cancelled) return;
      geometry.current = map;
      const restored = restoreColors(
        progress,
        COLORING_REVISION,
        map.sizes.length,
      );
      const current = restored !== null;
      colors.current = restored || Array(map.sizes.length).fill("#ffffff");
      if (!current) {
        try {
          await (importedLegacy.current || importLegacyArtwork());
          const legacy = await readLegacyArtwork(page.id);
          if (legacy) {
            const previous = await loadLegacyImage(legacy.image);
            if (cancelled) return;
            const canvas = document.createElement("canvas");
            canvas.width = canvas.height = SIZE;
            const context = canvas.getContext("2d", {
              willReadFrequently: true,
            });
            if (!context) throw new Error("Canvas unavailable");
            context.drawImage(previous, 0, 0);
            const recovered = migrateLegacyColors(
              context.getImageData(0, 0, SIZE, SIZE).data,
              map,
              ROTATED_LEGACY_PAGES.has(page.id),
            );
            if (cancelled) return;
            colors.current = recovered;
            try {
              await writeProgress({
                id: page.id,
                colors: recovered,
                revision: COLORING_REVISION,
                updated: Date.now(),
              });
              if (cancelled) return;
              setSaved((ids) => Array.from(new Set([...ids, page.id])));
              setStatus(
                "Прежний рисунок восстановлен. Исходная версия доступна в архиве.",
              );
            } catch {
              if (!cancelled)
                setStatus(
                  "Рисунок восстановлен, но не удалось сохранить перенос. Скачайте PNG перед закрытием.",
                );
            }
          }
        } catch {
          if (!cancelled)
            setStatus(
              "Не удалось перенести прежний рисунок. Исходная версия сохранена в архиве.",
            );
        }
      }
      if (cancelled) return;
      render();
      setLoading(false);
    };
    image.onerror = () => {
      if (!cancelled) {
        setLoading(false);
        setError(
          "Не удалось загрузить рисунок. Вернитесь в галерею и попробуйте снова.",
        );
      }
    };
    image.src = source(page.id);
    return () => {
      cancelled = true;
      geometry.current = null;
      colors.current = [];
    };
  }, [page]);
  function remember() {
    if (!page) return;
    const id = page.id,
      sequence = ++saveSequence.current;
    setStatus("Сохраняем…");
    writeProgress({
      id,
      colors: [...colors.current],
      revision: COLORING_REVISION,
      updated: Date.now(),
    })
      .then(() => {
        setSaved((s) => (s.includes(id) ? s : [...s, id]));
        if (pageRef.current?.id === id && sequence === saveSequence.current)
          setStatus("Сохранено на этом устройстве");
      })
      .catch(() => {
        if (pageRef.current?.id === id)
          setStatus("Не удалось сохранить. Скачайте рисунок перед закрытием.");
      });
  }
  function fillRegion(id: number) {
    if (
      loading ||
      error ||
      id < 0 ||
      !geometry.current ||
      colors.current[id] === color
    )
      return;
    const previous = [...colors.current];
    setHistory((s) => [...s.slice(-29), previous]);
    colors.current[id] = color;
    render();
    remember();
  }
  function fill(e: React.PointerEvent<HTMLCanvasElement>) {
    if (!geometry.current || e.button !== 0) return;
    const rect = e.currentTarget.getBoundingClientRect();
    fillRegion(
      findRegion(
        geometry.current,
        ((e.clientX - rect.left) * SIZE) / rect.width,
        ((e.clientY - rect.top) * SIZE) / rect.height,
        4,
      ),
    );
  }
  function undo() {
    const last = history[history.length - 1];
    if (!last) return;
    colors.current = [...last];
    setHistory((s) => s.slice(0, -1));
    render();
    remember();
  }
  function reset() {
    const previous = [...colors.current];
    setHistory((s) => [...s.slice(-29), previous]);
    colors.current.fill("#ffffff");
    render();
    remember();
    setDialog(null);
  }
  function keyboard(e: React.KeyboardEvent<HTMLCanvasElement>) {
    if (!geometry.current) return;
    const map = geometry.current,
      available = map.sizes
        .map((size, id) => ({ size, id }))
        .filter((x) => x.size >= 20)
        .map((x) => x.id);
    if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
      e.preventDefault();
      const current = available.indexOf(keyboardRegion),
        step = e.key === "ArrowRight" ? 1 : -1;
      const id =
        available[(current + step + available.length) % available.length];
      setKeyboardRegion(id);
      setStatus(
        "Область " +
          (available.indexOf(id) + 1) +
          " из " +
          available.length +
          ". Enter — закрасить.",
      );
    }
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      fillRegion(keyboardRegion >= 0 ? keyboardRegion : available[0]);
    }
  }
  function download() {
    if (!paint.current || !outline.current || !page || loading || error) return;
    const c = document.createElement("canvas");
    c.width = SIZE;
    c.height = SIZE + 54;
    const ctx = c.getContext("2d");
    if (!ctx) return;
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, c.width, c.height);
    ctx.drawImage(paint.current, 0, 0);
    ctx.drawImage(outline.current, 0, 0);
    ctx.fillStyle = "#343f59";
    ctx.font = "12px sans-serif";
    ctx.fillText(page.name + " · " + page.author, 18, SIZE + 21, SIZE - 36);
    ctx.fillText(
      "Coloring Pages / Pavel Kukov · CC BY-SA 4.0 · github.com/pavelkukov/coloring-pages",
      18,
      SIZE + 40,
      SIZE - 36,
    );
    c.toBlob((blob) => {
      if (!blob) return;
      const url = URL.createObjectURL(blob),
        a = document.createElement("a");
      a.href = url;
      a.download = "Рыбка-" + page.name + ".png";
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 1500);
    }, "image/png");
  }
  async function downloadLegacy(id: string) {
    try {
      const entry = await readLegacyArtwork(id);
      if (!entry) throw new Error("Missing archive");
      const item = coloringPages.find((p) => p.id === id);
      let result = entry.image;
      if (item) {
        const previous = await loadLegacyImage(entry.image),
          line = new Image();
        line.src = source(id);
        await line.decode();
        const c = document.createElement("canvas");
        c.width = SIZE;
        c.height = SIZE + 54;
        const context = c.getContext("2d");
        if (!context) throw new Error("Canvas unavailable");
        context.fillStyle = "#fff";
        context.fillRect(0, 0, c.width, c.height);
        context.drawImage(previous, 0, 0);
        const ink = document.createElement("canvas");
        ink.width = ink.height = SIZE;
        const layer = ink.getContext("2d", { willReadFrequently: true });
        if (!layer) throw new Error("Canvas unavailable");
        const scale = Math.min(
            (SIZE - 42) / line.naturalWidth,
            (SIZE - 42) / line.naturalHeight,
          ),
          w = line.naturalWidth * scale,
          h = line.naturalHeight * scale;
        layer.translate(SIZE / 2, SIZE / 2);
        if (ROTATED_LEGACY_PAGES.has(id)) layer.rotate(Math.PI / 2);
        layer.drawImage(line, -w / 2, -h / 2, w, h);
        layer.resetTransform();
        const raster = layer.getImageData(0, 0, SIZE, SIZE);
        transparentInk(raster.data);
        layer.putImageData(raster, 0, 0);
        context.drawImage(ink, 0, 0);
        context.fillStyle = "#343f59";
        context.font = "12px sans-serif";
        context.fillText(
          item.name + " · " + item.author,
          18,
          SIZE + 21,
          SIZE - 36,
        );
        context.fillText(
          "Coloring Pages / Pavel Kukov · CC BY-SA 4.0 · github.com/pavelkukov/coloring-pages",
          18,
          SIZE + 40,
          SIZE - 36,
        );
        result = await new Promise<Blob>((resolve, reject) =>
          c.toBlob(
            (blob) =>
              blob ? resolve(blob) : reject(new Error("PNG unavailable")),
            "image/png",
          ),
        );
      }
      const url = URL.createObjectURL(result),
        link = document.createElement("a");
      link.href = url;
      link.download = "Рыбка-прежний-" + (item?.name || id) + ".png";
      link.click();
      setTimeout(() => URL.revokeObjectURL(url), 1500);
    } catch {
      setStatus(
        "Не удалось скачать прежний рисунок. Исходные данные остаются в браузере; попробуйте ещё раз.",
      );
    }
  }
  const keyboardSeed =
    keyboardRegion >= 0 && geometry.current
      ? geometry.current.seeds[keyboardRegion]
      : null;
  return (
    <main className="magic-app" ref={scroller} onScroll={() => {
      if (page) return;
      galleryScroll.current = scroller.current?.scrollTop || 0;
    }}>
      <header className="magic-header">
        <button
          className="magic-back"
          aria-label={page ? "Назад в галерею" : "Назад в мастерскую"}
          onClick={() => (page ? window.history.back() : onBack())}
        >
          ← <span>Назад</span>
        </button>
        <div className="magic-brand">
          <small>Творческая мастерская</small>
          <strong>
            Волшебная <i>Рыбка</i>
          </strong>
        </div>
        <button
          className="magic-help"
          onClick={() => setDialog("help")}
          aria-label="Как раскрашивать"
        >
          ?
        </button>
      </header>
      {!page ? (
        <section className="magic-start">
          <span className="magic-eyebrow">Галерея раскрасок</span>
          <h1>
            Выбери свою <em>картинку!</em>
          </h1>
          <p>
            Выберите рисунок и раскрашивайте одним касанием. Прогресс
            сохраняется на этом устройстве.
          </p>
          {legacyIds.length > 0 && (
            <details className="magic-archive">
              <summary>Прежние рисунки · {legacyIds.length}</summary>
              <p>
                Цвета переносятся при открытии картинки. Здесь можно скачать
                исходную версию.
              </p>
              <ul>
                {legacyIds.map((id) => (
                  <li key={id}>
                    <span>
                      {coloringPages.find((p) => p.id === id)?.name ||
                        id.replace(/_/g, " ")}
                    </span>
                    <button
                      onClick={() => void downloadLegacy(id)}
                      aria-label={
                        "Скачать прежний рисунок: " +
                        (coloringPages.find((p) => p.id === id)?.name || id)
                      }
                    >
                      Скачать PNG
                    </button>
                  </li>
                ))}
              </ul>
            </details>
          )}
          <div className="magic-filters" aria-label="Категории">
            {[
              ["all", "Все"],
              ["sea", "Море"],
              ["animals", "Животные"],
              ["fantasy", "Сказки"],
              ["nature", "Природа"],
              ["things", "Предметы"],
              ["patterns", "Узоры"],
            ].map(([id, label]) => (
              <button
                key={id}
                aria-pressed={category === id}
                className={category === id ? "active" : ""}
                onClick={() => setCategory(id)}
              >
                {label}
              </button>
            ))}
          </div>
          <input
            type="search"
            className="magic-search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Найти раскраску…"
            aria-label="Поиск раскраски"
          />
          <p className="magic-count" role="status">
            Найдено: {list.length}
          </p>
          {list.length === 0 && (
            <div className="magic-empty">
              <p>
                Такой картинки пока нет. Попробуйте другое название или
                категорию.
              </p>
              <button
                onClick={() => {
                  setQuery("");
                  setCategory("all");
                }}
              >
                Показать все рисунки
              </button>
            </div>
          )}
          <div className="magic-gallery">
            {list.map((p) => (
              <button
                key={p.id}
                className="magic-card"
                onClick={() => openPage(p)}
              >
                <div className="magic-preview">
                  <img
                    loading="lazy"
                    decoding="async"
                    width="220"
                    height="275"
                    src={source(p.id)}
                    alt=""
                  />
                </div>
                <span>{p.name}</span>
                <small>
                  {saved.includes(p.id) || legacyIds.includes(p.id)
                    ? "Продолжить →"
                    : "Раскрасить →"}
                </small>
              </button>
            ))}
          </div>
          <p className="magic-credit">
            Pavel Kukov и авторы коллекции ·{" "}
            <a href={BASE + "ACKNOWLEDGMENTS.md"}>Авторство</a> ·{" "}
            <a href={BASE + "LICENSE.txt"}>CC BY-SA 4.0</a> ·{" "}
            <a
              href="https://github.com/pavelkukov/coloring-pages"
              target="_blank"
              rel="noopener noreferrer"
            >
              Исходные иллюстрации
            </a>
          </p>
        </section>
      ) : (
        <section className="magic-work">
          <div className="magic-worktop">
            <div>
              <small>Раскраска</small>
              <h1>{page.name}</h1>
            </div>
            <div className="magic-actions">
              <button onClick={undo} disabled={!history.length || loading}>
                ↶ <span>Отмена</span>
              </button>
              <button
                onClick={() => setDialog("reset")}
                disabled={loading || !!error}
              >
                ↻ <span>Очистить</span>
              </button>
              <button
                className="magic-save"
                onClick={download}
                disabled={loading || !!error}
              >
                ↓ <span>Скачать PNG</span>
              </button>
            </div>
          </div>
          <div className="magic-zoom" role="group" aria-label="Масштаб рисунка">
            <button
              aria-label="Уменьшить рисунок"
              disabled={zoom === 1}
              onClick={() => setZoom((z) => Math.max(1, z - 0.5))}
            >
              −
            </button>
            <span>{Math.round(zoom * 100)}%</span>
            <button
              aria-label="Увеличить рисунок"
              disabled={zoom === 3}
              onClick={() => setZoom((z) => Math.min(3, z + 0.5))}
            >
              +
            </button>
            <span className="magic-zoom-hint">Увеличьте мелкие детали</span>
          </div>
          <div className="magic-stage magic-real-stage" aria-busy={loading}>
            <div className="magic-canvas-scroll">
              <div
                className="magic-canvas-stack"
                style={{ width: zoom * 100 + "%", maxWidth: "none" }}
              >
                <canvas
                  ref={paint}
                  width={SIZE}
                  height={SIZE}
                  onPointerDown={(e) => {
                    pointerStart.current = { x: e.clientX, y: e.clientY };
                  }}
                  onPointerCancel={() => {
                    pointerStart.current = null;
                  }}
                  onPointerUp={(e) => {
                    const start = pointerStart.current;
                    pointerStart.current = null;
                    if (
                      start &&
                      Math.hypot(e.clientX - start.x, e.clientY - start.y) < 10
                    )
                      fill(e);
                  }}
                  onKeyDown={keyboard}
                  tabIndex={0}
                  role="img"
                  aria-label={"Раскрасить " + page.name}
                  aria-describedby="coloring-instructions"
                />
                <canvas
                  ref={outline}
                  width={SIZE}
                  height={SIZE}
                  aria-hidden="true"
                />
                {keyboardSeed !== null && (
                  <span
                    className="magic-region-cursor"
                    style={{
                      left: ((keyboardSeed % SIZE) / SIZE) * 100 + "%",
                      top: (Math.floor(keyboardSeed / SIZE) / SIZE) * 100 + "%",
                    }}
                    aria-hidden="true"
                  />
                )}
              </div>
            </div>
            {loading && (
              <div className="magic-loading" role="status">
                Загружаем рисунок…
              </div>
            )}
            {error && (
              <div className="magic-loading" role="alert">
                {error}
              </div>
            )}
          </div>
          <div className="magic-bottom">
            <p id="coloring-instructions">
              Выберите цвет и коснитесь области рисунка.
              <span className="magic-keyboard-hint">
                {" "}
                Клавиатура: ← → выбирают область, Enter закрашивает.
              </span>
            </p>
            <div className="magic-colors" role="group" aria-label="Палитра">
              {COLORS.map((c, i) => (
                <button
                  key={c}
                  onClick={() => setColor(c)}
                  aria-label={COLOR_NAMES[i]}
                  aria-pressed={color === c}
                  className={color === c ? "chosen" : ""}
                  style={{ "--swatch": c } as React.CSSProperties}
                >
                  <span />
                </button>
              ))}
              <label className="magic-custom">
                ＋
                <input
                  type="color"
                  aria-label="Свой цвет"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                />
              </label>
            </div>
          </div>
          <p className="magic-status" role="status">
            {status || "Рисунок сохраняется автоматически"}
          </p>
          <p className="magic-credit">
            {page.author} ·{" "}
            <a href={page.source} target="_blank" rel="noopener noreferrer">
              Источник рисунка
            </a>{" "}
            · Коллекция Pavel Kukov ·{" "}
            <a href={BASE + "LICENSE.txt"}>CC BY-SA 4.0</a>
            <br />
            При публикации раскрашенного рисунка сохраните авторство и эту
            лицензию.
          </p>
        </section>
      )}
      {!page && status && (
        <p className="magic-status" role="status">
          {status}
        </p>
      )}
      {dialog && (
        <div
          className="magic-overlay"
          onClick={() => setDialog(null)}
          onKeyDown={(e) => {
            if (e.key === "Escape") setDialog(null);
            if (e.key === "Tab") {
              const buttons =
                modal.current?.querySelectorAll<HTMLButtonElement>("button");
              if (!buttons?.length) return;
              const first = buttons[0],
                last = buttons[buttons.length - 1];
              if (e.shiftKey && document.activeElement === first) {
                e.preventDefault();
                last.focus();
              } else if (!e.shiftKey && document.activeElement === last) {
                e.preventDefault();
                first.focus();
              }
            }
          }}
        >
          <div
            ref={modal}
            className="magic-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="magic-dialog-title"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="magic-close"
              aria-label="Закрыть подсказку"
              onClick={() => setDialog(null)}
            >
              ×
            </button>
            <h2 id="magic-dialog-title">
              {dialog === "reset" ? "Начать заново?" : "Как раскрашивать"}
            </h2>
            <p>
              {dialog === "reset"
                ? "Краски будут удалены. Это действие можно отменить кнопкой «Отмена»."
                : "Выберите цвет и нажмите на белую область. Кнопки + и − увеличивают мелкие детали; увеличенный рисунок можно прокручивать пальцем. Цвета сохраняются на этом устройстве. Кнопка «Скачать PNG» сохранит готовый рисунок с контурами."}
            </p>
            <button
              className="magic-ok"
              onClick={() => (dialog === "reset" ? reset() : setDialog(null))}
            >
              {dialog === "reset" ? "Очистить рисунок" : "Понятно"}
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
