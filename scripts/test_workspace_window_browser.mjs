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
  await page.waitForTimeout(160);
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
    // Header reclamation preserves the other section's exact pixel height.
    await left.getByRole('button',{name:'Maximize left hierarchy',exact:true}).click();await settle();
    let next=await snapshot();close(next[0].lower,original[0].lower);assert(next[0].upper>original[0].upper+40);
    close(next[1].upper,original[1].upper);close(next[1].lower,original[1].lower);
    assert(await left.locator('.viewer').isVisible());assert.equal(await launcher.isVisible(),false);
    const chrome=await page.locator('.workspace-chrome').boundingBox(),other=await right.boundingBox();assert(chrome.x>=other.x-2);assert(chrome.y+chrome.height<=other.y+2);
    await page.screenshot({path:output+'/explorer-reclaims-header.png'});
    await page.locator('#restore').click();await settle();assert.deepEqual(await snapshot(),original);
    await left.getByRole('button',{name:'Maximize left viewer',exact:true}).click();await settle();
    next=await snapshot();close(next[0].upper,original[0].upper);assert(next[0].lower>original[0].lower+40);assert(await left.locator('.hierarchy').isVisible());
    assert((await left.boundingBox()).y<=15);assert.equal(await launcher.isVisible(),false);
    await right.getByRole('button',{name:'Maximize right hierarchy',exact:true}).click();await settle();
    assert(await launcher.isVisible());assert(await right.locator('.viewer').isVisible());assert(await left.locator('.hierarchy').isVisible());
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

    await page.screenshot({path:output+'/both-reclaim-header.png'});
    await page.keyboard.press('Escape');await settle();assert.deepEqual(await snapshot(),original);
    // Reorder the actual sections without replacing media/selection or re-reading files.
    const image=await left.locator('.viewer img').elementHandle();
    await left.getByRole('button',{name:'Swap Explorer and Preview vertically in left pane'}).first().click();await settle();
    assert((await left.locator('.viewer').boundingBox()).y<(await left.locator('.hierarchy').boundingBox()).y);
    assert(await image.evaluate(n=>n.isConnected));
    const edge=left.locator('.row-splitter');await edge.focus();await page.keyboard.press('ArrowDown');
    await left.getByRole('button',{name:'Maximize left viewer',exact:true}).click();await settle();assert(await left.locator('.hierarchy').isVisible());
    await page.locator('#restore').click();await settle();assert(await image.evaluate(n=>n.isConnected));
    const leftX=(await left.boundingBox()).x;await page.getByRole('button',{name:'Swap left and right panes',exact:true}).click();await settle();assert((await left.boundingBox()).x>leftX);
    await page.getByRole('button',{name:'Swap left and right panes',exact:true}).click();
    await left.getByRole('button',{name:'Swap Explorer and Preview vertically in left pane'}).first().click();
    await left.getByRole('button',{name:'Swap previews between panes'}).click();await settle();
    assert(await right.locator('.viewer img').isVisible());assert.equal(await left.locator('.viewer img').count(),0);assert(await image.evaluate(n=>n.isConnected));
    await right.getByRole('button',{name:'Maximize right viewer',exact:true}).click();await settle();assert(await right.locator('.hierarchy').isVisible());
    await page.locator('#restore').click();await settle();assert(await right.locator('.viewer img').isVisible());
    await right.getByRole('button',{name:'Swap previews between panes'}).click();await settle();assert(await left.locator('.viewer img').isVisible());
    await left.getByRole('button',{name:'Swap explorers between panes'}).click();await settle();assert(await image.evaluate(n=>n.isConnected));
    await left.getByRole('button',{name:'Swap explorers between panes'}).click();await settle();
    // Explicitly closing the Explorer leaves its Preview alive; Restore reopens it.
    await left.getByRole('button',{name:'Close left hierarchy',exact:true}).click();assert.equal(await left.locator('.hierarchy').isVisible(),false);assert(await image.evaluate(n=>n.isConnected));assert(await left.locator('.viewer').isVisible());
    await page.locator('#restore').click();await settle();assert(await left.locator('.hierarchy').isVisible());
    assert.equal(await page.evaluate(()=>fixtureCalls.filter(c=>c.path==='/v1/read').length),reads);
    await page.locator('#dual').click();await settle();
    const single=page.locator('.pane:not([hidden])');
    await single.getByRole('button',{name:/Maximize .* viewer/,exact:true}).click();await settle();
    assert(await single.locator('.hierarchy').isVisible());assert(await single.locator('.viewer').isVisible());assert.equal(await launcher.isVisible(),false);assert(await page.locator('#restore').isVisible());
    await page.locator('#restore').click();await page.locator('#dual').click();await settle();
    for(const width of [900,390]){await page.setViewportSize({width,height:768});await settle();await left.getByRole('button',{name:'Maximize left viewer',exact:true}).click();await settle();assert(await left.locator('.hierarchy').isVisible());assert(await right.isVisible());assert.equal(await launcher.isVisible(),false);await page.keyboard.press('Escape');}
    assert.deepEqual(errors,[]);
    console.log('PASS Chromium '+browser.version()+': non-destructive upper/lower header reclamation, exact dimensions/selection/pins/scroll restore, both-pane-only floating menu, vertical/side rearrangement, draggable divider, independent Close and retained preview DOM, narrow visibility; synthetic providers.');

  }
} catch (error) {
  await page.screenshot({ path: output + "/failure.png" });
  throw error;
} finally {
  await browser.close();
  await new Promise((resolve) => server.close(resolve));
}
