import { lazy, Suspense, useEffect, useRef, useState } from "react";
import {
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
          href={kind ? "#contact" : base + "/art#contact"}
          onClick={() => setOpen(false)}
        >
          Давайте знакомиться
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
      <a href={contact.vk} target="_blank" rel="noreferrer">ВКонтакте</a>
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
    const heroSource = (path === '/art' ? art : music)[0].img;
    heroImage.decoding = 'async';
    heroImage.sizes = '(max-width: 700px) 100vw, 50vw';
    heroImage.srcset = `${heroSource.replace('-1200', '-640')} 640w, ${heroSource} 1200w`;
    heroImage.src = heroSource;
    void heroImage.decode().catch(() => {});

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
function EnrollmentForm() {
  const [attempted, setAttempted] = useState(false);
  return (
    <form className="enrollment-form" onSubmit={(event) => {
      event.preventDefault();
      setAttempted(true);
    }}>
      <label>Имя родителя<input name="parentName" autoComplete="name" required maxLength={100} /></label>
      <label>Телефон<input name="phone" type="tel" autoComplete="tel" inputMode="tel" required minLength={7} maxLength={25} /></label>
      <label>Возраст ребёнка<input name="childAge" type="number" inputMode="numeric" min="1" max="18" step="1" required /></label>
      <p id="enrollment-note">Отправка на почту пока не подключена. Данные из формы не отправляются. Чтобы записаться, позвоните нам.</p>
      <button type="submit" className="button" aria-describedby="enrollment-note">Оставить заявку</button>
      {attempted && <p role="status">Заявка не отправлена: отправка на почту ещё не подключена. Позвоните по номеру ниже.</p>}
    </form>
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
              </a>
              <Link
                to={isArt ? "/art/draw" : "/music/studio"}
                className="text-link"
              >
                {isArt ? "Попробовать раскраску" : "Открыть музыкальную студию"}
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
              Лазаревское
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
                    Подробнее
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
                : "Выбери жанр и нажимай на квадратики. Придумай свой ритм с барабанами, гитарой и басом и скачай готовую музыку."}
            </p>
            <Link to={isArt ? "/art/draw" : "/music/studio"} className="button">
              {isArt ? "Открыть раскраски" : "Открыть секвенсор"}
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
            <EnrollmentForm />
            <div className="contact-actions">
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
            </a>
          </div>
        </section>
        <section className="other-world">
          <Link to={isArt ? "/music" : "/art"}>
            <span>А ещё у нас есть {isArt ? "музыка" : "искусство"}</span>
            <strong>
              {isArt ? "Поймать свою волну" : "Добавить красок"}
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
          </Link>
        </main>
      )}
    </Suspense>
  );
}
