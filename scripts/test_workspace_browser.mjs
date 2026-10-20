// Real Chromium pointer/layout tests with synthetic provider/Chrome APIs.
// Optional dependency: ATLAS_PLAYWRIGHT_MODULE and ATLAS_CHROMIUM_PATH; no runtime app dependency.
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
    console.log(
      "SKIP workspace Chromium checks: install optional Playwright or set ATLAS_PLAYWRIGHT_MODULE.",
    );
    process.exit(0);
  }
  throw error;
}
const root = resolve(process.env.ATLAS_WORKSPACE_ROOT || "extension");
const output = resolve(
  process.env.ATLAS_WORKSPACE_EVIDENCE || "/tmp/atlas-workspace-browser",
);
await mkdir(output, { recursive: true });
const server = createServer(async (req, res) => {
  try {
    const path = resolve(
      root,
      "." + decodeURIComponent(new URL(req.url, "http://localhost").pathname),
    );
    if (!path.startsWith(root + "/")) {
      res.writeHead(403).end();
      return;
    }
    const data = await readFile(path);
    res.setHeader(
      "Content-Type",
      {
        ".html": "text/html",
        ".css": "text/css",
        ".js": "application/javascript",
      }[extname(path)] || "application/octet-stream",
    );
    res.end(data);
  } catch {
    res.writeHead(404).end();
  }
});
await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
const browser = await chromium.launch({
  executablePath: process.env.ATLAS_CHROMIUM_PATH || undefined,
  headless: true,
  args: ["--no-sandbox", "--disable-dev-shm-usage", "--disable-gpu"],
});
const context = await browser.newContext({
  viewport: { width: 1366, height: 768 },
  hasTouch: true,
});
const page = await context.newPage();
const errors = [];
page.on("pageerror", (e) => errors.push(e.message));
await page.context().addInitScript(installWorkspaceFixture);
const url = `http://127.0.0.1:${server.address().port}/workspace.html`;
const left = page.locator(".pane").nth(0),
  right = page.locator(".pane").nth(1);
const close = (a, b, tolerance = 3) =>
  assert(Math.abs(a - b) < tolerance, `${a} should equal ${b}`);
async function drag(locator, dx, dy) {
  const b = await locator.boundingBox();
  assert(b, "Visible edge required");
  await page.mouse.move(b.x + b.width / 2, b.y + b.height / 2);
  await page.mouse.down();
  await page.mouse.move(b.x + b.width / 2 + dx, b.y + b.height / 2 + dy, {
    steps: 12,
  });
  await page.mouse.up();
}
try {
  await page.goto(url);
  await left.locator(".item").first().waitFor();
  if (process.env.ATLAS_WORKSPACE_BASELINE) {
    await left.getByLabel("Location provider").selectOption("local");
    await left.locator(".item").first().dblclick();
    await left.getByRole("option", { name: "Alpine study.png" }).click();
    await left
      .getByRole("button", { name: "Pin Preview", exact: true })
      .click();
    await right.getByLabel("Location provider").selectOption("objects");
    await right.getByRole("option", { name: "Composition notes" }).click();
    await right
      .getByRole("button", { name: "Pin Preview", exact: true })
      .click();
    await page.screenshot({ path: output + "/before-1366.png" });
    console.log("Baseline actual Chromium capture complete");
  } else {
    const widthBefore = (await left.boundingBox()).width;
    await drag(page.getByRole("separator", { name: "Pane widths" }), 75, 0);
    assert((await left.boundingBox()).width > widthBefore + 60);
    const leftHeightBefore = (await left.locator(".hierarchy").boundingBox())
      .height;
    const rightHeightBefore = (await right.locator(".hierarchy").boundingBox())
      .height;
    await drag(
      page.getByRole("separator", { name: "Left hierarchy height" }),
      0,
      45,
    );
    assert(
      (await left.locator(".hierarchy").boundingBox()).height >
        leftHeightBefore + 35,
    );
    close(
      (await right.locator(".hierarchy").boundingBox()).height,
      rightHeightBefore,
    );
    await drag(
      page.getByRole("separator", { name: "Right hierarchy height" }),
      0,
      -35,
    );
    const saved = await page.evaluate(
      () =>
        JSON.parse(localStorage.getItem("atlas-test-storage"))[
          "atlas.workspace.layout.v1"
        ],
    );
    assert(saved.heights[0] > saved.heights[1]);
    const touchEdge = await page
      .getByRole("separator", { name: "Right hierarchy height" })
      .boundingBox();
    const cdp = await context.newCDPSession(page);
    const x = touchEdge.x + touchEdge.width / 2,
      y = touchEdge.y + touchEdge.height / 2;
    await cdp.send("Input.dispatchTouchEvent", {
      type: "touchStart",
      touchPoints: [{ x, y }],
    });
    await cdp.send("Input.dispatchTouchEvent", {
      type: "touchMove",
      touchPoints: [{ x, y: y + 12 }],
    });
    await cdp.send("Input.dispatchTouchEvent", {
      type: "touchEnd",
      touchPoints: [],
    });
    assert(
      Number(
        await page
          .getByRole("separator", { name: "Right hierarchy height" })
          .getAttribute("aria-valuenow"),
      ) > saved.heights[1],
    );
    await page.reload();
    await left.locator(".item").first().waitFor();
    close(
      Number(
        await page
          .getByRole("separator", { name: "Pane widths" })
          .getAttribute("aria-valuenow"),
      ),
      Math.round(saved.ratio),
    );
    close(
      Number(
        await page
          .getByRole("separator", { name: "Left hierarchy height" })
          .getAttribute("aria-valuenow"),
      ),
      Math.round(saved.heights[0]),
    );
    await page.getByRole("separator", { name: "Pane widths" }).focus();
    await page.keyboard.press("ArrowLeft");
    assert(
      Number(
        await page
          .getByRole("separator", { name: "Pane widths" })
          .getAttribute("aria-valuenow"),
      ) < saved.ratio,
    );
    await page.getByRole("separator", { name: "Pane widths" }).dblclick();
    assert.equal(
      await page
        .getByRole("separator", { name: "Pane widths" })
        .getAttribute("aria-valuenow"),
      "50",
    );
    // Two independently pinned, real-rendered content viewers.
    await left.getByLabel("Location provider").selectOption("local");
    await left.locator(".item").first().dblclick();
    await left.getByRole("option", { name: "Alpine study.png" }).click();
    await left.locator(".viewer img").waitFor();
    await left
      .getByRole("button", { name: "Pin Preview", exact: true })
      .click();
    await right.getByLabel("Location provider").selectOption("objects");
    await right.getByRole("option", { name: "Composition notes" }).click();
    await right.getByRole("tab", { name: "Notes", exact: true }).click();
    await right
      .getByRole("button", { name: "Pin Preview", exact: true })
      .click();
    await page.screenshot({ path: output + "/after-1366.png" });
    await page.setViewportSize({ width: 900, height: 768 });
    await page.screenshot({ path: output + "/comparison-900.png" });
    await page.setViewportSize({ width: 390, height: 844 });
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.screenshot({ path: output + "/comparison-390.png" });
    assert(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    );
    await page.setViewportSize({ width: 1366, height: 768 });

    const before = await left.locator(".hierarchy").boundingBox();
    await page
      .getByRole("button", { name: "Expand viewers", exact: true })
      .first()
      .click();
    assert.equal(await left.locator(".hierarchy").isVisible(), false);
    assert.equal(await right.locator(".viewer").isVisible(), true);
    await page.getByRole("button", { name: "Restore layout" }).click();
    close(
      (await left.locator(".hierarchy").boundingBox()).height,
      before.height,
    );
    await page
      .getByRole("button", { name: "Expand hierarchies", exact: true })
      .click();
    assert.equal(await left.locator(".viewer").isVisible(), false);
    await page.keyboard.press("Escape");
    assert.equal(await left.locator(".viewer").isVisible(), true);
    await right.getByRole("button", { name: "Maximize" }).click();
    assert.equal(await left.isVisible(), false);
    await page.getByRole("button", { name: "Restore layout" }).click();
    assert.equal(await left.locator(".viewer img").isVisible(), true);
    await left.getByRole("option", { name: "Field notes.txt" }).click();
    assert.equal(
      await left.locator(".viewer img").isVisible(),
      true,
      "Pin survives selecting another item",
    );
    await left
      .getByRole("button", { name: "Unpin Preview", exact: true })
      .click();
    await left.getByRole("option", { name: "Field notes.txt" }).click();
    await left.locator(".viewer pre").waitFor();
    await left
      .getByRole("option", { name: "Field notes.txt" })
      .click({ button: "right" });
    await page
      .getByRole("menuitem", { name: "Properties", exact: true })
      .click();
    assert.equal(
      await left
        .getByRole("tab", { name: "Details", exact: true })
        .getAttribute("aria-selected"),
      "true",
    );
    // Large lists have bounded DOM and preserve provider identities.
    await left.getByLabel("Location provider").selectOption("bookmarks");
    await left.getByRole("option", { name: "Research" }).dblclick();
    assert.equal(await left.locator(".items .item").count(), 200);
    await left.getByRole("button", { name: "Next page" }).click();
    assert.equal(await left.locator(".items .item").count(), 60);
    await left.locator(".search").fill("Alpine");
    assert.equal(await left.locator(".items .item").count(), 1);
    await left.locator(".items .item").click();
    await left.getByRole("tab", { name: "Preview", exact: true }).click();
    await left.locator(".viewer img").waitFor();
    await left
      .getByRole("option", { name: "Alpine study" })
      .click({ button: "right" });
    await page.keyboard.press("Escape");
    assert.equal(await page.getByRole("menu").count(), 0);
    await left.getByRole("option", { name: "Alpine study" }).focus();
    await page.keyboard.press("Control+a");
    assert(
      (await left.locator(".list-status").innerText()).includes("1 selected"),
    );
    // Full ancestor breadcrumbs and back/forward shortcuts.
    assert(
      (await left.locator(".breadcrumb").innerText()).includes("Research"),
    );
    await page.keyboard.press("Alt+ArrowLeft");
    await left.getByRole("option", { name: "Research" }).waitFor();
    await left.getByLabel("Location provider").selectOption("r2");
    await left
      .getByText(/R2 browsing and transfers are not implemented/)
      .waitFor();
    await page.evaluate(() => (globalThis.fixtureDenied = true));
    await left.getByLabel("Location provider").selectOption("local");
    await left.getByText(/Permission revoked/).waitFor();
    assert(
      (await page.evaluate(() => fixtureCalls)).every(
        (c) => c.path !== "/v1/operate",
      ),
    );
    await page.setViewportSize({ width: 900, height: 768 });
    await page.screenshot({ path: output + "/narrow-900.png" });
    assert(await left.isVisible());
    assert(await right.isVisible());
    await page.setViewportSize({ width: 390, height: 844 });
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.screenshot({ path: output + "/narrow-390.png" });
    assert(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    );
    const shelf = await page.context().newPage();
    await shelf.goto(url.replace("workspace.html", "explorer.html"));
    const popupPromise = shelf.waitForEvent("popup", { timeout: 8000 });
    await shelf.locator("#fullpage").click();
    const workspaceTab = await popupPromise;
    await workspaceTab.waitForURL("**/workspace.html");
    await workspaceTab.locator(".pane .item").first().waitFor();
    await shelf.close();
    await workspaceTab.close();
    assert.deepEqual(errors, []);
    console.log(
      "PASS Chromium " +
        browser.version() +
        ": actual edge drags, independent heights/persistence, keyboard/reset, 2x2/pins, expansions/restore, bounded image/text viewers, menu, 200-row pagination, breadcrumbs, unsupported/denied and narrow rendering. Synthetic provider transport; MV3/native integration separate.",
    );
  }
} finally {
  await browser.close();
  await new Promise((resolve) => server.close(resolve));
}
