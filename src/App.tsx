import { lazy, Suspense, useEffect, useRef, useState } from "react";
import {
  ArrowUpRight,
  ArrowLeft,
  Menu,
  X,
  MapPin,
  Phone,
  Play,
  ChevronLeft,
  ChevronRight,
  Music2,
  Palette,
} from "lucide-react";
import gsap from "gsap";
import { art, music, contact } from "./data";
import "./style.css";
const Draw = lazy(() => import("./Draw"));
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
function Photo({
  src,
  alt,
  eager = false,
  className = "",
}: {
  src: string;
  alt: string;
  eager?: boolean;
  className?: string;
}) {
  return (
    <img
      className={className}
      src={src}
      srcSet={
        src.includes("-1200.webp")
          ? `${src.replace("-1200", "-640")} 640w, ${src} 1200w`
          : undefined
      }
      sizes="(max-width: 700px) 100vw, 50vw"
      alt={alt}
      loading={eager ? "eager" : "lazy"}
      fetchPriority={eager ? "high" : "auto"}
      decoding="async"
      width="1200"
      height="900"
    />
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
        <Link to="/art" className={kind === "art" ? "current" : ""}>
          Мастерская «Рыбка»
        </Link>
        <Link to="/music" className={kind === "music" ? "current" : ""}>
          Студия stARTup
        </Link>
        <a
          className="nav-contact"
          href={kind ? "#contact" : contact.vk}
          onClick={() => setOpen(false)}
        >
          Давайте знакомиться <ArrowUpRight size={16} />
        </a>
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
function useEntrance(root: React.RefObject<HTMLElement>, dependency?: string) {
  useEffect(() => {
    const mm = gsap.matchMedia();
    mm.add("(prefers-reduced-motion: no-preference)", () => {
      const scope = gsap.context(() => {
        gsap.fromTo(
          "[data-enter]",
          { y: 22, opacity: 0 },
          {
            y: 0,
            opacity: 1,
            duration: 0.7,
            stagger: 0.09,
            ease: "power3.out",
            clearProps: "all",
          },
        );
      }, root);
      return () => scope.revert();
    });
    return () => mm.revert();
  }, [dependency]);
}
function Footer() {
  return (
    <footer className="site-footer">
      <Link to="/" className="brand">
        music<span>&</span>art
      </Link>
      <p>Творчество начинается с тебя.</p>
      <span>Лазаревское, Сочи</span>
      <a href={base + "/licenses/"}>Лицензии и авторы</a>
    </footer>
  );
}
function Home() {
  const root = useRef<HTMLElement>(null);
  useEntrance(root);
  return (
    <div className="site-home">
      <a className="skip-link" href="#main">
        К содержимому
      </a>
      <Header />
      <main id="main" ref={root}>
        <section className="home-intro">
          <div data-enter className="place-label">
            <span /> Лазаревское, Сочи
          </div>
          <h1 data-enter>
            У каждого таланта
            <br />
            есть <span className="home-italic">свой мир.</span>
            <svg viewBox="0 0 80 80" aria-hidden="true">
              <path d="M40 2v76M2 40h76M13 13l54 54M13 67l54-54" />
            </svg>
          </h1>
          <p data-enter>
            Две студии. Тысячи идей. <br />
            Выбери, с чего начнётся твоя история.
          </p>
        </section>
        <section className="worlds" aria-label="Выберите творческую студию">
          <Link to="/art" className="world art-world">
            <div className="world-top">
              <span>
                <Palette size={18} /> Художественная студия
              </span>
              <span className="round-arrow">
                <ArrowUpRight />
              </span>
            </div>
            <div className="world-artwork">
              <div className="art-orbit" />
              <Fish className="home-fish" />
              <span className="art-spark">✳︎</span>
              <span className="world-note">
                Можно всё.
                <br />
                Даже рисовать мечты.
              </span>
            </div>
            <div className="world-copy">
              <div>
                <h2>Рыбка</h2>
                <p>Рисуем. Придумываем. Удивляемся.</p>
              </div>
              <span className="world-cta">
                В мир искусства <ArrowUpRight size={17} />
              </span>
            </div>
          </Link>
          <Link to="/music" className="world music-world">
            <div className="world-top">
              <span>
                <Music2 size={18} /> Музыкальная студия
              </span>
              <span className="round-arrow">
                <ArrowUpRight />
              </span>
            </div>
            <div className="world-artwork music-artwork">
              <span className="record">
                <span />
              </span>
              <span className="music-sticker">
                Твой звук.
                <br />
                Твои правила.
              </span>
              <div className="mini-wave" aria-hidden="true">
                {Array.from({ length: 15 }, (_, i) => (
                  <span
                    key={i}
                    style={{ height: 20 + Math.sin(i * 0.7) ** 2 * 75 + "%" }}
                  />
                ))}
              </div>
            </div>
            <div className="world-copy">
              <div>
                <h2>
                  st<span>ART</span>up
                </h2>
                <p>Находим ритм. Создаём звучание.</p>
              </div>
              <span className="world-cta">
                В мир музыки <ArrowUpRight size={17} />
              </span>
            </div>
          </Link>
        </section>
        <div className="home-bottom">
          <p>Для тех, кому интересно создавать.</p>
          <span>Сначала любопытство. Потом — любимое дело.</span>
        </div>
      </main>
      <Footer />
    </div>
  );
}
function Gallery({ kind }: { kind: "art" | "music" }) {
  const items = kind === "art" ? art : music;
  const [index, setIndex] = useState(-1);
  const dialog = useRef<HTMLDialogElement>(null);
  const opener = useRef<HTMLButtonElement | null>(null);
  const touch = useRef(0);
  useEffect(() => {
    if (index >= 0 && !dialog.current?.open) {
      dialog.current?.showModal();
      document.body.style.overflow = "hidden";
    }
    return () => {};
  }, [index]);
  useEffect(
    () => () => {
      document.body.style.overflow = "";
    },
    [],
  );
  const close = () => {
    dialog.current?.close();
    setIndex(-1);
    document.body.style.overflow = "";
    opener.current?.focus();
  };
  return (
    <>
      <div className="gallery">
        {items.map((item, i) => (
          <button
            key={item.title}
            onClick={(e) => {
              opener.current = e.currentTarget;
              setIndex(i);
            }}
            aria-label={"Открыть фото: " + item.title}
          >
            <Photo src={item.img} alt={item.title} />
            <span>
              {item.title}
              <ArrowUpRight size={20} />
            </span>
          </button>
        ))}
      </div>
      <dialog
        className="lightbox"
        ref={dialog}
        aria-label="Просмотр фотографий"
        onCancel={(e) => {
          e.preventDefault();
          close();
        }}
        onClick={(e) => {
          if (e.target === e.currentTarget) close();
        }}
        onKeyDown={(e) => {
          if (e.key === "ArrowRight") setIndex((index + 1) % items.length);
          if (e.key === "ArrowLeft")
            setIndex((index + items.length - 1) % items.length);
        }}
      >
        <button className="lightbox-close" aria-label="Закрыть" onClick={close}>
          <X />
        </button>
        {index >= 0 && (
          <div
            className="lightbox-content"
            onTouchStart={(e) => (touch.current = e.touches[0].clientX)}
            onTouchEnd={(e) => {
              const d = e.changedTouches[0].clientX - touch.current;
              if (Math.abs(d) > 45)
                setIndex(
                  (index + (d < 0 ? 1 : items.length - 1)) % items.length,
                );
            }}
          >
            <button
              aria-label="Предыдущее фото"
              onClick={() =>
                setIndex((index + items.length - 1) % items.length)
              }
            >
              <ChevronLeft />
            </button>
            <figure>
              <Photo src={items[index].img} alt={items[index].title} />
              <figcaption>
                {items[index].title}
                <span>
                  {index + 1} / {items.length}
                </span>
              </figcaption>
            </figure>
            <button
              aria-label="Следующее фото"
              onClick={() => setIndex((index + 1) % items.length)}
            >
              <ChevronRight />
            </button>
          </div>
        )}
      </dialog>
    </>
  );
}
function Studio({ kind }: { kind: "art" | "music" }) {
  const isArt = kind === "art",
    items = isArt ? art : music;
  const root = useRef<HTMLElement>(null);
  useEntrance(root, kind);
  return (
    <div className={"studio " + kind}>
      <a className="skip-link" href="#main">
        К содержимому
      </a>
      <Header kind={kind} />
      <main id="main" ref={root}>
        <section className="studio-hero">
          <div className="hero-copy">
            <Link to="/" className="back-link">
              <ArrowLeft size={16} /> Два мира творчества
            </Link>
            <div className="place-label" data-enter>
              <span />{" "}
              {isArt
                ? "Мастерская, где оживают идеи"
                : "Музыкальная студия в Лазаревском"}
            </div>
            <h1 data-enter>
              {isArt ? (
                <>
                  Больше красок.
                  <br />
                  <em>Больше тебя.</em>
                </>
              ) : (
                <>
                  Твой характер.
                  <br />
                  <em>Твоё звучание.</em>
                </>
              )}
            </h1>
            <p data-enter>
              {isArt
                ? "Рисование, поделки и маленькие открытия. Пространство для детей и родителей, где фантазию не ограничивают рамками."
                : "Гитара, бас и барабаны. Знакомься с инструментами, чувствуй музыку и находи свой собственный ритм."}
            </p>
            <div className="hero-actions" data-enter>
              <a href="#directions" className="button">
                {isArt ? "Найти занятие" : "Выбрать инструмент"}
                <ArrowUpRight size={18} />
              </a>
              <Link
                to={isArt ? "/art/draw" : "/music/studio"}
                className="text-link"
              >
                {isArt ? "Попробовать раскраску" : "Открыть музыкальную студию"}
                <ArrowUpRight size={17} />
              </Link>
            </div>
          </div>
          <div className="hero-visual" data-enter>
            <Photo
              src={items[0].img}
              alt={
                isArt
                  ? "Девочка увлечённо рисует цветными карандашами"
                  : "Игра на акустической гитаре"
              }
              eager
            />
            <span className="photo-tag">
              {isArt
                ? "Любопытство — лучший учитель"
                : "Всё начинается с первого звука"}
            </span>
            {isArt ? (
              <Fish className="hero-fish" />
            ) : (
              <div className="hero-record">
                <span>
                  st<span>ART</span>up
                </span>
                <Music2 size={40} />
              </div>
            )}
          </div>
          <div className="hero-baseline">
            <span>
              {isArt
                ? "Фантазия без правильных ответов"
                : "Творчество без лишнего шума"}
            </span>
            <span>
              Лазаревское <span aria-hidden="true">↘</span>
            </span>
          </div>
        </section>
        <section className="section directions" id="directions">
          <div className="section-heading">
            <p className="section-label">
              {isArt ? "Столько способов творить" : "Найди своё звучание"}
            </p>
            <h2>
              {isArt ? (
                <>
                  Руками. Красками.
                  <br />
                  <em>Воображением.</em>
                </>
              ) : (
                <>
                  От первого аккорда
                  <br />
                  <em>до своего ритма.</em>
                </>
              )}
            </h2>
            <p>
              {isArt
                ? "Любимое занятие находится в процессе. Пробуем материалы, учимся замечать красоту и создаём своё."
                : "За каждым инструментом — свой характер. Осталось узнать, какой созвучен тебе."}
            </p>
          </div>
          <div className="directions-grid">
            {items.map((item) => (
              <article className="direction-card" key={item.title}>
                <div className="direction-photo">
                  <Photo src={item.img} alt={item.title} />
                </div>
                <div className="direction-copy">
                  <h3>{item.title}</h3>
                  <p>{item.desc}</p>
                  <a
                    href="#contact"
                    aria-label={"Узнать о направлении «" + item.title + "»"}
                  >
                    <ArrowUpRight size={20} />
                  </a>
                </div>
              </article>
            ))}
          </div>
        </section>
        <section className="experience section">
          <div className="experience-copy">
            <p className="section-label">Творчество уже здесь</p>
            <h2>
              {isArt ? (
                <>
                  Немного цвета.
                  <br />
                  <em>Много радости.</em>
                </>
              ) : (
                <>
                  Твой первый трек?
                  <br />
                  <em>Почему бы и да.</em>
                </>
              )}
            </h2>
            <p>
              {isArt
                ? "Выбирай настоящую иллюстрацию и раскрашивай одним касанием. Продолжай в удобное время и сохраняй готовый рисунок."
                : "Открой студию прямо в браузере. Выбирай инструменты, собирай музыку и экспериментируй со звучанием."}
            </p>
            <Link to={isArt ? "/art/draw" : "/music/studio"} className="button">
              {isArt ? "Открыть раскраски" : "Создать свой бит"}
              <ArrowUpRight size={18} />
            </Link>
            <span className="experience-hint">
              Без регистрации. Просто попробуй.
            </span>
          </div>
          {isArt ? (
            <Link
              to="/art/draw"
              className="coloring-demo"
              aria-label="Перейти к раскраскам"
            >
              <div className="demo-paper">
                <img
                  src={base + "/coloring/cute_butterfly.svg"}
                  alt="Бабочка из галереи раскрасок"
                  loading="lazy"
                  width="400"
                  height="400"
                />
                <span className="demo-brush">
                  Добавь свой цвет <Palette size={18} />
                </span>
              </div>
              <div className="demo-swatches" aria-hidden="true">
                {["#d54b35", "#e9a33f", "#8eac72", "#669fba", "#ae6590"].map(
                  (c) => (
                    <span key={c} style={{ background: c }} />
                  ),
                )}
              </div>
            </Link>
          ) : (
            <div className="rhythm-demo">
              <span className="rhythm-brand">stARTup / playground</span>
              <Wave interactive />
              <span className="rhythm-caption">
                Сначала ритм. Потом всё остальное.
              </span>
            </div>
          )}
        </section>
        <section className="section atmosphere">
          <div className="section-heading">
            <p className="section-label">То самое чувство</p>
            <h2>
              {isArt ? (
                <>
                  Здесь хочется
                  <br />
                  <em>создавать.</em>
                </>
              ) : (
                <>
                  Музыка, которую
                  <br />
                  <em>чувствуешь.</em>
                </>
              )}
            </h2>
          </div>
          <Gallery key={kind} kind={kind} />
          <p className="image-credit">
            Иллюстративные фотографии направлений: Pexels.
          </p>
        </section>
        <section className="contact-section section" id="contact">
          <div>
            <p className="section-label">Давайте знакомиться</p>
            <h2>
              {isArt ? (
                <>
                  Большие открытия
                  <br />
                  начинаются с <em>«привет».</em>
                </>
              ) : (
                <>
                  Увидимся
                  <br />
                  <em>на твоей волне.</em>
                </>
              )}
            </h2>
            <p>
              Напишите или позвоните — расскажем о занятиях
              <br className="desktop-break" /> и поможем выбрать направление.
            </p>
            <div className="contact-actions">
              <a
                href={contact.vk}
                className="button"
                target="_blank"
                rel="noreferrer"
              >
                Написать ВКонтакте
                <ArrowUpRight size={18} />
              </a>
              <a href={"tel:" + contact.tel} className="text-link">
                <Phone size={17} />
                {contact.phone}
              </a>
            </div>
          </div>
          <div className="visit-card">
            <span className="visit-icon">
              <MapPin size={30} />
            </span>
            <h3>{isArt ? "Рыбка" : "stARTup"}</h3>
            <p>
              Лазаревское, Сочи
              <br />
              {isArt ? "переулок Павлова, 2" : "улица Социалистическая, 1"}
            </p>
            <a
              href={
                "https://yandex.ru/maps/?text=" +
                encodeURIComponent(
                  "Лазаревское " +
                    (isArt ? "переулок Павлова 2" : "Социалистическая 1"),
                )
              }
              target="_blank"
              rel="noreferrer"
            >
              Построить маршрут
              <ArrowUpRight size={18} />
            </a>
          </div>
        </section>
        <section className="other-world">
          <Link to={isArt ? "/music" : "/art"}>
            <span>А ещё у нас есть {isArt ? "музыка" : "искусство"}</span>
            <strong>
              {isArt ? "Поймать свою волну" : "Добавить красок"}
              <ArrowUpRight />
            </strong>
          </Link>
        </section>
      </main>
      <Footer />
    </div>
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
        "Рисование, творческие поделки и мастер-классы для детей и родителей в Лазаревском.",
      "/music":
        "Гитара, бас-гитара и барабаны в Лазаревском. Попробуйте музыкальную студию в браузере.",
      "/art/draw":
        "69 настоящих иллюстраций: раскрашивание касанием, сохранение прогресса и экспорт PNG.",
      "/music/studio":
        "Создавайте музыку в NeonDAW: инструменты, ритм, сохранение проекта и экспорт аудио.",
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
        <Studio key="art" kind="art" />
      ) : path === "/music" ? (
        <Studio key="music" kind="music" />
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
            <ArrowUpRight size={18} />
          </Link>
        </main>
      )}
    </Suspense>
  );
}
