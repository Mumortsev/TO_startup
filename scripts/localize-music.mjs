import { readFileSync, writeFileSync, copyFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
const here = dirname(fileURLToPath(import.meta.url));
/** Extend the pinned source's own i18n system; never translate the DOM or persisted project. */
export function localizeMusic(directory) {
  const edit = (path, fn) => {
    const file = join(directory, "src", path);
    writeFileSync(file, fn(readFileSync(file, "utf8")));
  };
  copyFileSync(
    join(here, "music-labels.ts"),
    join(directory, "src/i18n/music-labels.ts"),
  );
  const russian = readFileSync(join(here, "music-ru.ts"), "utf8").replace(
    "export const ru = {",
    "import type {Dict} from './ui';\nexport const ru:Dict = {",
  );
  writeFileSync(join(directory, "src/i18n/music-ru.ts"), russian);
  edit("i18n/ui.ts", (s) => {
    s = "import {ru} from './music-ru';\n" + s;
    s = s.replace(
      "  app: { title: 'NeonDAW · Pocket Web DAW' },",
      "  app: { title: 'NeonDAW · Pocket Web DAW' },\n  label:(text:string)=>text,",
    );
    s = s.replace(
      "  app: { title: 'NeonDAW · 口袋网页 DAW' },",
      "  app: { title: 'NeonDAW · 口袋网页 DAW' },\n  label:(text:string)=>text,",
    );
    const names =
      "{channelRack:'Channel Rack',pianoRoll:'Piano Roll',mixer:'Mixer',synth:'Synth',song:'Song',keyboard:'Live Keys',random:'Random',files:'Files'} as Record<string,string>";
    const chinese =
      "{channelRack:'步进音序器',pianoRoll:'钢琴卷帘',mixer:'混音器',synth:'合成器',song:'编曲',keyboard:'键盘',random:'随机作曲',files:'文件'} as Record<string,string>";
    let count = 0;
    s = s.replaceAll(
      "  modules: {",
      () => `  modules: {\n    name: ${count++ === 0 ? names : chinese},`,
    );
    s = s.replaceAll(
      "lang: { en: 'EN', zh: '中文', aria:",
      "lang: { en: 'EN', zh: '中文', ru:'РУС', aria:",
    );
    s = s.replace(
      "Record<'en' | 'zh', Dict> = { en, zh }",
      "Record<'ru' | 'en' | 'zh', Dict> = { ru, en, zh }",
    );
    return s;
  });
  edit("i18n/lang.ts", (s) =>
    s
      .replace("'en' | 'zh'", "'ru' | 'en' | 'zh'")
      .replace("lang: 'en',", "lang: 'ru',")
      .replace(
        "get().lang === 'en' ? 'zh' : 'en'",
        "get().lang === 'ru' ? 'en' : get().lang === 'en' ? 'zh' : 'ru'",
      ),
  );
  edit("App.tsx", (s) =>
    s.replace(
      "lang === 'zh' ? 'zh-CN' : 'en'",
      "lang === 'ru' ? 'ru' : lang === 'zh' ? 'zh-CN' : 'en'",
    ),
  );
  edit("components/ui/LangToggle.tsx", (s) =>
    s
      .replace("value: 'en' | 'zh'", "value: 'ru' | 'en' | 'zh'")
      .replace(
        "aria-label={t.lang.aria}",
        "aria-label={`${t.lang.aria}: ${label}`}",
      )
      .replace(
        "      {seg('en', t.lang.en)}",
        "      {seg('ru', t.lang.ru)}\n      {seg('en', t.lang.en)}",
      ),
  );
  for (const path of [
    "HomeGrid",
    "SideNav",
    "MobileNavDrawer",
    "ModuleWorkspace",
  ]) {
    edit(`components/layout/${path}.tsx`, (s) =>
      s.replaceAll("m.label", "t.modules.name[m.id]"),
    );
  }
  edit(
    "components/ui/Knob.tsx",
    (s) =>
      "import {useT} from '../../i18n/ui';\n" +
      s.replace(
        "  const dragRef =",
        "  const ui=useT();\n  label=label?ui.label(label):label;\n  const dragRef =",
      ),
  );
  edit("components/Synth/SynthPanel.tsx", (s) => {
    s = s.replace(
      "  return (\n    <section",
      "  const t=useT();\n  title=t.label(title);\n  return (\n    <section",
    );
    s = s.replaceAll(
      '  return (\n    <div className="flex gap-1">',
      '  const ui=useT();\n  return (\n    <div className="flex gap-1">',
    );
    return s
      .replace(
        "title={WAVE_LABELS[w]}",
        "title={ui.label(WAVE_LABELS[w])} aria-label={ui.label(WAVE_LABELS[w])}",
      )
      .replace("{WAVE_LABELS[w]}", "{ui.label(WAVE_LABELS[w])}")
      .replace("key={t.value}", "key={t.value} aria-label={ui.label(t.label)}")
      .replace("{t.label}", "{ui.label(t.label)}");
  });
  edit("components/Mixer/FxPanel.tsx", (s) =>
    s
      .replace("  if (!def.enum)", "  const t=useT();\n  if (!def.enum)")
      .replace("{opt.label}", "{t.label(opt.label)}")
      .replace("{def.label}", "{t.label(def.label)}")
      .replace("            bypass", "            {t.mixer.bypass}")
      .replace(
        "t.mixer.fxChain(track.name,",
        "t.mixer.fxChain(t.label(track.name),",
      ),
  );
  edit("components/ChannelRack/ChannelList.tsx", (s) =>
    s
      .replace("{ch.name}", "{t.label(ch.name)}")
      .replace(
        "{ch.kind === 'drum' ? ch.drumType : 'synth'}",
        "{t.label(ch.kind === 'drum' ? ch.drumType ?? 'drum' : 'synth')}",
      )
      .replace(
        "  const selectedChannelId =",
        "  const t=useT();\n  const selectedChannelId =",
      )
      .replace(
        "Channels · {channels.length}",
        "{t.label('Channels')} · {channels.length}",
      ),
  );
  edit("components/ChannelRack/ChannelRack.tsx", (s) =>
    s.replace(">Pattern</span>", ">{t.channelRack.pattern}</span>"),
  );
  edit("components/PianoRoll/PianoRoll.tsx", (s) =>
    s
      .replace(">Snap</span>", ">{t.label('Snap')}</span>")
      .replace(">Channel</span>", ">{t.synth.channel}</span>")
      .replace("{c.name}", "{t.label(c.name)}"),
  );
  edit("components/Synth/Synth.tsx", (s) =>
    s
      .replace("{cat.label}", "{t.label(cat.label)}")
      .replace("{p.name}", "{t.label(p.name)}")
      .replace("{c.name}", "{t.label(c.name)}")
      .replace("summary={selected.name}", "summary={t.label(selected.name)}")
      .replace(
        "title={lang === 'zh' ? p.blurb : undefined}",
        "title={lang === 'en' ? undefined : t.label(p.blurb)}",
      )
      .replace("{lang === 'zh' && (", "{lang !== 'en' && (")
      .replace("{p.blurb}", "{t.label(p.blurb)}"),
  );
  edit("components/Keyboard/LiveKeys.tsx", (s) =>
    s
      .replace("{p.name}", "{t.label(p.name)}")
      .replace("title={p.blurb}", "title={t.label(p.blurb)}")
      .replace("{c.name}", "{t.label(c.name)}"),
  );
  edit("components/Mixer/ChannelStrip.tsx", (s) =>
    s
      .replace("{track.name}", "{t.label(track.name)}")
      .replace(
        "t.mixer.selectFx(track.name)",
        "t.mixer.selectFx(t.label(track.name))",
      ),
  );
  edit("components/layout/StatusBar.tsx", (s) =>
    s
      .replace(
        "{playMode}",
        "{playMode==='song'?t.topbar.modeSong:t.topbar.modePattern}",
      )
      .replace(
        "PAT · {pattern?.name ?? '—'}",
        "{t.topbar.pattern} · {t.label(pattern?.name ?? '—')}",
      ),
  );
  edit("components/layout/TopBar.tsx", (s) =>
    s.replace(
      "{current?.name ?? t.topbar.pattern}",
      "{t.label(current?.name ?? t.topbar.pattern)}",
    ),
  );
  edit("components/Random/RandomDraw.tsx", (s) =>
    s.replace(">Gacha Compose</h4>", ">{t.label('Gacha Compose')}</h4>"),
  );
  edit("components/Random/StyleGacha.tsx", (s) =>
    s
      .replace(
        "  const Icon = style.icon",
        "  const t=useT();\n  const Icon = style.icon",
      )
      .replace("{style.nameZh}", "{t.label(style.name)}")
      .replace("{style.name}", "{t.label(style.name)}")
      .replace("{ROLE_LABEL[r.role]}", "{t.label(ROLE_LABEL[r.role])}")
      .replace("{f.kind}", "{t.label(f.kind)}")
      .replace("{style.tagline}", "{t.label(style.tagline)}")
      .replace(
        "{style.form.reduce((n, f) => n + f.bars * f.repeat, 0)} b",
        "{t.song.barsUnit(style.form.reduce((n, f) => n + f.bars * f.repeat, 0))}",
      )
      .replace("{f.bars * f.repeat}b", "{t.song.barsUnit(f.bars * f.repeat)}"),
  );
  edit("components/Random/RandomResultCard.tsx", (s) =>
    s
      .replace("{info.styleNameZh}", "{t.label(info.styleName)}")
      .replace("{info.styleName}", "{t.label(info.styleName)}")
      .replace("{info.tagline}", "{t.label(info.tagline)}")
      .replace("{v}", "{t.label(v)}")
      .replace(
        "{r.label} · {r.preset}",
        "{t.label(r.label)} · {t.label(r.preset)}",
      )
      .replace(
        "{s.name} ×{s.bars}b",
        "{t.label(s.name)} {t.song.barsUnit(s.bars)}",
      ),
  );
  // Only error presentation changes; the parsing, validation and export logic stay intact.
  edit("components/Files/Files.tsx", (s) =>
    s
      .replace(
        "err instanceof Error ? err.message : t.files.importFail",
        "t.files.importFail",
      )
      .replace(
        "err instanceof Error ? err.message : t.files.renderFail",
        "t.files.renderFail",
      ),
  );
  edit("components/Random/useGacha.ts", (s) =>
    s.replace(
      "err instanceof Error ? err.message : tRef.current.random.genFail",
      "tRef.current.random.genFail",
    ),
  );
  edit("components/ChannelRack/StepGrid.tsx", (s) => {
    s = "import {useT} from '../../i18n/ui';\n" + s;
    s = s.replace("  const pct =", "  const t=useT();\n  const pct =");
    return s.replace(
      "${useProjectStore.getState().channels.find(channel => channel.id === ch)?.name ?? 'Channel'}: step ${i + 1}",
      "${t.label(useProjectStore.getState().channels.find(channel => channel.id === ch)?.name ?? 'Channel')}: ${t.label('Step')} ${i + 1}",
    );
  });
  edit(
    "components/Random/RhythmPads.tsx",
    (s) =>
      "import {useT} from '../../i18n/ui';\n" +
      s
        .replace("  const [held,", "  const t=useT();\n  const [held,")
        .replace("Lane ${l + 1}", "${t.song.track(l + 1)}"),
  );
  edit("components/Random/RhythmGame.tsx", (s) =>
    s.replace("{label}", "{t.label(label)}"),
  );
  edit(
    "components/Random/RhythmCanvas.tsx",
    (s) =>
      "import {useT} from '../../i18n/ui';\n" +
      s
        .replace(
          "  const wrapRef =",
          "  const t=useT();\n  const labelsRef=useRef({judge:JUDGE_LABEL.map(t.label),combo:t.label('COMBO')});\n  labelsRef.current={judge:JUDGE_LABEL.map(t.label),combo:t.label('COMBO')};\n  const wrapRef =",
        )
        .replace(
          "ctx.fillText(JUDGE_LABEL[fx.tier],",
          "ctx.fillText(labelsRef.current.judge[fx.tier],",
        )
        .replace(
          "ctx.fillText('COMBO',",
          "ctx.fillText(labelsRef.current.combo,",
        ),
  );
  console.log(
    "Applied typed Russian/English/Chinese UI localization; audio/project data unchanged",
  );
}
