// Organizational metadata only. This store never reads, copies, or deletes content.
export const SECTION_NAMES = "atlas.section-names.v1";
const prefix = "atlas.card-sections.v1:";
export const sectionNameKey = (value) =>
  String(value).normalize("NFKC").trim().replace(/\s+/gu, " ").toLowerCase();
export function createCardSections({
  storage = chrome.storage.local,
  lock = (fn) => navigator.locks.request("atlas-pages-v1", fn),
  uuid = () => crypto.randomUUID(),
} = {}) {
  const documentKey = (owner) => prefix + encodeURIComponent(owner);
  async function read(owner) {
    const key = documentKey(owner),
      saved = await storage.get([SECTION_NAMES, key]);
    return {
      names: saved[SECTION_NAMES] || [],
      document: saved[key] || {
        version: 1,
        owner,
        revision: 0,
        sections: [],
        memberships: {},
        history: [],
      },
    };
  }
  async function change(owner, operation) {
    if (typeof owner !== "string" || !owner) throw Error("Open a Card first.");
    return lock(async () => {
      const state = await read(owner),
        doc = state.document;
      if (doc.version !== 1 || doc.owner !== owner)
        throw Error("Unsupported Section data.");
      const result = operation(state);
      doc.revision++;
      doc.history.push({
        id: uuid(),
        actor: "human",
        at: new Date().toISOString(),
        ...result,
      });
      await storage.set({
        [SECTION_NAMES]: state.names,
        [documentKey(owner)]: doc,
      });
      return result;
    });
  }
  function name(state, label, nameId) {
    if (nameId) {
      if (!state.names.some((n) => n.id === nameId))
        throw Error("That Section name is unavailable.");
      return nameId;
    }
    label = String(label || "")
      .normalize("NFKC")
      .trim()
      .replace(/\s+/gu, " ");
    if (!label || label.length > 120 || /[\x00-\x1f]/u.test(label))
      throw Error("Enter a Section name of 1–120 characters.");
    const key = sectionNameKey(label),
      existing = state.names.find((n) => n.key === key);
    if (existing) return existing.id;
    if (state.names.length >= 5000) throw Error("Section name limit reached.");
    const id = uuid();
    state.names.push({
      id,
      key,
      label,
      createdAt: new Date().toISOString(),
      actor: "human",
    });
    return id;
  }
  function section(doc, id, area) {
    const found = doc.sections.find(
      (s) => s.id === id && !s.removedAt && (!area || s.area === area),
    );
    if (!found) throw Error("This local Section is no longer available.");
    return found;
  }
  const reference = (context, item, area = "notes") =>
    JSON.stringify([context, area, String(item)]);
  return {
    read,
    reference,
    create: (owner, area, options = {}) =>
      change(owner, (state) => {
        if (!["notes", "bookmarks", "images"].includes(area))
          throw Error("Invalid Section area.");
        const nameId = name(state, options.label, options.nameId),
          existing = state.document.sections.find(
            (s) => s.area === area && s.nameId === nameId && !s.removedAt,
          );
        if (existing) return { type: "section-reused", sectionId: existing.id };
        if (state.document.sections.length >= 1000)
          throw Error("Section limit reached.");
        const id = uuid();
        state.document.sections.push({
          id,
          owner,
          area,
          nameId,
          createdAt: new Date().toISOString(),
        });
        return { type: "section-created", sectionId: id, nameId };
      }),
    rename: (owner, id, label) =>
      change(owner, (state) => {
        const s = section(state.document, id),
          before = s.nameId;
        s.nameId = name(state, label);
        s.updatedAt = new Date().toISOString();
        return {
          type: "section-renamed",
          sectionId: id,
          before,
          nameId: s.nameId,
        };
      }),
    move: (owner, id, direction) =>
      change(owner, ({ document: doc }) => {
        const s = section(doc, id),
          peers = doc.sections.filter((x) => x.area === s.area && !x.removedAt),
          from = peers.indexOf(s),
          other = peers[from + (direction < 0 ? -1 : 1)];
        if (other) {
          const a = doc.sections.indexOf(s),
            b = doc.sections.indexOf(other);
          [doc.sections[a], doc.sections[b]] = [
            doc.sections[b],
            doc.sections[a],
          ];
        }
        return { type: "section-reordered", sectionId: id, direction };
      }),
    remove: (owner, id) =>
      change(owner, ({ document: doc }) => {
        const s = section(doc, id);
        s.removedAt = new Date().toISOString();
        const detached = [];
        for (const [key, value] of Object.entries(doc.memberships))
          if (value === id) {
            detached.push(key);
            delete doc.memberships[key];
          }
        return { type: "section-removed", sectionId: id, detached };
      }),
    assign: (owner, area, context, item, id) =>
      change(owner, ({ document: doc }) => {
        if (id) section(doc, id, area);
        const key = reference(context, item, area),
          before = doc.memberships[key] || null;
        if (id) doc.memberships[key] = id;
        else delete doc.memberships[key];
        return {
          type: "section-membership",
          reference: key,
          before,
          sectionId: id || null,
        };
      }),
    setSort: (owner, area, mode) => change(owner, ({document: doc}) => {
      if (!['notes','bookmarks','images'].includes(area) || !['az','za','date','recent'].includes(mode)) throw Error('Invalid sorting option.');
      (doc.sorts ||= {})[area] = mode;
      return {type:'section-sort', area, mode};
    }),
    order: (owner, area, context, tokens) => change(owner, ({document: doc}) => {
      if (!['notes','bookmarks','images'].includes(area)) throw Error('Invalid Section area.');
      const seen = new Set(); let membership = null;
      for (const token of tokens) {
        const ref = JSON.stringify(token);
        if (seen.has(ref)) throw Error('Duplicate organizational reference.');
        seen.add(ref);
        if (token.section) { section(doc, token.section, area); membership = token.section; }
        else {
          const key = reference(context, token.item, area);
          if (membership) doc.memberships[key] = membership; else delete doc.memberships[key];
        }
      }
      (doc.orders ||= {})[JSON.stringify([context,area])] = tokens;
      // Explicit manual arrangement retains the displayed Section order.
      const ids = tokens.filter(t=>t.section).map(t=>t.section);
      const slots = doc.sections.map((s,i)=>ids.includes(s.id)?i:-1).filter(i=>i>=0);
      const ordered = ids.map(id=>section(doc,id,area));
      slots.forEach((slot,i)=>doc.sections[slot]=ordered[i]);
      (doc.sorts ||= {})[area] = 'manual';
      return {type:'section-flow-ordered',area,context,tokens};
    }),
    migrateItem: (owner, area, context, before, after) => change(owner, ({document:doc})=>{
      const old=reference(context,before,area), next=reference(context,after,area);
      if(doc.memberships[old]){doc.memberships[next]=doc.memberships[old];delete doc.memberships[old];}
      const tokens=doc.orders?.[JSON.stringify([context,area])];
      if(tokens)for(const token of tokens)if(token.item===before)token.item=after;
      return {type:'section-item-materialized',area,context,before,after};
    }),
    migrateContext: async (owner, before, after) => {
      if (before === after) return;
      const state = await read(owner);
      if (!state.document.sections.length) return;
      return change(owner, ({ document: doc }) => {
        for (const [key, id] of Object.entries(doc.memberships)) {
          const [context, area, item] = JSON.parse(key);
          if (context === before) {
            doc.memberships[reference(after, item, area)] = id;
            delete doc.memberships[key];
          }
        }
        for(const [key,tokens] of Object.entries(doc.orders || {})){
          const [context,area]=JSON.parse(key);if(context===before){doc.orders[JSON.stringify([after,area])]=tokens;delete doc.orders[key];}
        }
        return { type: "section-context-migrated", before, after };
      });
    },
  };
}
