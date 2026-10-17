import { spawn } from "node:child_process";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import assert from "node:assert/strict";
import { scryptSync, randomBytes } from "node:crypto";
import { chromium } from "playwright";
const cwd = process.cwd(),
  base = "http://127.0.0.1:3100";
const dataDir = await mkdtemp(path.join(tmpdir(), "ventorme-browser-data-")),
  salt = randomBytes(16).toString("hex");
// A disposable test cache avoids stale compiler snapshots across work sessions.
await rm(path.join(cwd, ".next-e2e"), { recursive: true, force: true });
const server = spawn(
  process.execPath,
  [
    "node_modules/next/dist/bin/next",
    "dev",
    "--hostname",
    "127.0.0.1",
    "--port",
    "3100",
  ],
  {
    cwd,
    detached: true,
    env: {
      ...process.env,
      NEXT_TELEMETRY_DISABLED: "1",
      VENTORME_TEST_DIST_DIR: ".next-e2e",
      VENTORME_LOCAL_DATA_DIR: dataDir,
      VENTORME_ADMIN_PASSWORD_HASH: `scrypt:${salt}:${scryptSync("browser-verification-only", salt, 64).toString("hex")}`,
      VENTORME_SESSION_SECRET: randomBytes(48).toString("hex"),
    },
    stdio: ["ignore", "pipe", "pipe"],
  },
);
let logs = "",
  browser,
  expectingSaveFailure = false;
const errors = [],
  events = [],
  report = [];
server.stdout.on("data", (d) => (logs += d));
server.stderr.on("data", (d) => (logs += d));
const ok = (t) => {
  report.push(t);
  console.log("PASS", t);
};
try {
  for (let i = 0; i < 80; i++) {
    if (logs.includes("Ready")) break;
    await new Promise((r) => setTimeout(r, 250));
  }
  if (!logs.includes("Ready")) throw new Error(logs);
  // Compile each boundary before interactions so dev refresh cannot replace a
  // form while the browser is typing. No production requests are made here.
  await Promise.all(["/ru/","/en/","/stats/","/api/admin/session/","/api/stats/","/api/leads/","/api/route-events/","/api/registration-click/"].map(async p=>(await fetch(base+p)).text()));
  browser = await chromium.launch({
    executablePath: process.env.VENTORME_BROWSER_PATH || undefined,
    headless: true,
    args: [
      "--no-sandbox",
      "--disable-dev-shm-usage",
      "--disable-gpu",
      "--disable-software-rasterizer",
      "--disable-gpu-compositing",
      "--no-zygote",
    ],
    env: { ...process.env },
  });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 1000 },
    acceptDownloads: true,
  });
  const page = await context.newPage();
  const recordAutoplay = () => {
    let interacted = false;
    window.__introPlayback = [];
    for (const type of ['pointerdown', 'keydown']) document.addEventListener(type, () => {interacted=true;}, {capture:true});
    document.addEventListener('play', event => {
      const video=event.target;
      if(video instanceof HTMLVideoElement && video.closest('[data-mascot-intro]')) window.__introPlayback.push({unassisted:!interacted,muted:video.muted,inline:video.playsInline});
    }, true);
  };
  await page.addInitScript(recordAutoplay);
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("console", (m) => {
    if (
      m.type() === "error" &&
      !(expectingSaveFailure && m.text().includes("503"))
    )
      errors.push(m.text());
  });
  page.on("request", (r) => {
    if (r.url().includes("/api/route-events/"))
      events.push(JSON.parse(r.postData()));
  });
  await page.goto(base + "/ru/", { waitUntil: "networkidle" });
  await page.waitForTimeout(1800);
  await page.waitForFunction(() => window.__introPlayback?.some(v=>v.unassisted&&v.muted&&v.inline));
  ok('desktop intro autoplays muted before any click or keyboard gesture');
  await page
    .getByRole("button", { name: "Только необходимые", exact: true })
    .click();
  const intro = page.locator('[data-mascot-intro="video"]');
  await intro.waitFor({state: 'visible'});
  if(await intro.locator('video').evaluate(v=>v.ended)) await intro.getByRole('button',{name:'Посмотреть ещё раз',exact:true}).click();
  await page.waitForFunction(() => {const v=document.querySelector('[data-mascot-intro] video'); return v && !v.paused && v.currentTime>0;});
  assert.ok((await intro.boundingBox()).height>=900);
  await intro.getByRole('button',{name:'Пауза видео',exact:true}).click();
  assert.equal(await intro.locator('video').evaluate(v=>v.paused),true);
  await intro.getByRole('button',{name:'Воспроизвести видео',exact:true}).click();
  await page.waitForFunction(() => !document.querySelector('[data-mascot-intro] video').paused);
  await page.screenshot({path:'.test-tools/restored-intro-desktop.png'});
  await page.getByRole('link',{name:'Пропустить интро',exact:false}).click();
  ok('original uploaded video is restored as the first screen, with pause, play and skip');
  const freshMobile=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
  const mobilePage=await freshMobile.newPage();
  await mobilePage.addInitScript(recordAutoplay);
  await mobilePage.goto(base+'/ru/',{waitUntil:'domcontentloaded'});
  await mobilePage.waitForFunction(() => window.__introPlayback?.some(v=>v.unassisted&&v.muted&&v.inline));
  await freshMobile.close();
  ok('fresh mobile session autoplays inline without a tap');
  const reg =
    "https://ventorme.ai/register?utm_source=hacknext&utm_campaign=team-004";
  assert.ok(
    (
      await page
        .locator('a[href*="/register"]')
        .evaluateAll((as) => as.map((a) => a.href))
    ).every((h) => h === reg),
  );
  ok("exact team-004 links");
  await page.getByRole("button", {name: "Повторить сцену", exact: true}).click();
  await page.waitForTimeout(1200);
  const signal = await page.locator("[data-signal]").first().evaluate(el => ({x: Number(el.getAttribute("cx")), opacity: Number(getComputedStyle(el).opacity)}));
  assert.ok(signal.x > 112 && signal.opacity > 0, "a visible signal travels along the actual route");
  await page.screenshot({path: ".test-tools/motion-hero.png", fullPage: false});
  await page.waitForTimeout(3100);
  const settled = await page.locator("[data-node]").evaluateAll(els => els.map(el => getComputedStyle(el).transform));
  await page.waitForTimeout(250);
  assert.deepEqual(await page.locator("[data-node]").evaluateAll(els => els.map(el => getComputedStyle(el).transform)), settled);
  ok("hero replay sends route signals, animates cards, then settles without an endless loop");
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.waitForFunction(() => [...document.querySelectorAll('[data-node], [data-hero-line]')].every(el => !el.style.transform));
  ok("live reduced-motion preference change cleans up active scenes without a reload");
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page
    .getByRole("button", { name: "Включить тёмную тему", exact: true })
    .click();
  assert.equal(
    await page.evaluate(() => document.documentElement.dataset.theme),
    "dark",
  );
  await page
    .getByRole("button", { name: "Включить светлую тему", exact: true })
    .click();
  await page.locator("header select").selectOption("en");
  await page.waitForURL("**/en/");
  await page.waitForFunction(() => document.documentElement.lang === "en" && document.querySelector('header select')?.value === "en");
  await page.locator("header select").selectOption("ru");
  await page.waitForURL("**/ru/");
  await page.waitForFunction(() => document.documentElement.lang === "ru" && document.querySelector('header select')?.value === "ru");
  ok("theme toggle and language selector work through the actual UI");
  await page
    .getByRole("button", { name: "Смотреть видео", exact: true })
    .click();
  await page.waitForFunction(
    () => {
      const v = document.querySelector("dialog video");
      return v && !v.paused && v.currentTime > 0;
    },
    { timeout: 10000 },
  );
  assert.ok(await page.locator("dialog").isVisible());
  await page.keyboard.press("Escape");
  assert.equal(await page.locator("dialog").isVisible(), false);
  ok("original mascot video playback and Escape");
  await page
    .getByRole("button", { name: "Получить мой маршрут", exact: true })
    .first()
    .click();
  await page.locator("#quiz label").nth(1).click();
  await page
    .locator("#quiz")
    .getByRole("button", { name: "Далее", exact: true })
    .click();
  await page.locator("#quiz label").nth(0).click();
  await page.locator("#quiz label").nth(1).click();
  assert.equal(await page.locator("#quiz input:checked").count(), 2);
  await page.locator("#quiz label").nth(7).click();
  assert.equal(await page.locator("#quiz input:checked").count(), 1);
  await page.locator("#quiz label").nth(0).click();
  assert.equal(await page.locator("#quiz input:checked").count(), 1);
  await page
    .locator("#quiz")
    .getByRole("button", { name: "Далее", exact: true })
    .click();
  await page
    .locator("#quiz")
    .getByRole("button", { name: "Назад", exact: true })
    .click();
  assert.equal(await page.locator("#quiz input:checked").count(), 1);
  await page
    .locator("#quiz")
    .getByRole("button", { name: "Далее", exact: true })
    .click();
  await page.locator("#quiz label").nth(1).click();
  await page
    .locator("#quiz")
    .getByRole("button", { name: "Показать мой маршрут", exact: true })
    .click();
  await page.locator("#my-route article").waitFor({ state: "visible" });
  assert.ok(
    (await page.locator("#my-route article").innerText()).includes("11 класс"),
  );
  ok("three questions, multi-select, undecided, back, immediate result");
  const ib = page.locator("#ib-builder");
  await ib.getByRole("button", { name: "Mathematics AA", exact: true }).click();
  await ib.getByRole("button", { name: "Физика", exact: true }).click();
  await ib.getByRole("button", { name: "Химия", exact: true }).click();
  await ib
    .getByRole("button", { name: "Скопировать A в B", exact: true })
    .click();
  await ib.getByRole("button", { name: "Убрано: Химия", exact: true }).click();
  await ib.getByRole("button", { name: "Биология", exact: true }).click();
  const compare = await page.locator("#subject-comparison").innerText();
  assert.match(compare, /Добавлено: Биология/);
  assert.match(compare, /Убрано: Химия/);
  ok("GSAP subject selection and A/B single-subject difference");
  assert.equal(await ib.locator('[data-builder-note] [data-message]').count(),3);
  await page.waitForFunction(() => [...document.querySelectorAll('#ib-builder [data-message-glyph]')].every(el=>Number(getComputedStyle(el).opacity)>0.99));
  await ib.locator('aside').scrollIntoViewIfNeeded();
  await page.screenshot({path:'.test-tools/ib-messages.png'});
  ok('IB guidance appears as readable messages with a short typing reveal');
  await ib.getByRole("button", {name: /Набор A/}).first().click();
  await ib.getByRole("button", {name: /Набор B/}).first().click();
  await page.waitForTimeout(650);
  const contained = await page.locator("[data-flip-id]").evaluateAll(els => els.every(el => {
    const a=el.getBoundingClientRect(), b=el.parentElement.getBoundingClientRect();
    return a.left >= b.left-1 && a.right <= b.right+1;
  }));
  assert.ok(contained, "FLIP cards settle inside their set or pool");
  await page.locator("#my-route").scrollIntoViewIfNeeded();
  const downloadPromise = page.waitForEvent("download");
  await page
    .getByRole("button", { name: "Скачать маршрут в PNG", exact: true })
    .click();
  const download = await downloadPromise;
  await download.saveAs("/tmp/ventorme-route-ru.png");
  ok("PNG download with Cyrillic");
  const form = page.locator("#my-route form");
  await form.getByLabel("Имя", { exact: true }).fill("Проверка маршрута");
  await form.getByLabel("Email", { exact: true }).fill("test@example.invalid");
  await form
    .getByRole("button", { name: "Оставить заявку", exact: true })
    .click();
  assert.equal(
    await page
      .getByText("Заявка сохранена. Твой маршрут доступен для скачивания.", {
        exact: true,
      })
      .count(),
    0,
  );
  await form.getByRole("checkbox").check();
  expectingSaveFailure = true;
  await page.route("**/api/leads/", (route) =>
    route.fulfill({
      status: 503,
      contentType: "application/json",
      body: JSON.stringify({ error: "not_configured" }),
    }),
  );
  await form
    .getByRole("button", { name: "Оставить заявку", exact: true })
    .click();
  await form
    .getByText(
      "Не удалось сохранить заявку. Попробуй позже. Маршрут можно скачать без заявки.",
      { exact: true },
    )
    .waitFor();
  assert.equal(
    await page
      .getByText("Заявка сохранена. Твой маршрут доступен для скачивания.", {
        exact: true,
      })
      .count(),
    0,
  );
  await page.unroute("**/api/leads/");
  expectingSaveFailure = false;
  ok("unconfigured storage displays failure, never fake success");
  const saved = page.waitForResponse(
    (r) => r.url().endsWith("/api/leads/") && r.request().method() === "POST",
  );
  await form
    .getByRole("button", { name: "Оставить заявку", exact: true })
    .click();
  assert.equal((await saved).status(), 201);
  await page
    .getByText("Заявка сохранена. Твой маршрут доступен для скачивания.", {
      exact: true,
    })
    .waitFor();
  ok("separate consent and successful server save");
  assert.equal((await page.request.get(base + "/api/stats/")).status(), 401);
  assert.equal(
    (await page.request.get(base + "/api/registration-click/")).status(),
    401,
  );
  const admin = await context.newPage();
  await admin.goto(base + "/stats/", { waitUntil: "networkidle" });
  await admin
    .getByLabel("Пароль", { exact: true })
    .fill("browser-verification-only");
  await admin.getByRole("button", { name: "Войти", exact: true }).click();
  await admin.getByText("Проверка маршрута", { exact: true }).waitFor();
  await admin.getByText("Проверка маршрута", { exact: true }).click();
  assert.ok(
    (await admin.locator("main").innerText()).includes("test@example.invalid"),
  );
  const stats = await (await admin.request.get(base + "/api/stats/")).json();
  assert.equal(stats.totalLeads, 1);
  assert.equal(stats.funnel.counts.quiz_start, 1);
  assert.equal(stats.funnel.counts.quiz_complete, 1);
  assert.equal(stats.funnel.conversions.resultToLead.rate, 100);
  ok("private panel shows saved lead, route and funnel");
  await admin.getByRole("button", { name: "Выйти", exact: true }).click();
  await admin.getByRole("heading", { name: "Вход администратора" }).waitFor();
  assert.equal((await admin.request.get(base + "/api/stats/")).status(), 401);
  ok("admin logout and API protection");
  await admin.close();
  await page
    .locator("#my-route")
    .getByRole("button", { name: "Изменить ответы", exact: true })
    .click();
  await page.locator("#quiz label").nth(2).click();
  await page
    .locator("#quiz")
    .getByRole("button", { name: "Далее", exact: true })
    .click();
  await page
    .locator("#quiz")
    .getByRole("button", { name: "Далее", exact: true })
    .click();
  await page.locator("#quiz label").nth(3).click();
  await page
    .locator("#quiz")
    .getByRole("button", { name: "Показать мой маршрут", exact: true })
    .click();
  assert.match(await page.locator("#my-route article").innerText(), /12 класс/);
  ok("editing a completed quiz updates the route and retains subject sets");
  const stateBefore = await page.evaluate(() =>
    sessionStorage.getItem("ventorme.route.v2"),
  );
  for (const locale of ["ru", "en", "kk", "uz", "zh", "tr"]) {
    await page.goto(base + "/" + locale + "/", { waitUntil: "networkidle" });
    await page.waitForTimeout(400);
    assert.equal(
      await page.evaluate(() => document.documentElement.lang),
      locale,
    );
    assert.equal(
      await page.evaluate(() => sessionStorage.getItem("ventorme.route.v2")),
      stateBefore,
    );
    for (const width of [320, 390, 768, 1024, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      for (const theme of ["light", "dark"]) {
        await page.evaluate(
          (t) => (document.documentElement.dataset.theme = t),
          theme,
        );
        const dimensions = await page.evaluate(() => ({
          w: innerWidth,
          scroll: document.documentElement.scrollWidth,
        }));
        assert.equal(
          dimensions.scroll,
          dimensions.w,
          `${locale}/${width}/${theme}: overflow`,
        );
      }
    }
    assert.ok(
      (
        await page
          .locator('a[href*="/register"]')
          .evaluateAll((as) => as.map((a) => a.href))
      ).every((h) => h === reg),
    );
    if (locale === "zh") {
      const png = page.waitForEvent("download");
      await page
        .getByRole("button", { name: "下载PNG路线卡", exact: true })
        .click();
      await (await png).saveAs("/tmp/ventorme-route-zh.png");
    }
  }
  ok(
    "all six languages retain answers; both themes and 5 viewport widths have no horizontal scroll",
  );
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(base + "/ru/", { waitUntil: "networkidle" });
  await page.waitForTimeout(1800);
  const mobileIntro=await intro.locator('video').boundingBox();
  assert.ok(mobileIntro.width>300&&mobileIntro.height>100);
  await page.screenshot({path:'.test-tools/restored-intro-mobile.png'});
  await page.screenshot({
    path: "/tmp/ventorme-mobile-result.png",
    fullPage: true,
  });
  await page
    .getByRole("button", { name: "Смотреть видео", exact: true })
    .click();
  await page.waitForTimeout(500);
  assert.ok(await page.locator("dialog video").isVisible());
  await page.keyboard.press("Escape");
  ok("mobile video remains available");
  await page.evaluate(()=>document.documentElement.dataset.theme="dark");
  await page.locator("#my-route").scrollIntoViewIfNeeded();
  await page.screenshot({path:"/tmp/ventorme-dark.png",fullPage:false});
  await page.emulateMedia({ reducedMotion: "reduce" });
  assert.equal(await intro.locator('video').evaluate(v=>v.paused),true);
  await page.waitForFunction(() => [...document.querySelectorAll('[data-node], [data-hero-line]')].every(el => !el.style.transform));
  await page.goto(base + "/ru/", { waitUntil: "networkidle" });
  assert.ok(await page.locator("[data-node], [data-hero-line]").evaluateAll(els => els.every(el => !el.style.transform)), "reduced motion removes GSAP spatial animations");
  await page.locator("#faq summary").first().focus();
  await page.keyboard.press("Enter");
  assert.equal(await page.locator("#faq details").first().getAttribute("open"), "");
  assert.equal(await page.locator("#faq details p").first().evaluate(el=>getComputedStyle(el).animationName), "none");
  await page
    .getByRole("button", { name: "Я не в IB · общий маршрут", exact: true })
    .click();
  assert.equal(
    await ib
      .getByRole("button", { name: "Mathematics AA", exact: true })
      .count(),
    0,
  );
  await page
    .getByRole("button", { name: "Скачать маршрут в PNG", exact: true })
    .click();
  ok("reduced motion and non-IB route remain usable");
  assert.ok(events.length);
  for (const e of events)
    assert.deepEqual(Object.keys(e).sort(), ["event", "journeyId"]);
  ok("analytics event payloads contain no contact or answers");
  assert.deepEqual(errors, []);
  ok("no page or console errors");
  await writeFile(
    "/tmp/ventorme-e2e-result.json",
    JSON.stringify({ passed: report, errors }, null, 2),
  );
} catch (e) {
  console.error(e.message);
  console.error(logs.slice(-1800));
  process.exitCode = 1;
} finally {
  await browser?.close();
  try {
    process.kill(-server.pid, "SIGTERM");
  } catch {}
  await rm(dataDir, { recursive: true, force: true });
}
