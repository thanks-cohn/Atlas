// Real rendering and input with explicit synthetic provider APIs. Full MV3 has its own gate.
import assert from "node:assert/strict";
import { createServer } from "node:http";
import { readFile, mkdir } from "node:fs/promises";
import { resolve, extname } from "node:path";
import { installWorkspaceFixture } from "./fixtures/workspace-browser-fixture.mjs";
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
    console.log("SKIP window Chromium: optional Playwright missing.");
    process.exit(0);
  }
  throw error;
}
const root = resolve(process.env.ATLAS_WORKSPACE_ROOT || "extension"),
  output = resolve(
    process.env.ATLAS_WINDOW_EVIDENCE || "/tmp/atlas-window-browser",
  );
await mkdir(output, { recursive: true });
const server = createServer(async (req, res) => {
  try {
    const path = resolve(
      root,
      "." + new URL(req.url, "http://localhost").pathname,
    );
    if (!path.startsWith(root + "/")) {
      res.writeHead(403).end();
      return;
    }
    res.setHeader(
      "Content-Type",
      {
        ".js": "application/javascript",
        ".css": "text/css",
        ".html": "text/html",
      }[extname(path)] || "application/octet-stream",
    );
    res.end(await readFile(path));
  } catch {
    res.writeHead(404).end();
  }
});
await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
const browser = await chromium.launch({
  executablePath: process.env.ATLAS_CHROMIUM_PATH || undefined,
  headless: true,
  args: ["--no-sandbox", "--disable-gpu", "--disable-dev-shm-usage"],
});
const context = await browser.newContext({
  viewport: { width: 1366, height: 768 },
  hasTouch: true,
});
await context.addInitScript(installWorkspaceFixture);
const page = await context.newPage(),
  errors = [];
page.on("pageerror", (error) => errors.push(error.message));
const url = `http://127.0.0.1:${server.address().port}/workspace.html`;
const left = page.locator(".pane").nth(0),
  right = page.locator(".pane").nth(1),
  launcher = page.getByRole("button", {
    name: "Workspace commands",
    exact: true,
  }),
  menu = page.locator(".command-flyout");
async function settle() {
  await page.evaluate(
    () =>
      new Promise((resolve) =>
        requestAnimationFrame(() => requestAnimationFrame(resolve)),
      ),
  );
}
const close = (a, b) => assert(Math.abs(a - b) < 2, `${a} != ${b}`);
async function snapshot() {
  return page.locator(".pane").evaluateAll((nodes) =>
    nodes.map((n) => ({
      width: n.getBoundingClientRect().width,
      upper: n.querySelector(".hierarchy").getBoundingClientRect().height,
      lower: n.querySelector(".viewer").getBoundingClientRect().height,
      provider: n.querySelector(".provider").value,
      query: n.querySelector(".search").value,
      selected: [...n.querySelectorAll('.item[aria-selected="true"]')].map(
        (n) => n.innerText,
      ),
      pin: n
        .querySelector(".viewer-actions>button")
        ?.getAttribute("aria-pressed"),
      scroll: n.querySelector(".viewer-content")?.scrollTop || 0,
      items: n.querySelector(".items").scrollTop,
      breadcrumb: n.querySelector(".breadcrumb").innerText,
    })),
  );
}
async function openCommands() {
  await launcher.click();
  await menu.waitFor({ state: "visible" });
}
try {
  await page.goto(url);
  await left.locator(".items .item").first().waitFor();
  await left.getByLabel("Location provider").selectOption("local");
  await left.locator(".items .item").first().dblclick();
  await left.getByRole("option", { name: "Alpine study.png" }).click();
  await left.locator(".viewer img").waitFor();
  await left.getByRole("button", { name: "Pin Preview", exact: true }).click();
  await right.getByLabel("Location provider").selectOption("objects");
  await right.getByRole("option", { name: "Composition notes" }).click();
  await right.getByRole("tab", { name: "Notes", exact: true }).click();
  await right.getByRole("button", { name: "Pin Preview", exact: true }).click();
  if (process.env.ATLAS_WINDOW_BASELINE) {
    await page.screenshot({ path: output + "/before-1366.png" });
    console.log("PASS baseline capture");
  } else {
    // Unequal custom splits and a scroll position that would otherwise be clamped by expansion.
    await page
      .getByRole("separator", { name: "Left hierarchy height" })
      .focus();
    await page.keyboard.press("ArrowUp");
    await page.keyboard.press("ArrowUp");
    await page
      .getByRole("separator", { name: "Right hierarchy height" })
      .focus();
    await page.keyboard.press("ArrowDown");
    await right.locator(".viewer-content").evaluate((n) => {
      n.firstChild.textContent +=
        "\n\n" +
        Array.from({ length: 45 }, (_, i) => "Saved research line " + i).join(
          "\n",
        );
      n.scrollTop = 180;
    });
    await settle();
    const original = await snapshot(),
      stored = await page.evaluate(
        () =>
          JSON.parse(localStorage.getItem("atlas-test-storage"))[
            "atlas.workspace.layout.v1"
          ],
      );
    const reads = await page.evaluate(
      () => fixtureCalls.filter((c) => c.path === "/v1/read").length,
    );
    await page.screenshot({ path: output + "/normal-1366.png" });
    // Minimize retracts to a title bar; restoring does not reconstruct or reread the viewer.
    await right
      .getByRole("button", { name: "Minimize right viewer", exact: true })
      .click();
    assert((await right.locator(".viewer").boundingBox()).height < 45);
    await right
      .getByRole("button", { name: "Restore right viewer", exact: true })
      .first()
      .click();
    await settle();
    close((await snapshot())[1].scroll, original[1].scroll);
    await left
      .getByRole("button", { name: "Minimize left hierarchy", exact: true })
      .click();
    assert.equal(await left.locator(".hierarchy").isVisible(), false);
    await left
      .getByRole("button", { name: "Restore left hierarchy", exact: true })
      .first()
      .click();
    // One viewer really reaches the viewport top. Commands stay in the other, predetermined column.
    await left
      .getByRole("button", { name: "Maximize left viewer", exact: true })
      .click();
    await settle();
    const maximized = await left.locator(".viewer").boundingBox();
    assert(maximized.y <= 15 && maximized.height > 600);
    const chrome = await page.locator(".workspace-chrome").boundingBox(),
      other = await right.boundingBox();
    assert(chrome.x >= other.x - 2);
    assert(chrome.y + chrome.height <= other.y + 2);
    assert.equal(
      await left
        .getByRole("button", { name: "Restore left viewer", exact: true })
        .isVisible(),
      true,
    );
    await page.screenshot({ path: output + "/one-maximized-1366.png" });
    await right
      .getByRole("button", { name: "Maximize right viewer", exact: true })
      .click();
    await settle();
    assert(
      await page
        .locator("body")
        .evaluate((n) => n.classList.contains("commands-corner")),
    );
    for (const pane of [left, right])
      assert((await pane.locator(".viewer").boundingBox()).y < 16);
    await page.screenshot({ path: output + "/comparison-maximized-1366.png" });
    const edge = await page
      .getByRole("separator", { name: "Pane widths" })
      .boundingBox();
    await page.mouse.move(edge.x + edge.width / 2, edge.y + edge.height / 2);
    await page.mouse.down();
    await page.mouse.move(edge.x + 35, edge.y + edge.height / 2, { steps: 8 });
    await page.mouse.up();
    assert.deepEqual(
      await page.evaluate(
        () =>
          JSON.parse(localStorage.getItem("atlas-test-storage"))[
            "atlas.workspace.layout.v1"
          ],
      ),
      stored,
      "Temporary focused resizing cannot overwrite saved normal-layout preferences",
    );

    // The dock has its own footer slot, remains visible at rest and never covers a pane/scrollbar.
    const dock = await launcher.boundingBox(),
      paneBox = await right.boundingBox();
    assert(dock.y >= paneBox.y + paneBox.height);
    await left
      .getByRole("button", { name: "Restore left viewer", exact: true })
      .focus();
    await page.mouse.move(5, 5);
    await page.waitForTimeout(1600);
    assert(await launcher.isVisible());
    assert(
      Number(await launcher.evaluate((n) => getComputedStyle(n).opacity)) >=
        0.75,
    );
    await openCommands();
    await page.mouse.move(5, 5);
    await page.waitForTimeout(1600);
    assert(await menu.isVisible(), "Focused menu cannot auto-hide");
    const menuBox = await menu.boundingBox();
    await page.mouse.move(menuBox.x + 20, menuBox.y + 20);
    await left
      .getByRole("button", { name: "Restore left viewer", exact: true })
      .focus();
    await page.waitForTimeout(1600);
    assert(await menu.isVisible(), "Hovered menu cannot auto-hide");
    await page.mouse.move(5, 5);
    await page.waitForTimeout(1650);
    assert.equal(
      await menu.isVisible(),
      false,
      "Flyout closes only after pointer and focus leave",
    );
    await openCommands();
    await page.keyboard.press("Escape");
    assert.equal(await menu.isVisible(), false);
    assert(await launcher.evaluate((n) => n === document.activeElement));
    assert(
      await page
        .locator("body")
        .evaluate((n) => n.classList.contains("workspace-focused")),
      "Escape dismisses menu before restoring layout",
    );
    // Dialogs protect the active flyout and current layout from auto-hide/Escape side effects.
    await openCommands();
    await page
      .getByRole("menuitem", { name: "Activity & recovery", exact: true })
      .click();
    await page.getByRole("dialog", { name: "Activity and recovery" }).waitFor();
    await page.waitForTimeout(1600);
    assert(await menu.isVisible());
    await page.keyboard.press("Escape");
    assert.equal(await page.getByRole("dialog").isVisible(), false);
    assert(await menu.isVisible());
    await page.keyboard.press("Escape");
    assert.equal(await menu.isVisible(), false);
    // Explicit Restore restores the exact pre-focus sizes, scroll, pins and selection.
    await openCommands();
    await page
      .getByRole("menuitem", { name: "Restore layout", exact: true })
      .click();
    await settle();
    const restored = await snapshot();
    for (const [i, item] of restored.entries()) {
      close(item.width, original[i].width);
      close(item.upper, original[i].upper);
      close(item.lower, original[i].lower);
      assert.deepEqual(
        { ...item, width: 0, upper: 0, lower: 0 },
        { ...original[i], width: 0, upper: 0, lower: 0 },
      );
    }
    assert.deepEqual(
      await page.evaluate(
        () =>
          JSON.parse(localStorage.getItem("atlas-test-storage"))[
            "atlas.workspace.layout.v1"
          ],
      ),
      stored,
    );
    assert.equal(
      await page.evaluate(
        () => fixtureCalls.filter((c) => c.path === "/v1/read").length,
      ),
      reads,
    );
    // Close removes only the view; Dual Pane reopens either closed column at its old state.
    await right
      .getByRole("button", { name: "Close right pane", exact: true })
      .click();
    assert.equal(await right.isVisible(), false);
    assert((await left.boundingBox()).width > 1000);
    assert(
      await left
        .getByRole("button", { name: "Close left pane", exact: true })
        .isDisabled(),
    );
    await page.getByRole("button", { name: "Dual Pane", exact: true }).click();
    await settle();
    assert.equal((await snapshot())[1].pin, "true");
    close((await snapshot())[1].scroll, original[1].scroll);
    await left
      .getByRole("button", { name: "Close left pane", exact: true })
      .click();
    assert.equal(await left.isVisible(), false);
    await page.getByRole("button", { name: "Dual Pane", exact: true }).click();
    assert(await left.locator(".viewer img").isVisible());
    await right
      .getByRole("button", { name: "Close right viewer", exact: true })
      .click();
    assert.equal(await right.locator(".viewer").isVisible(), false);
    await openCommands();
    await page
      .getByRole("menuitem", { name: "Show content viewers", exact: true })
      .click();
    assert(await right.locator(".viewer").isVisible());
    // Keyboard/touch activation and responsive viewport maximization.
    await launcher.focus();
    await page.keyboard.press("ArrowDown");
    assert(await menu.isVisible());
    await page.keyboard.press("End");
    await page.keyboard.press("Escape");
    await page.setViewportSize({ width: 390, height: 844 });
    await page.emulateMedia({ reducedMotion: "reduce" });
    await right
      .getByRole("button", { name: "Maximize right viewer", exact: true })
      .click();
    await settle();
    assert((await right.locator(".viewer").boundingBox()).y < 12);
    assert(await launcher.isVisible());
    assert(
      await right
        .getByRole("button", { name: "Restore right viewer", exact: true })
        .isVisible(),
    );
    assert(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    );
    await page.screenshot({ path: output + "/maximized-390.png" });
    await launcher.tap();
    assert(await menu.isVisible());
    await page.keyboard.press("Escape");
    await right
      .getByRole("button", { name: "Restore right viewer", exact: true })
      .click();
    await settle();
    assert(await left.isVisible());
    assert(await right.isVisible());
    assert(
      (await page.evaluate(() => fixtureCalls)).every(
        (c) => c.path !== "/v1/operate",
      ),
    );
    assert.deepEqual(errors, []);
    console.log(
      "PASS Chromium " +
        browser.version() +
        ": window controls, viewport maximization, toolbar reflow, mouse/keyboard/touch overflow, delayed dismissal/focus/dialog safety, exact sizes/scroll/pins/selection restore, close/reopen and narrow layout. Synthetic provider transport.",
    );
  }
} catch (error) {
  await page.screenshot({ path: output + "/failure.png" });
  throw error;
} finally {
  await browser.close();
  await new Promise((resolve) => server.close(resolve));
}
