import { dictionaries, type Locale } from "./i18n";
import { routeCopy } from "./route-copy";
import {
  makeRoute,
  subjects,
  type RouteState,
} from "./route-model";

// Canvas uses real, locally hosted fonts rather than a screenshot or a remote image.
// This keeps Cyrillic, Kazakh and Chinese text readable in the downloaded file.
export async function downloadRoute(state: RouteState, locale: Locale) {
  await document.fonts.load("600 28px Manrope");
  await document.fonts.load('400 28px "Ventorme Sans"', "Қазақша маршрут");
  if (locale === "zh")
    await document.fonts.load('600 28px "Ventorme CJK"', "你的路线");
  await document.fonts.ready;
  const c = routeCopy[locale],
    d = dictionaries[locale],
    r = makeRoute(state, locale);
  const canvas = document.createElement("canvas"),
    ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas unavailable");
  canvas.width = 1400;
  canvas.height = 2400;
  const font = 'Manrope, "Ventorme CJK", "Ventorme Sans", sans-serif';
  const wrap = (text: string, size: number, width: number) => {
    ctx.font = `600 ${size}px ${font}`;
    const words = locale === "zh" ? Array.from(text) : text.split(/\s+/),
      lines: string[] = [];
    let line = "";
    for (const word of words) {
      const next = line ? `${line}${locale === "zh" ? "" : " "}${word}` : word;
      if (ctx.measureText(next).width > width && line) {
        lines.push(line);
        line = word;
      } else line = next;
    }
    if (line) lines.push(line);
    return lines;
  };
  const blocks: { text: string; size: number; color: string; gap: number }[] = [
    { text: "VentorMe / 004", size: 32, color: "#3B47FF", gap: 56 },
    { text: c.resultTitle, size: 72, color: "#3B3B3B", gap: 38 },
    { text: `${state.grade} ${c.grade}`, size: 30, color: "#3B47FF", gap: 24 },
    {
      text: `${c.interests}: ${state.interests.map((i) => d.choices.interests[i]).join(", ")}`,
      size: 28,
      color: "#3B3B3B",
      gap: 20,
    },
    {text: `${d.questions.program.title} ${state.program ? d.choices.program[state.program] : "—"}`, size: 28, color: "#3B3B3B", gap: 20},
    {text: `${d.questions.stage.title} ${state.stage ? d.choices.stage[state.stage] : "—"}`, size: 28, color: "#3B3B3B", gap: 20},
    {text: `${d.questions.regions.title} ${state.regions.map(id => d.choices.regions[id]).join(", ")}`, size: 28, color: "#3B3B3B", gap: 20},
    {text: `${d.questions.challenges.title} ${state.challenges.map((id, i) => `${i+1}. ${d.choices.challenges[id]}`).join(" · ")}`, size: 28, color: "#3B3B3B", gap: 20},
    ...(state.program === "ib" && state.ibStatus ? [{text: `${d.common.ibPrompt} ${d.choices.ibStatus[state.ibStatus]}`, size: 28, color: "#3B3B3B", gap: 20}] : []),
    {
      text: state.ib
        ? `${c.selected} (${state.active.toUpperCase()}): ${state[state.active].map((s) => c.subjects[subjects.indexOf(s)]).join(", ") || "—"}`
        : c.generalNote,
      size: 28,
      color: "#3B3B3B",
      gap: 40,
    },
    { text: r.summary, size: 28, color: "#586173", gap: 40 },
    ...r.steps.slice(0, 2).map((t, i) => ({
      text: `0${i + 1}  ${t}`,
      size: 32,
      color: "#3B3B3B",
      gap: 36,
    })),
    { text: c.rules, size: 24, color: "#586173", gap: 16 },
    { text: d.result.disclaimer, size: 24, color: "#586173", gap: 24 },
    { text: "ventorme.ai · team-004", size: 26, color: "#3B47FF", gap: 0 },
  ];
  const height =
    220 +
    blocks.reduce(
      (h, b) => h + wrap(b.text, b.size, 1160).length * b.size * 1.55 + b.gap,
      0,
    );
  canvas.height = Math.ceil(height);
  ctx.fillStyle = "#F8FAFF";
  ctx.fillRect(0, 0, 1400, canvas.height);
  ctx.fillStyle = "#FFFFFF";
  ctx.beginPath();
  ctx.roundRect(48, 48, 1304, canvas.height - 96, 36);
  ctx.fill();
  ctx.fillStyle = "#F5B567";
  ctx.beginPath();
  ctx.roundRect(1160, 80, 100, 14, 7);
  ctx.fill();
  let y = 118;
  for (const b of blocks) {
    ctx.font = `600 ${b.size}px ${font}`;
    ctx.fillStyle = b.color;
    ctx.textBaseline = "top";
    for (const line of wrap(b.text, b.size, 1160)) {
      ctx.fillText(line, 120, y);
      y += b.size * 1.55;
    }
    y += b.gap;
  }
  const blob = await new Promise<Blob>((resolve, reject) =>
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error("PNG encoding failed"))),
      "image/png",
    ),
  );
  const url = URL.createObjectURL(blob),
    a = document.createElement("a");
  a.href = url;
  a.download = `VentorMe-route-${locale}.png`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 30000);
}
