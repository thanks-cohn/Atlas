import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
class Node{constructor(){this.children=[];this.attrs={};this.hidden=true;}append(...items){this.children.push(...items);}replaceChildren(){this.children=[];}setAttribute(key,value){this.attrs[key]=value;}scrollIntoView(){this.scrolled=true;}}
const nodes=new Map(),document={getElementById:id=>{if(!nodes.has(id))nodes.set(id,new Node());return nodes.get(id);},createElement:()=>new Node()};
const context={document,URL};vm.runInNewContext(readFileSync('extension/pinboard-preview-sections.js','utf8').replace('export function','function'),context);const view=context.installPreviewSections(),get=id=>document.getElementById('preview-'+id);
view.setContent('first',{notes:[{id:'a',title:'A',text:'Full note\nSecond paragraph'},{id:'a',text:'duplicate'}],bookmarks:[{url:'https://example.com',title:'Example'},{url:'javascript:alert(1)'},{url:'https://u:p@example.com'},{url:'https://example.com/'}]});
assert.equal(get('notes-panel').children.length,1);assert.equal(get('bookmarks-panel').children.length,1);assert.equal(get('notes-panel').hidden,true);
get('notes').onclick();assert.equal(get('notes-panel').hidden,false);assert.equal(get('notes').attrs['aria-expanded'],'true');assert.equal(get('notes-panel').children[0].children[1].textContent,'Full note\nSecond paragraph');
get('bookmarks').onclick();assert.equal(get('notes-panel').hidden,true);assert.equal(get('bookmarks-panel').hidden,false);const link=get('bookmarks-panel').children[0];assert.equal(link.target,'_blank');assert.equal(link.rel,'noopener noreferrer');
view.setContent('first',{bookmarks:[{url:'https://example.org'}]});assert.equal(get('bookmarks-panel').hidden,false,'Same-card refresh retains expansion');get('bookmarks').onclick();assert.equal(get('bookmarks-panel').hidden,true,'Click again collapses');
get('notes').onclick();view.setContent('second',{});assert.equal(get('notes-panel').hidden,true,'New card resets expansion');assert.equal(get('notes-panel').children[0].textContent,'No notes yet.');
const html=readFileSync('extension/pinboard.html','utf8');assert.ok(html.indexOf('id="preview-sections"')>html.indexOf('class="detail-tagging"'));assert.match(html,/id="preview-notes"[^>]*aria-controls="preview-notes-panel"/);
console.log('PASS: exclusive disclosures, same-card refresh, new-card reset, full note text, distinct links, deduplication, unsafe URL rejection and empty states.');
view.setContent('offline',{available:false});assert.equal(get('notes-panel').children[0].textContent,'Notes are unavailable right now.');assert.equal(get('bookmarks-panel').children[0].textContent,'Linked bookmarks are unavailable right now.');
