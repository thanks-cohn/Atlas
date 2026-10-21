import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
const source = await readFile(
  new URL("../extension/card-sections.js", import.meta.url),
  "utf8",
);
const { createCardSections, SECTION_NAMES } = await import(
  "data:text/javascript;base64," + Buffer.from(source).toString("base64")
);
let data = {},
  count = 0,
  queue = Promise.resolve();
const storage = {
  get: async (keys) =>
    Object.fromEntries(keys.map((key) => [key, structuredClone(data[key])])),
  set: async (next) => Object.assign(data, structuredClone(next)),
};
const options = {
  storage,
  uuid: () => String(++count),
  lock: (fn) => {
    const next = queue.then(fn);
    queue = next.catch(() => {});
    return next;
  },
};
let store = createCardSections(options);
const a = await store.create("Card A", "notes", { label: "Architecture" }),
  b = await store.create("Card B", "notes", { label: " architecture " });
assert.notEqual(a.sectionId, b.sectionId);
assert.equal(a.nameId, b.nameId);
assert.equal(data[SECTION_NAMES].length, 1);
await store.create("Card B", "bookmarks", { label: "Zoology" });
await store.create("Card B", "notes", { label: "Art" });
const same = await store.create("Card A", "notes", { nameId: a.nameId });
assert.equal(same.sectionId, a.sectionId);
await store.assign("Card A", "notes", "image-A", "note1", a.sectionId);
await store.assign("Card B", "notes", "image-B", "note2", b.sectionId);
await assert.rejects(
  store.assign("Card B", "notes", "image-B", "note2", a.sectionId),
  /no longer/,
);
await assert.rejects(
  store.assign(
    "Card B",
    "bookmarks",
    "image-B",
    "https://example.com",
    b.sectionId,
  ),
  /no longer/,
);
await store.rename("Card A", a.sectionId, "Buildings");
assert.equal(
  (await store.read("Card B")).document.sections[0].nameId,
  b.nameId,
);
await store.migrateContext("Card A", "image-A", "image-A-entry");
assert.equal(
  (await store.read("Card A")).document.memberships[
    store.reference("image-A-entry", "note1")
  ],
  a.sectionId,
);
await store.remove("Card A", a.sectionId);
store = createCardSections(options);
assert.equal(
  (await store.read("Card A")).document.memberships[
    store.reference("image-A-entry", "note1")
  ],
  undefined,
);
assert.equal(
  (await store.read("Card B")).document.memberships[
    store.reference("image-B", "note2")
  ],
  b.sectionId,
);
assert.ok(
  (await store.read("Card A")).document.history.some(
    (e) => e.type === "section-removed" && e.detached.length === 1,
  ),
);
const art = (await store.read("Card B")).document.sections.find(
  (s) => s.area === "notes" && s.id !== b.sectionId,
);
await store.move("Card B", art.id, -1);
assert.equal((await store.read("Card B")).document.sections[0].id, art.id);
const together = await Promise.all([
  store.create("Card C", "notes", { label: "  ＡＲＣＨＩＴＥＣＴＵＲＥ " }),
  store.create("Card D", "notes", { label: "architecture" }),
]);
assert.equal(together[0].nameId, b.nameId);
assert.equal(together[1].nameId, b.nameId);
assert.notEqual(together[0].sectionId, together[1].sectionId);
await assert.rejects(
  store.create("Card C", "notes", { label: "   " }),
  /Enter/,
);
const unsupportedKey = "atlas.card-sections.v1:" + encodeURIComponent("Future");
data[unsupportedKey] = { version: 2, owner: "Future" };
await assert.rejects(
  store.create("Future", "notes", { label: "Unknown" }),
  /Unsupported/,
);
assert.equal(data[unsupportedKey].version, 2);
const snapshot = structuredClone(data);
storage.set = async () => {
  throw Error("Quota exceeded");
};
await assert.rejects(store.remove("Card B", b.sectionId), /Quota/);
assert.deepEqual(data, snapshot);
console.log(
  "PASS: distinct Card-owned Sections, normalized global names, local rename/reorder/removal, scoped references, context migration, reopen, cross-Card/area rejection and atomic write failure. Content is never passed to this store.",
);
// Ordered flow changes membership only through explicit arrows; sorting is metadata only.
storage.set=async next=>Object.assign(data,structuredClone(next));
const flow=await store.create('Flow','notes',{label:'Research'});
await store.order('Flow','notes','ctx',[{item:'first'},{section:flow.sectionId},{item:'second'}]);
let organized=(await store.read('Flow')).document;
assert.equal(organized.memberships[store.reference('ctx','first')],undefined);
assert.equal(organized.memberships[store.reference('ctx','second')],flow.sectionId);
for(const mode of ['az','za','date','recent'])await store.setSort('Flow','notes',mode);
assert.deepEqual((await store.read('Flow')).document.memberships,organized.memberships);
await store.order('Flow','notes','ctx',[{section:flow.sectionId},{item:'first'},{item:'second'}]);
assert.equal((await store.read('Flow')).document.memberships[store.reference('ctx','first')],flow.sectionId);
await assert.rejects(store.order('Flow','notes','ctx',[{section:b.sectionId},{item:'first'}]),/no longer/);
store=createCardSections(options);
assert.equal((await store.read('Flow')).document.orders['["ctx","notes"]'][1].item,'first');
console.log('PASS: arrow boundary membership, unsectioned items, sorting isolation and durable manual order.');
const imageSection=await store.create('Flow','images',{label:'Research'});
await store.order('Flow','images','parent',[{section:imageSection.sectionId},{item:'legacy'},{item:'image-2'}]);
await store.migrateItem('Flow','images','parent','legacy','image-1');
assert.equal((await store.read('Flow')).document.memberships[store.reference('parent','image-1','images')],imageSection.sectionId);
assert.equal((await store.read('Flow')).document.orders['["parent","images"]'][1].item,'image-1');
await assert.rejects(store.assign('Flow','images','parent','image-1',flow.sectionId),/no longer/);
console.log('PASS: Images share local Sections while retaining area ownership and legacy image identity migration.');
