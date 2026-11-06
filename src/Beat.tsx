import { useEffect, useRef, useState } from "react";
import "./Beat.css";
const ENGINE = "/TO_startup/engines/music/";

/** Same-origin wrapper: the upstream audio engine and project format stay unchanged. */
export default function Beat({ onBack }: { onBack: () => void }) {
  const [attempt, setAttempt] = useState(0);
  const [status, setStatus] = useState<"loading" | "ready" | "error">(
    "loading",
  );
  const [source, setSource] = useState<string>();
  const frame = useRef<HTMLIFrameElement>(null);
  const shell = useRef<HTMLElement>(null);

  useEffect(() => {
    const controller = new AbortController();
    setSource(undefined);
    setStatus("loading");
    // iframe onError does not reliably report HTTP errors; validate the entry point first.
    fetch(ENGINE, { signal: controller.signal })
      .then(async (response) => {
        const html = await response.text();
        if (
          !response.ok ||
          !html.includes('id="root"') ||
          !html.includes("<title>NeonDAW")
        )
          throw new Error("Missing engine");
        if (!controller.signal.aborted) setSource(ENGINE);
      })
      .catch(() => {
        if (!controller.signal.aborted) setStatus("error");
      });
    const timeout = window.setTimeout(() => {
      setStatus((current) => (current === "loading" ? "error" : current));
      controller.abort();
    }, 25000);
    return () => {
      controller.abort();
      window.clearTimeout(timeout);
    };
  }, [attempt]);

  useEffect(() => {
    if (!source || status !== "loading") return;
    const timer = window.setInterval(() => {
      // Wait for React hydration, rather than hiding the loader on the HTML load event.
      if (
        frame.current?.contentDocument?.getElementById("root")
          ?.childElementCount
      )
        setStatus("ready");
    }, 200);
    return () => window.clearInterval(timer);
  }, [source, status]);

  async function fullscreen() {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else await shell.current?.requestFullscreen();
    } catch {
      // Safari on iPhone has no arbitrary-element fullscreen API; the direct link is available.
      frame.current?.focus();
    }
  }

  return (
    <main ref={shell} className="engine-page">
      <header className="engine-header">
        <button onClick={onBack} aria-label="Закрыть музыкальную студию">
          ← <span>К студии</span>
        </button>
        <strong>
          stARTup <span> / NeonDAW</span>
        </strong>
        <div className="engine-links">
          {document.fullscreenEnabled && (
            <button
              className="engine-fullscreen"
              onClick={fullscreen}
              aria-label="Полноэкранный режим"
            >
              ⛶
            </button>
          )}
          <a
            href={ENGINE}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Открыть музыкальное приложение в отдельной вкладке"
          >
            Открыть отдельно ↗
          </a>
        </div>
      </header>
      <div className="engine-workspace" aria-busy={status === "loading"}>
        {source && status !== "error" && (
          <iframe
            key={attempt}
            ref={frame}
            title="Полная музыкальная студия NeonDAW"
            src={source}
            allow="autoplay; microphone"
            allowFullScreen
            loading="eager"
            onError={() => setStatus("error")}
          />
        )}
        {status === "loading" && (
          <div className="engine-state" role="status">
            <span className="engine-loader" aria-hidden="true" />
            <h1>Загружаем инструменты</h1>
            <p>Музыкальная студия скоро откроется.</p>
          </div>
        )}
        {status === "error" && (
          <div className="engine-state" role="alert">
            <h1>Студия не загрузилась</h1>
            <p>Проверь подключение к интернету и попробуй ещё раз.</p>
            <button onClick={() => setAttempt((value) => value + 1)}>
              Повторить загрузку
            </button>
            <a href={ENGINE} target="_blank" rel="noopener noreferrer">
              Открыть отдельно ↗
            </a>
          </div>
        )}
      </div>
    </main>
  );
}
