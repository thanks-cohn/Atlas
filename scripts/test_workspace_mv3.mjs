// Requires full Chromium with extension support, not a headless-shell build.
import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
let chromium;
try {
  ({ chromium } = await import(
    process.env.ATLAS_PLAYWRIGHT_MODULE || "playwright"
  ));
} catch (error) {
  if (
    !process.env.ATLAS_PLAYWRIGHT_MODULE &&
    error.code === "ERR_MODULE_NOT_FOUND"
  ) {
    console.log("SKIP MV3: optional Playwright missing.");
    process.exit(0);
  }
  throw error;
}
const profile = await mkdtemp(join(tmpdir(), "atlas-workspace-mv3-"));
const extension = resolve("extension");
let context;
try {
  context = await chromium.launchPersistentContext(profile, {
    channel: process.env.ATLAS_CHROMIUM_PATH ? undefined : "chromium",
    executablePath: process.env.ATLAS_CHROMIUM_PATH || undefined,
    headless: true,
    viewport: { width: 1366, height: 768 },
    args: [
      "--no-sandbox",
      `--disable-extensions-except=${extension}`,
      `--load-extension=${extension}`,
    ],
  });
  let worker = context.serviceWorkers()[0];
  if (!worker) {
    try {
      worker = await context.waitForEvent("serviceworker", { timeout: 8000 });
    } catch (error) {
      if (process.env.ATLAS_REQUIRE_MV3 === "1") throw error;
      console.log(
        "SKIP MV3: supplied Chromium did not start an extension serviceworker. Full Chromium required.",
      );
    }
  }
  if (worker) {
    const origin = worker.url().split("/").slice(0, 3).join("/");
    const folder = await worker.evaluate(async () => {
      const node = await chrome.bookmarks.create({
        title: "Workspace qualification",
      });
      await chrome.bookmarks.create({
        parentId: node.id,
        title: "Verified bookmark",
        url: "https://example.org/atlas-test",
      });
      await chrome.storage.local.set({
        "atlas.workspace.layout.v1": {
          dual: true,
          ratio: 50,
          heights: [55, 55],
        },
      });
      return node;
    });
    const shelf = await context.newPage();
    await shelf.goto(origin + "/explorer.html");
    const opened = context.waitForEvent("page");
    await shelf.locator("#fullpage").click();
    const workspace = await opened;
    await workspace.waitForURL("**/workspace.html");
    await workspace.locator(".pane .item").first().waitFor();
    const left = workspace.locator(".pane").first();
    // Native bookmarks, permissions, storage and the worker are real browser APIs here.
    await workspace.evaluate(async (folder) => {
      const provider = await import("./workspace-providers.js");
      const listing = await provider.listing({
        provider: "bookmarks",
        id: folder.id,
      });
      if (!listing.entries.some((n) => n.name === "Verified bookmark"))
        throw new Error("Native bookmark was not listed");
    }, folder);
    const edge = workspace.getByRole("separator", { name: "Pane widths" }),
      rect = await edge.boundingBox();
    const initial = (await left.boundingBox()).width;
    await workspace.mouse.move(
      rect.x + rect.width / 2,
      rect.y + rect.height / 2,
    );
    await workspace.mouse.down();
    await workspace.mouse.move(rect.x + 70, rect.y + rect.height / 2, {
      steps: 10,
    });
    await workspace.mouse.up();
    assert((await left.boundingBox()).width > initial + 50);
    const saved = await worker.evaluate(
      async () =>
        (await chrome.storage.local.get("atlas.workspace.layout.v1"))[
          "atlas.workspace.layout.v1"
        ],
    );
    assert(saved.ratio > 50);
    for (const href of ["pinboard.html", "page.html", "explorer.html"])
      assert(await workspace.locator(`a[href="${href}"]`).count());
    console.log(
      "PASS real Chromium MV3: installed worker, native bookmarks, actual Shelf launcher, workspace render, edge drag and Chrome storage persistence. No native helper is installed in this isolated profile.",
    );
  }
} finally {
  if (context) await context.close();
  await rm(profile, { recursive: true, force: true });
}
