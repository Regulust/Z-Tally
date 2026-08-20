import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");

async function readProjectFile(relativePath) {
  return readFile(resolve(projectRoot, relativePath), "utf8");
}

test("registers the independent round and square routes and release identity", async () => {
  const app = JSON.parse(await readProjectFile("app.json"));
  const pkg = JSON.parse(await readProjectFile("package.json"));
  assert.deepEqual(app.app.version, { code: 28, name: "1.2.0" });
  assert.equal(pkg.version, "1.2.0");
  assert.ok(app.targets.round.module.page.pages.includes("page/round/workout-extension/index.page"));
  assert.ok(app.targets.square.module.page.pages.includes("page/square/workout-extension/index.page"));
});

test("settings pages expose a full interactive navigation row for the extension", async () => {
  const round = await readProjectFile("page/round/settings/index.page.js");
  const square = await readProjectFile("page/square/settings/index.page.js");
  assert.match(round, /createInteractiveRow[\s\S]*page\/round\/workout-extension\/index\.page/);
  assert.match(square, /createInteractiveRow[\s\S]*page\/square\/workout-extension\/index\.page/);
  assert.match(round, /workoutExtensionLabel/);
  assert.match(square, /workoutExtensionLabel/);
  assert.match(round, /this\.addText\(workoutExtensionLabel,[^;]*TYPOGRAPHY\.body,/);
  assert.match(square, /this\.addText\(workoutExtensionLabel,[^;]*, 30,/);
  assert.doesNotMatch(round, /fitTextSize\(workoutExtensionLabel/);
  assert.doesNotMatch(square, /fitTextSize\(workoutExtensionLabel/);
  assert.match(round, /text_style: hmUI\.text_style\.NONE/);
  assert.match(square, /text_style: hmUI\.text_style\.NONE/);
});

test("runtime reader uses the provider contract through read-only share-storage", async () => {
  const storage = await readProjectFile("utils/workout-extension-storage.js");
  assert.match(storage, /from "@zos\/share-storage"/);
  assert.match(storage, /new LocalStorage\(WORKOUT_EXTENSION_APP_ID, WORKOUT_EXTENSION_STORAGE_PATH\)/);
  assert.doesNotMatch(storage, /setItem|removeItem|clear\(/);
});

test("result pages refresh on resume and never touch Z-Tally private state", async () => {
  for (const page of [
    "page/round/workout-extension/index.page.js",
    "page/square/workout-extension/index.page.js",
  ]) {
    const source = await readProjectFile(page);
    assert.match(source, /onResume\(\)/);
    assert.match(source, /readWorkoutExtensionSnapshot\(\)/);
    assert.match(source, /workoutExtensionUnavailable/);
    assert.match(source, /getDateFormat\(\)/);
    assert.match(source, /DATE_FORMAT_DMY/);
    assert.match(source, /DATE_FORMAT_MDY/);
    assert.match(source, /this\.addText\([\s\S]*unavailable,[\s\S]*TYPOGRAPHY\.caption,[\s\S]*hmUI\.text_style\.WRAP/);
    assert.doesNotMatch(source, /fitTextSize\(unavailable/);
    assert.doesNotMatch(source, /saveState|setItem|@zos\/storage|COUNTER_IDS/);
  }
});

test("round and square result layouts retain their respective safe canvases", async () => {
  const round = await readProjectFile("page/round/workout-extension/index.page.js");
  const square = await readProjectFile("page/square/workout-extension/index.page.js");
  assert.match(round, /w: 480,[\s\S]*h: 480/);
  assert.match(round, /72,[\s\S]*336/);
  assert.match(square, /w: 390,[\s\S]*h: 386/);
  assert.match(square, /x: 0,[\s\S]*y: 64/);
});

test("all supported locales include extension UI copy and v1.2.0 about text", async () => {
  const locales = ["en-US", "zh-CN", "zh-TW", "de-DE", "es-ES", "it-IT", "pt-PT", "ru-RU"];
  const requiredKeys = [
    "workoutExtension",
    "workoutExtensionCurrentResult",
    "workoutExtensionUpdatedAt",
    "workoutExtensionLastResult",
    "workoutExtensionResetAt",
    "workoutExtensionUnavailable",
  ];
  for (const locale of locales) {
    const catalog = await readProjectFile(`page/i18n/${locale}.po`);
    requiredKeys.forEach((key) => assert.match(catalog, new RegExp(`msgid "${key}"`)));
    assert.match(catalog, /1\.2\.0/);
    assert.match(catalog, /28/);
  }
  const simplifiedChinese = await readProjectFile("page/i18n/zh-CN.po");
  assert.match(simplifiedChinese, /msgstr "Z-Tally 运动扩展"/);
  assert.match(simplifiedChinese, /可以安装 Z-Tally运动扩展版，此处可以查看其计数结果/);
});

test("changelog records the 1.2.0 read-only Move integration", async () => {
  const changelog = await readProjectFile("CHANGELOG.md");
  assert.match(changelog, /## 1\.2\.0/);
  assert.match(changelog, /version code 28/i);
  assert.match(changelog, /read-only/i);
  assert.match(changelog, /Z-Tally Move/);
});
