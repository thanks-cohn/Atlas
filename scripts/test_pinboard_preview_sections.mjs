import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
class Node{constructor(tag='div'){this.tag=tag;this.children=[];this.attrs={};this.hidden=true;this.value='';}append(...items){this.children.push(...items);}replaceChildren(){this.children=[];}setAttribute(key,value){this.attrs[key]=value;}querySelector(tag){for(const child of this.children){if(child.tag===tag)return child;const found=child.querySelector(tag);if(found)return found;}return null;}focus(){}}
const nodes=new Map(),document={getElementById:id=>{if(!nodes.has(id))nodes.set(id,new Node());return nodes.get(id);},createElement:tag=>new Node(tag)};
let saved=[],swapped=[],fail=false,currentKey='first',value;const candidates=[{id:'a',title:'Another bookmark',url:'https://another.example'}];
const context={document,URL,crypto:{randomUUID:()=> 'note-id'}};vm.runInNewContext(readFileSync('extension/pinboard-preview-sections.js','utf8').replace('export function','function'),context);
const view=context.installPreviewSections({getBookmarks:()=>candidates,onImage:(...args)=>swapped.push(args),save:async(key,action,data)=>{if(fail)throw Error('Save failed');saved.push({key,action,data});value={...value,[action==='note'?'notes':'bookmarks']:[...(value[action==='note'?'notes':'bookmarks'] || []).filter(item=>action!=='note' || item.id!==data.id),data]};view.setContent(key,value);}}),get=id=>document.getElementById('preview-'+id);
value={notes:[{id:'a',title:'A',text:'Full note\nSecond paragraph'}],bookmarks:[{id:'b',url:'https://example.com',title:'Example',image:'https://example.com/image.png'},{url:'javascript:alert(1)'}]};view.setContent(currentKey,value);
get('notes').onclick();assert.equal(get('notes-panel').hidden,false);get('bookmarks').onclick();assert.equal(get('notes-panel').hidden,true);assert.equal(get('bookmarks-panel').hidden,false);
get('bookmarks-panel').children[0].onclick();const focus=get('bookmarks-panel').children[1];assert.equal(focus.children[0].textContent,'Example');focus.children[1].onclick();assert.equal(swapped[0][0],'https://example.com/image.png');const link=focus.children.at(-1);assert.equal(link.target,'_blank');assert.equal(link.rel,'noopener noreferrer');assert.equal(link.href,'https://example.com/');
get('bookmarks-panel').children[0].onclick();let footer=get('bookmarks-panel').children.at(-1),dropup=footer.children[1];footer.children[0].onclick();assert.equal(dropup.hidden,false);const select=dropup.children[1];select.value='a';select.onchange();await dropup.children[2].onclick();assert.equal(saved[0].action,'bookmark');assert.equal(saved[0].data.url,'https://another.example');
get('notes').onclick();get('notes-panel').children[0].children[0].onclick();let form=get('notes-panel').children[0],titleInput=form.children[0].children[0],input=form.children[1].children[0];titleInput.value='My title';titleInput.oninput();input.value='A new note';input.oninput();fail=true;await form.onsubmit({preventDefault(){}});assert.equal(input.value,'A new note');assert.match(form.children[3].textContent,/Save failed/);fail=false;await form.onsubmit({preventDefault(){}});assert.equal(saved.at(-1).action,'note');assert.equal(saved.at(-1).data.text,'A new note');assert.equal(saved.at(-1).data.title,'My title');
get('notes-panel').children.find(node=>node.className==='preview-note').onclick();form=get('notes-panel').children[0];assert.equal(form.tag,'form');assert.equal(form.children[0].children[0].value,'A');assert.equal(form.children[1].children[0].value,'Full note\nSecond paragraph');form.children[0].children[0].value='Edited title';form.children[1].children[0].value='Edited body';await form.onsubmit({preventDefault(){}});assert.equal(saved.at(-1).data.id,'a');assert.equal(saved.at(-1).data.title,'Edited title');assert.equal(saved.at(-1).data.editing,true);assert.equal(get('notes-panel').hidden,false);
view.setContent('second',{available:false});assert.equal(get('notes-panel').hidden,true);assert.equal(get('notes-panel').children[1].textContent,'Notes are unavailable right now.');
const html=readFileSync('extension/pinboard.html','utf8'),css=readFileSync('extension/pinboard.css','utf8');assert.match(html,/▶<\/span>Notes/);assert.match(html,/▶<\/span>Bookmarks/);assert.match(css,/bottom:calc\(100% \+ 8px\)/);
console.log('PASS: exclusive panels, note draft/error/save, existing-bookmark chooser, safe links, focused bookmark image swap and reset.');

const noteCSS=readFileSync('extension/pinboard.css','utf8');
assert.match(noteCSS,/#detail button\.preview-note\{[^}]*height:72px/);
assert.match(noteCSS,/-webkit-line-clamp:2/);
assert(!readFileSync('extension/pinboard-preview-sections.js','utf8').includes('text:draft.text.trim()'));
console.log('PASS: saved notes use compact 72px rows with two-line excerpts; expanded editor preserves original whitespace.');

// Initial gallery hydration must not collapse notes or throw away a typed draft.
value={notes:[],bookmarks:[]};view.setContent('legacy',value);get('notes').onclick();get('notes-panel').children[0].children[0].onclick();form=get('notes-panel').children[0];form.children[0].children[0].value='Still typing';form.children[0].children[0].oninput();form.children[1].children[0].value='Keep this draft';form.children[1].children[0].oninput();
view.setContent('migrated-entry',value,{preserve:true});assert.equal(get('notes-panel').hidden,false);form=get('notes-panel').children[0];assert.equal(form.children[0].children[0].value,'Still typing');assert.equal(form.children[1].children[0].value,'Keep this draft');await form.onsubmit({preventDefault(){}});assert.equal(saved.at(-1).key,'migrated-entry');
console.log('PASS: delayed gallery hydration preserves an open notes panel and typed draft, saving to the resolved image identity.');
let chooserReads=0;const deferredView=context.installPreviewSections({getBookmarks:()=>{chooserReads++;return Array.from({length:5000},(_,index)=>({id:String(index),title:'Fixture '+index,url:'https://fixture.test/'+index}));}});
for(let index=0;index<50;index++)deferredView.setContent('fixture-'+index,{notes:[],bookmarks:[]});
assert.equal(chooserReads,0,'Opening previews must not build a hidden full-library chooser');
const lazyFooter=get('bookmarks-panel').children.at(-1),lazySelect=lazyFooter.children[1].children[1];assert.equal(lazySelect.children.length,0);
lazyFooter.children[0].onclick();assert.equal(chooserReads,1);assert.equal(lazySelect.children.length,5000);lazyFooter.children[0].onclick();lazyFooter.children[0].onclick();assert.equal(chooserReads,1);
console.log('PASS: fifty previews leave the5000-bookmark chooser empty until Add Existing Bookmark is explicitly opened.');
