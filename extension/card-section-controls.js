// A small organizational layer around the existing preview rows and editors.
export function createCardSectionControls({ store, getOwner }) {
  const make = (tag, text = "", cls = "") => {
    const e = document.createElement(tag);
    e.textContent = text;
    e.className = cls;
    return e;
  };
  const button = (text, handler, label = text) => {
    const e = make("button", text);
    e.type = "button";
    e.setAttribute("aria-label", label);
    e.onclick = handler;
    return e;
  };
  let key = null,
    owner = null,
    state = null,
    loadError = "",
    epoch = 0,
    redraw = () => {};
  const active = (area) =>
    (state?.document.sections || []).filter(
      (s) => s.area === area && !s.removedAt,
    );
  const label = (s) =>
    state?.names.find((n) => n.id === s.nameId)?.label || "Section";
  async function refresh(token) {
    const next = await store.read(owner);
    if (token !== epoch) return;
    state = next;
    loadError = "";
    redraw();
  }
  async function run(operation, status) {
    const token = epoch,
      focusLabel = document.activeElement?.getAttribute("aria-label");
    try {
      await operation();
      if (token === epoch) {
        await refresh(token);
        if (focusLabel)
          [...document.querySelectorAll("[aria-label]")]
            .find((e) => e.getAttribute("aria-label") === focusLabel)
            ?.focus();
      }
    } catch (error) {
      if (status) status.textContent = error.message;
    }
  }
  function editor(area, section = null) {
    const targetOwner = owner,
      token = epoch,
      dialog = make("dialog", "", "pin-section-editor");
    dialog.setAttribute(
      "aria-label",
      section ? "Rename local Section" : "Add local Section",
    );
    const title = make("h2", section ? "Rename local Section" : "Add Section"),
      help = make("p", "Names are reusable. Contents stay on this Card."),
      controls = make("div", "", "preview-section-actions"),
      body = make("div"),
      status = make("p");
    status.setAttribute("role", "status");
    const close = button("Cancel", () => dialog.close());
    function form(existing) {
      body.replaceChildren();
      const form = make("form"),
        input = make(existing ? "select" : "input"),
        search = make("input");
      input.setAttribute(
        "aria-label",
        existing ? "Existing Section names" : "Section name",
      );
      input.required = true;
      if (existing) {
        search.type = "search";
        search.placeholder = "Find a Section name…";
        search.setAttribute("aria-label", "Search Section names");
        input.size = 6;
        const paint = () => {
          input.replaceChildren();
          for (const n of [...state.names]
            .sort((a, b) =>
              a.label.localeCompare(b.label, undefined, {
                sensitivity: "base",
                numeric: true,
              }),
            )
            .filter((n) =>
              n.key.includes(
                search.value.normalize("NFKC").trim().toLowerCase(),
              ),
            )) {
            const option = make("option", n.label);
            option.value = n.id;
            input.append(option);
          }
        };
        search.oninput = paint;
        paint();
        form.append(search);
      } else {
        input.maxLength = 120;
        input.value = section ? label(section) : "";
      }
      const submit = make("button", section ? "Rename" : "Add Section");
      submit.type = "submit";
      form.append(input, submit);
      body.append(form);
      (existing ? search : input).focus();
      form.onsubmit = async (event) => {
        event.preventDefault();
        if (token !== epoch) {
          dialog.close();
          return;
        }
        submit.disabled = true;
        try {
          if (section) await store.rename(targetOwner, section.id, input.value);
          else
            await store.create(
              targetOwner,
              area,
              existing ? { nameId: input.value } : { label: input.value },
            );
          if (token === epoch) await refresh(token);
          dialog.close();
        } catch (error) {
          status.textContent = error.message;
        } finally {
          submit.disabled = false;
        }
      };
    }
    controls.append(
      button("Create New Section", () => form(false)),
      button("Choose Existing Section", () => form(true)),
    );
    dialog.append(title, help, controls, body, status, close);
    dialog.addEventListener(
      "close",
      () => {
        dialog.remove();
        if (token === epoch)
          document
            .getElementById("preview-" + area + "-panel")
            ?.querySelector(".preview-area-header button")
            ?.focus();
      },
      { once: true },
    );
    document.body.append(dialog);
    dialog.showModal();
    if (section) form(false);
  }
  return {
    setContext(context, callback) {
      redraw = callback;
      const nextOwner = getOwner();
      if (key === context && owner === nextOwner) return;
      key = context;
      owner = nextOwner;
      state = null;
      const token = ++epoch;
      refresh(token).catch((error) => {
        if (token === epoch) {
          loadError = error.message;
          redraw();
        }
      });
    },
    header(area, host) {
      const head = make("div", "", "preview-area-header");
      head.append(make("strong", area[0].toUpperCase()+area.slice(1)));
      const sort = make('select'); sort.setAttribute('aria-label','Sort '+area);
      for (const [value,text] of [['az','A–Z'],['za','Z–A'],['date','Date'],['recent','Recent']]) {
        const option=make('option',text); option.value=value; sort.append(option);
      }
      if (state?.document.sorts?.[area] === 'manual') {const option=make('option','Manual');option.value='manual';sort.append(option);}
      sort.value=state?.document.sorts?.[area] || 'az';
      sort.onchange=()=>run(()=>store.setSort(owner,area,sort.value),feedback);
      head.append(sort);
      const feedback = make("span", loadError, "preview-save-status");
      feedback.setAttribute("role", "status");
      const add = button("+ Section", async () => {
        const token = epoch;
        try {
          await refresh(token);
          if (token === epoch) editor(area);
        } catch (error) {
          feedback.textContent = error.message;
        }
      });
      head.append(add, feedback);
      host.append(head);
    },
    groups(area, host, fixedContext = null) {
      const targetOwner=owner, context=fixedContext || key, entries=[], status=make('p','','preview-save-status');
      status.setAttribute('role','status');
      const root=make('div','','preview-organized-flow'); host.append(root,status);
      const sections=[...active(area)], mode=state?.document.sorts?.[area] || 'az';
      if(mode!=='manual') sections.sort((a,b)=>{
        if(mode==='date'||mode==='recent') {const result=(mode==='recent'?(a.updatedAt || a.createdAt):a.createdAt).localeCompare(mode==='recent'?(b.updatedAt || b.createdAt):b.createdAt);return mode==='recent'?-result:result;}
        const result=label(a).localeCompare(label(b),undefined,{sensitivity:'base',numeric:true});return mode==='za'?-result:result;
      });
      const saved=state?.document.orders?.[JSON.stringify([context,area])] || [];
      const rank=ref=>{const i=saved.findIndex(t=>t.item===ref);return i<0?Number.MAX_SAFE_INTEGER:i;};
      let tokens=[];
      function move(index,direction){
        const next=tokens.map(t=>({...t})), other=index+direction;
        if(other<0||other>=next.length)return;
        [next[index],next[other]]=[next[other],next[index]];
        return run(()=>store.order(targetOwner,area,context,next),status);
      }
      function arrows(wrapper,index,title){
        const controls=make('div','','preview-flow-actions');
        const up=button('↑',()=>move(index,-1),'Move '+title+' up'),down=button('↓',()=>move(index,1),'Move '+title+' down');
        up.disabled=index===0;down.disabled=index===tokens.length-1;controls.append(up,down);wrapper.append(controls);
      }
      function paint(){
        root.replaceChildren(); tokens=[];
        const buckets=new Map([[null,[]],...sections.map(s=>[s.id,[]])]);
        for(const entry of entries){const id=state?.document.memberships[store.reference(context,entry.ref,area)];(buckets.get(id)||buckets.get(null)).push(entry);}
        for(const items of buckets.values()) items.sort((a,b)=>rank(a.ref)-rank(b.ref));
        for(const item of buckets.get(null))tokens.push({item:item.ref});
        for(const section of sections){tokens.push({section:section.id});for(const item of buckets.get(section.id))tokens.push({item:item.ref});}
        let grid;
        function newGrid(){grid=make('div','',area==='images'?'preview-section-items preview-images-grid':'preview-section-items');root.append(grid);}
        newGrid();
        tokens.forEach((token,index)=>{
          if(token.section){
            const section=sections.find(s=>s.id===token.section), head=make('div','','preview-section-divider');
            const title=make('div','','preview-divider-title');title.append(make('h4',label(section)));head.append(title);arrows(head,index,label(section)+' Section');
            head.append(button('Rename',()=>editor(area,section),'Rename '+label(section)+' Section'),button('Remove',()=>run(()=>store.remove(targetOwner,section.id),status),'Remove '+label(section)+' Section; keep contents'));
            root.append(head);newGrid();
          }else{
            const entry=entries.find(e=>e.ref===token.item),wrapper=make('div','','preview-section-item');wrapper.append(entry.row);arrows(wrapper,index,entry.title);grid.append(wrapper);
          }
        });
      }
      paint();
      return (item,row)=>{entries.push({ref:area==='bookmarks'?item.url:item.id,title:item.title||'image',row});paint();};
    },
  };
}
