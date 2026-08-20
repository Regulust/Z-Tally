import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");

async function readProjectFile(relativePath) {
  return readFile(resolve(projectRoot, relativePath), "utf8");
}

test("registers both routes and the v1.2.1 release identity", async () => {
  const app = JSON.parse(await readProjectFile("app.json"));
  const pkg = JSON.parse(await readProjectFile("package.json"));
  assert.deepEqual(app.app.version, { code: 29, name: "1.2.1" });
  assert.equal(pkg.version, "1.2.1");
  assert.ok(app.targets.round.module.page.pages.includes("page/round/workout-extension/index.page"));
  assert.ok(app.targets.square.module.page.pages.includes("page/square/workout-extension/index.page"));
});

test("settings pages retain the full interactive navigation row", async () => {
  const round = await readProjectFile("page/round/settings/index.page.js");
  const square = await readProjectFile("page/square/settings/index.page.js");
  assert.match(round, /createInteractiveRow[\s\S]*page\/round\/workout-extension\/index\.page/);
  assert.match(square, /createInteractiveRow[\s\S]*page\/square\/workout-extension\/index\.page/);
  assert.match(round, /workoutExtensionLabel/);
  assert.match(square, /workoutExtensionLabel/);
  assert.match(round, /text_style: hmUI\.text_style\.NONE/);
  assert.match(square, /text_style: hmUI\.text_style\.NONE/);
});

test("runtime reader remains read-only share-storage", async () => {
  const storage = await readProjectFile("utils/workout-extension-storage.js");
  assert.match(storage, /from "@zos\/share-storage"/);
  assert.match(storage, /new LocalStorage\(WORKOUT_EXTENSION_APP_ID, WORKOUT_EXTENSION_STORAGE_PATH\)/);
  assert.doesNotMatch(storage, /setItem|removeItem|clear\(/);
});

test("result pages refresh, apply screen-on behavior, and never touch private history", async () => {
  for (const page of [
    "page/round/workout-extension/index.page.js",
    "page/square/workout-extension/index.page.js",
  ]) {
    const source = await readProjectFile(page);
    assert.match(source, /build\(\)[\s\S]*applyStoredScreenBrightTime\(\)/);
    assert.match(source, /onResume\(\)[\s\S]*applyStoredScreenBrightTime\(\)/);
    assert.match(source, /readWorkoutExtensionSnapshot\(\)/);
    assert.match(source, /workoutExtensionUnavailable/);
    assert.match(source, /workoutExtensionCountHistory/);
    assert.match(source, /workoutExtensionNoHistory/);
    assert.match(source, /snapshot\.resetHistory\.forEach/);
    assert.doesNotMatch(source, /saveState|setItem|removeItem|@zos\/storage|COUNTER_IDS/);
  }
});

test("both layouts follow system date/time formats and render two-line reset times", async () => {
  for (const page of [
    "page/round/workout-extension/index.page.js",
    "page/square/workout-extension/index.page.js",
  ]) {
    const source = await readProjectFile(page);
    assert.match(source, /getDateFormat\(\)/);
    assert.match(source, /DATE_FORMAT_DMY/);
    assert.match(source, /DATE_FORMAT_MDY/);
    assert.match(source, /getTimeFormat\(\)/);
    assert.match(source, /TIME_FORMAT_12/);
    assert.match(source, /resetTime\.date/);
    assert.match(source, /resetTime\.time/);
    assert.match(source, /historyCountTextSize/);
    assert.match(source, /text_style: hmUI\.text_style\.NONE/);
  }
});

test("round and square canvases use scroll containers, system scrollbars, and footer safe areas", async () => {
  const round = await readProjectFile("page/round/workout-extension/index.page.js");
  const square = await readProjectFile("page/square/workout-extension/index.page.js");
  assert.match(round, /VIEW_CONTAINER[\s\S]*x: 0,[\s\S]*y: 0,[\s\S]*w: 480,[\s\S]*h: 480/);
  assert.match(round, /createText\(list, title/);
  assert.match(round, /FOOTER_HEIGHT = 132/);
  assert.match(round, /PAGE_SCROLLBAR, \{ target: list \}/);
  assert.match(square, /updateStatusBarTitle/);
  assert.match(square, /VIEW_CONTAINER[\s\S]*x: 0,[\s\S]*y: 64,[\s\S]*w: 390,[\s\S]*h: 386/);
  assert.match(square, /FOOTER_HEIGHT = 104/);
  assert.match(square, /PAGE_SCROLLBAR, \{ target: list \}/);
});

test("maximum-history geometry keeps columns separate and the tenth row above the footer", () => {
  const layouts = [
    {
      viewportHeight: 480,
      historyStart: 304,
      rowHeight: 82,
      rowContentHeight: 64,
      countRight: 68 + 134,
      dateLeft: 220,
      footerHeight: 132,
    },
    {
      viewportHeight: 386,
      historyStart: 224,
      rowHeight: 76,
      rowContentHeight: 60,
      countRight: 24 + 126,
      dateLeft: 170,
      footerHeight: 104,
    },
  ];
  layouts.forEach((layout) => {
    const tenthRowTop = layout.historyStart + 9 * layout.rowHeight;
    const footerTop = layout.historyStart + 10 * layout.rowHeight;
    const contentBottom = footerTop + layout.footerHeight;
    const maximumScroll = contentBottom - layout.viewportHeight;
    assert.ok(layout.countRight < layout.dateLeft, "number and date columns must not overlap");
    assert.ok(tenthRowTop + layout.rowContentHeight <= footerTop, "the tenth row must end before the footer");
    assert.ok(tenthRowTop - maximumScroll >= 0, "the tenth row must remain fully reachable after scrolling");
    assert.ok(tenthRowTop + layout.rowContentHeight - maximumScroll < layout.viewportHeight);
  });
});

test("all eight locales include history copy and v1.2.1 About text", async () => {
  const locales = ["en-US", "zh-CN", "zh-TW", "de-DE", "es-ES", "it-IT", "pt-PT", "ru-RU"];
  const requiredKeys = [
    "workoutExtension",
    "workoutExtensionCurrentResult",
    "workoutExtensionUpdatedAt",
    "workoutExtensionCountHistory",
    "workoutExtensionNoHistory",
    "workoutExtensionUnavailable",
  ];
  for (const locale of locales) {
    const catalog = await readProjectFile(`page/i18n/${locale}.po`);
    requiredKeys.forEach((key) => assert.match(catalog, new RegExp(`msgid "${key}"`)));
    assert.match(catalog, /1\.2\.1/);
    assert.match(catalog, /29/);
  }
  const simplifiedChinese = await readProjectFile("page/i18n/zh-CN.po");
  assert.match(simplifiedChinese, /msgstr "计数历史"/);
  assert.match(simplifiedChinese, /msgstr "暂无计数历史"/);
});

test("changelog records the v1.2.1 read-only Move history integration", async () => {
  const changelog = await readProjectFile("CHANGELOG.md");
  assert.match(changelog, /## 1\.2\.1/);
  assert.match(changelog, /version code 29/i);
  assert.match(changelog, /read-only/i);
  assert.match(changelog, /10 newest reset results/i);
  assert.match(changelog, /Z-Tally Move 1\.0\.0/);
});
