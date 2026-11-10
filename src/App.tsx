import { lazy, Suspense, useEffect, useRef, useState } from "react";
import {
  Menu,
  X,
  Play,
  Music2,
  Palette,
} from "lucide-react";
import gsap from "gsap";
import { contact } from "./data";
import { musicPhoto } from "./musicContent";
import { photoSrcSet } from "./ResponsivePhoto";
import { rybkaContact } from "./artContent";
import { getArtPhoto } from "./artPhotos";
import "./style.css";
const Draw = lazy(() => import("./Draw"));
const MusicStudio = lazy(() => import("./MusicStudio"));
const ArtStudio = lazy(() => import("./ArtStudio"));
const Beat = lazy(() => import("./Beat"));
const base = import.meta.env.BASE_URL.replace(/\/$/, "");
const recovered = new URLSearchParams(location.search).get("route");
if (recovered && recovered.startsWith("/") && !recovered.startsWith("//"))
  history.replaceState({}, "", base + recovered);
const navigate = (path: string) => {
  history.pushState({}, "", base + path);
  dispatchEvent(new Event("popstate"));
  window.scrollTo(0, 0);
};
function Link({
  to,
  children,
  className = "",
  ...props
}: {
  to: string;
  children: React.ReactNode;
  className?: string;
  "aria-label"?: string;
}) {
  return (
    <a
      href={base + to}
      className={className}
      {...props}
      onClick={(e) => {
        if (!e.metaKey && !e.ctrlKey && !e.shiftKey && e.button === 0) {
          e.preventDefault();
          navigate(to);
        }
      }}
    >
      {children}
    </a>
  );
}
function Fish({ className = "" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 360 250"
      fill="none"
      aria-hidden="true"
    >
      <path d="M84 125C28 68 11 68 14 124c-3 57 14 57 70 1Z" fill="#e58a55" />
      <path
        d="M76 125C113 13 266 3 338 125c-72 122-225 112-262 0Z"
        fill="#d54b35"
      />
      <path
        d="M171 35c-46 70-42 113 0 181M224 34c-43 72-42 110 0 182"
        stroke="#f6ce72"
        strokeWidth="16"
      />
      <circle cx="282" cy="109" r="12" fill="#fffaf1" />
      <circle cx="285" cy="109" r="5" fill="#212b29" />
      <path
        d="M290 154q18 9 30-4"
        stroke="#fffaf1"
        strokeWidth="5"
        strokeLinecap="round"
      />
      <path
        d="m143 37 32-25 30 16M147 213l27 25 31-17"
        stroke="#d54b35"
        strokeWidth="13"
        strokeLinejoin="round"
      />
    </svg>
  );
}
function Wave({ interactive = false }: { interactive?: boolean }) {
  const [playing, setPlaying] = useState(false);
  return (
    <button
      className={"sound-wave " + (playing ? "is-playing" : "")}
      aria-label={
        playing ? "Остановить анимацию ритма" : "Включить анимацию ритма"
      }
      aria-pressed={playing}
      onClick={() => setPlaying((x) => !x)}
      disabled={!interactive}
    >
      {Array.from({ length: 23 }, (_, i) => (
        <span
          key={i}
          style={
            {
              "--bar": `${24 + Math.sin(i * 0.65) ** 2 * 76}%`,
              "--delay": `${i * 0.045}s`,
            } as React.CSSProperties
          }
        />
      ))}
      {interactive && (
        <small>
          {playing ? "Пауза" : "Почувствуй ритм"} <Play size={12} />
        </small>
      )}
    </button>
  );
}
function Header({ kind }: { kind?: "art" | "music" }) {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    if (!open) return;
    const listener = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    addEventListener("keydown", listener);
    return () => removeEventListener("keydown", listener);
  }, [open]);
  return (
    <header className="site-header">
      <Link to="/" className="brand" aria-label="Music & Art — главная">
        music<span>&</span>art
        <span className="brand-dot" />
      </Link>
      <nav
        onClick={() => setOpen(false)}
        className={open ? "is-open" : ""}
        aria-label="Основная навигация"
      >
        {kind === 'art' ? <>
          <a href="#about">О мастерской</a>
          <a href="#directions">Мастер-классы</a>
          <a href="#anna">Об Анне</a>
          <a href="#works">Работы</a>
          <a href="#contact">Контакты</a>
          <a className="nav-contact" href={rybkaContact.max} target="_blank" rel="noreferrer">Расписание в MAX</a>
        </> : kind === 'music' ? <>
          <a href="#directions">Инструменты</a>
          <a href="#formats">Форматы занятий</a>
          <a href="#gallery">Фотографии</a>
          <a className="nav-contact" href="#contact">Записаться</a>
        </> : <>
        <Link to="/art">
          Мастерская «Рыбка»
        </Link>
        <Link to="/music" className={kind === "music" ? "current" : ""}>
          Студия stARTup
        </Link>
        <a
          className="nav-contact"
          href={kind ? "#contact" : base + "/art#contact"}
          onClick={() => setOpen(false)}
        >
          Давайте знакомиться
        </a>
        </>}

      </nav>
      <button
        className="menu-toggle"
        aria-expanded={open}
        aria-label={open ? "Закрыть меню" : "Открыть меню"}
        onClick={() => setOpen(!open)}
      >
        {open ? <X /> : <Menu />}
      </button>
    </header>
  );
}
function Footer({ kind }: { kind?: "art" | "music" }) {
  return (
    <footer className="site-footer">
      <Link to="/" className="brand">
        music<span>&</span>art
      </Link>
      <p>Творчество начинается с тебя.</p>
      <span>Лазаревское, Сочи</span>
      <a href={kind === "art" ? rybkaContact.max : contact.vk} target="_blank" rel="noreferrer">{kind === "art" ? "MAX" : "ВКонтакте"}</a>
      <a href={base + "/licenses/"}>Лицензии и авторы</a>
    </footer>
  );
}
function Home() {
  const root = useRef<HTMLElement>(null);
  const entering = useRef(false);
  const animation = useRef<gsap.core.Timeline | null>(null);
  const overlay = useRef<HTMLDivElement | null>(null);
  const frame = useRef(0);
  useEffect(() => () => {
    cancelAnimationFrame(frame.current);
    animation.current?.kill();
    overlay.current?.remove();
  }, []);
  function choose(event: React.MouseEvent<HTMLElement>) {
    const card = (event.target as Element).closest<HTMLAnchorElement>('a.world');
    if (!card || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    if (entering.current) { event.preventDefault(); event.stopPropagation(); return; }
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    if (!root.current) return;
    event.preventDefault(); event.stopPropagation(); entering.current = true;

    // Read geometry once. The original card stays in its grid cell throughout.
    const rect = card.getBoundingClientRect();
    const style = getComputedStyle(card);
    const background = style.backgroundColor;
    const radius = parseFloat(style.borderTopLeftRadius) || 26;
    const width = window.innerWidth, height = window.innerHeight;
    const overscanX = radius * width / Math.max(1, rect.width - radius * 2) + 2;
    const overscanY = radius * height / Math.max(1, rect.height - radius * 2) + 2;
    const path = new URL(card.href).pathname.slice(base.length);
    const artwork = Array.from(card.querySelectorAll<HTMLElement>('.home-fish, .record'));
    const transforms = artwork.map(node => getComputedStyle(node).transform);
    const others = Array.from(root.current.querySelectorAll('.world, .home-signature, .home-social')).filter(node => node !== card);
    // Warm only the chosen section's hero while the compositor transition plays.
    const heroImage = new Image();
    const heroPhoto = path === '/art' ? getArtPhoto('lesson') : musicPhoto('lesson');
    const heroSource = heroPhoto?.src;
    if (heroSource) {
      heroImage.decoding = 'async';
      heroImage.sizes = path === '/art' ? '(max-width: 760px) 88vw, 45vw' : '(max-width: 760px) 90vw, 45vw';
      heroImage.srcset = heroPhoto ? photoSrcSet(heroPhoto) || "" : "";
      heroImage.src = heroSource;
      void heroImage.decode().catch(() => {});
    }

    const layer = document.createElement('div');
    layer.className = 'home-transition';
    layer.setAttribute('aria-hidden', 'true');
    layer.inert = true;
    const surface = document.createElement('div');
    surface.className = 'home-transition-surface';
    const content = card.cloneNode(true) as HTMLAnchorElement;
    content.classList.add('home-transition-card');
    content.removeAttribute('href');
    content.tabIndex = -1;
    content.querySelectorAll<HTMLElement>('.home-fish, .record').forEach((node, index) => {
      node.style.transform = transforms[index];
    });
    layer.append(surface, content);
    root.current.append(layer);
    overlay.current = layer;
    root.current.setAttribute('aria-busy', 'true');
    gsap.set([surface, content], { left: rect.left, top: rect.top, width: rect.width, height: rect.height, force3D: true });
    gsap.set(surface, { backgroundColor: background, borderRadius: radius, transformOrigin: '0 0' });
    gsap.set(content, { transformOrigin: '50% 50%' });
    // Move the fish's HTML wrapper so the SVG itself stays a static drawing.
    const fishGraphic = content.querySelector('.home-fish');
    const fish = fishGraphic ? document.createElement('div') : null;
    if (fish && fishGraphic) {
      fish.className = 'home-fish-motion';
      fishGraphic.parentElement?.insertBefore(fish, fishGraphic);
      fish.append(fishGraphic);
    }
    const record = content.querySelector('.record');
    gsap.set([fish, record].filter(Boolean), { force3D: true });
    card.style.visibility = 'hidden';

    // Give the browser a frame to prepare the two temporary compositor layers.
    frame.current = requestAnimationFrame(() => {
      frame.current = requestAnimationFrame(() => {
        animation.current = gsap.timeline({ defaults: { duration: 0.7, ease: 'sine.inOut' }, onComplete: () => {
          // Retain just the solid surface across React's route change, then reveal
          // the mounted section. Home cleanup must not remove this handoff layer.
          content.remove();
          layer.classList.add('home-transition-handoff');
          document.body.append(layer);
          overlay.current = null;
          animation.current = null;
          navigate(path);
          requestAnimationFrame(() => requestAnimationFrame(() => {
            gsap.to(layer, { opacity: 0, duration: 0.22, ease: 'power1.out', onComplete: () => layer.remove() });
          }));
        } });
        animation.current.to(others, { opacity: 0, duration: 0.22 }, 0);
        // Overscan hides the rounded edges at the end without repainting radii.
        animation.current.to(surface, {
          x: -rect.left - overscanX,
          y: -rect.top - overscanY,
          scaleX: (width + overscanX * 2) / rect.width,
          scaleY: (height + overscanY * 2) / rect.height,
        }, 0);
        animation.current.to(content, {
          x: width / 2 - rect.left - rect.width / 2,
          y: height / 2 - rect.top - rect.height / 2,
          scale: Math.min(width / rect.width, height / rect.height) * 1.02,
        }, 0);
        // Keep the artwork's own departure independent of the card expansion.
        if (fish) animation.current.to(fish, {
          x: `+=${width + rect.width}`,
          y: '-=36',
          rotation: '-=8',
          duration: 0.78,
          ease: 'power2.inOut',
        }, 0.03);
        if (record) animation.current.to(record, {
          x: `+=${width + rect.width}`,
          rotation: '+=300',
          duration: 0.78,
          ease: 'power2.inOut',
        }, 0.03);
        animation.current.to(content, { opacity: 0, duration: 0.2, ease: 'power1.out' }, 0.61);
      });
    });
  }
  return (
    <main className="site-home" id="main" ref={root} onClickCapture={choose}>
      <h1 className="visually-hidden">Два мира творчества — Music & Art</h1>
      <div className="home-signature">music & art · Лазаревское</div>
      <section className="worlds" aria-label="Выберите творческую студию">
        <Link to="/art" className="world art-world">
          <div className="world-top"><span><Palette size={18} /> Художественная мастерская</span></div>
          <div className="world-artwork"><div className="art-orbit" /><Fish className="home-fish" /></div>
          <div className="world-copy">
            <div><h2>Рыбка</h2><p>Рисуем. Придумываем. Удивляемся.</p></div>
            <span className="world-cta">В мир искусства</span>
          </div>
        </Link>
        <Link to="/music" className="world music-world">
          <div className="world-top"><span><Music2 size={18} /> Музыкальная студия</span></div>
          <div className="world-artwork music-artwork"><span className="record"><span /></span></div>
          <div className="world-copy">
            <div><h2>st<span>ART</span>up</h2><p>Находим ритм. Создаём звучание.</p></div>
            <span className="world-cta">В мир музыки</span>
          </div>
        </Link>
      </section>
      <a className="home-social" href={contact.vk} target="_blank" rel="noreferrer">ВКонтакте</a>
    </main>
  );
}
export default function App() {
  const currentPath = () =>
    location.pathname.startsWith(base)
      ? location.pathname.slice(base.length).replace(/\/+$/, "") || "/"
      : "/";
  const [path, setPath] = useState(currentPath);
  useEffect(() => {
    const update = () => setPath(currentPath());
    addEventListener("popstate", update);
    return () => removeEventListener("popstate", update);
  }, []);
  useEffect(() => {
    const titles: Record<string, string> = {
      "/": "Два мира творчества",
      "/art": "Рыбка — художественная мастерская",
      "/music": "stARTup — музыкальная студия",
      "/art/draw": "Волшебная Рыбка — раскраски",
      "/music/studio": "Музыкальная студия онлайн",
    };
    document.title = (titles[path] || "Страница не найдена") + " | Music & Art";
    document
      .querySelector('meta[name="theme-color"]')
      ?.setAttribute(
        "content",
        path.startsWith("/music") ? "#e9eff6" : "#fffaf1",
      );
    let canonical = document.querySelector<HTMLLinkElement>(
      'link[rel="canonical"]',
    );
    if (!canonical) {
      canonical = document.createElement("link");
      canonical.rel = "canonical";
      document.head.append(canonical);
    }
    canonical.href =
      "https://mumortsev.github.io" + base + (path === "/" ? "/" : path + "/");
    const descriptions: Record<string, string> = {
      "/": "Художественная мастерская «Рыбка» и музыкальная студия stARTup в Лазаревском. Два мира творчества для детей и родителей.",
      "/art":
        "Мастерская «Рыбка»: рисование и творческие мастер-классы для детей и взрослых в Лазаревском. Расписание в MAX, занятия в мастерской и на выезд.",
      "/music":
        "Уроки гитары, бас-гитары и барабанной установки в Лазаревском. Индивидуально и в группе для взрослых и детей с 7 лет. Социалистическая, 1.",
      "/art/draw":
        "69 настоящих иллюстраций: раскрашивание касанием, сохранение прогресса и экспорт PNG.",
      "/music/studio":
        "Простой детский секвенсор: жанры, квадратики со звуками барабанов, гитары и баса, скачивание музыки.",
    };
    const description = descriptions[path] || descriptions["/"];
    document
      .querySelector('meta[name="description"]')
      ?.setAttribute("content", description);
    document
      .querySelector('meta[property="og:description"]')
      ?.setAttribute("content", description);
    document
      .querySelector('meta[property="og:title"]')
      ?.setAttribute("content", document.title);
    document
      .querySelector('meta[property="og:url"]')
      ?.setAttribute("content", canonical.href);
  }, [path]);
  return (
    <Suspense
      fallback={
        <main className="app-loading" role="status">
          Открываем творческий мир…
        </main>
      }
    >
      {path === "/" ? (
        <Home />
      ) : path === "/art" ? (
        <ArtStudio header={<Header kind="art" />} footer={<Footer kind="art" />} emblem={<Fish className="rybka-emblem" />} onHome={() => navigate("/")} onDraw={() => navigate("/art/draw")} onMusic={() => navigate("/music")} />
      ) : path === "/music" ? (
        <MusicStudio header={<Header kind="music" />} footer={<Footer kind="music" />} rhythm={<Wave interactive />} onHome={() => navigate("/")} onPlay={() => navigate("/music/studio")} onArt={() => navigate("/art")} />
      ) : path === "/art/draw" ? (
        <Draw onBack={() => navigate("/art")} />
      ) : path === "/music/studio" ? (
        <Beat onBack={() => navigate("/music")} />
      ) : (
        <main className="notfound">
          <span>404</span>
          <h1>Кажется, здесь чистый лист.</h1>
          <Link to="/" className="button">
            Вернуться к творчеству
          </Link>
        </main>
      )}
    </Suspense>
  );
}
