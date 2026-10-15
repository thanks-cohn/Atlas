#!/usr/bin/env python3
"""Real Chromium DOM + real helper HTTP integration (NOT an MV3 runtime test).

Requires Playwright Python and Chromium. The managed onboarding browser forbids
unpacked extensions. This test therefore injects ONLY chrome.runtime/storage as
an explicitly test-only broker and serves the unchanged UI over local HTTP.
Requests reach the real companion with a paired test origin/token. This proves
UI/filesystem integration, not Chrome worker, CORS, native messaging or policy.
Run: python scripts/browser_smoke.py [--artifacts /tmp/atlas-browser-proof]
"""
import argparse
import functools
import http.server
import hashlib
import json
from pathlib import Path
import shutil
import sys
import tempfile
import threading
import urllib.error
import urllib.request

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / 'src'))
from atlas_companion.server import Server
from atlas_companion.state import State


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--artifacts', type=Path)
    parser.add_argument('--chromium', default=shutil.which('chromium'))
    args = parser.parse_args()
    from playwright.sync_api import sync_playwright, expect
    if not args.chromium:
        raise SystemExit('Chromium missing: pass --chromium /path/to/chromium')
    with tempfile.TemporaryDirectory(prefix='atlas-browser-') as temporary:
        temp = Path(temporary)
        fixture = temp / 'fixture'
        fixture.mkdir()
        (fixture / 'Destination').mkdir()
        content = b'Hello from a real filesystem!'
        (fixture / 'hello.txt').write_bytes(content)
        (fixture / 'drag.txt').write_bytes(b'Internal drag proof')
        (fixture / 'notes.md').write_text('# ATLAS\nVerified local content.')
        state = State(temp / 'state')
        state.grant(str(fixture), 'Design workspace', True)
        ident = 'a' * 32
        token = state.pair(ident)
        server = Server(state, port=0)
        threading.Thread(target=server.serve_forever, daemon=True).start()

        class QuietHandler(http.server.SimpleHTTPRequestHandler):
            def log_message(self, *_):
                pass
        web = http.server.ThreadingHTTPServer(('127.0.0.1', 0), functools.partial(QuietHandler, directory=str(ROOT / 'extension')))
        threading.Thread(target=web.serve_forever, daemon=True).start()

        def broker(_source, message):
            if message['type'] == 'state':
                return {'ok': True, 'paired': False}
            if message['type'] != 'api':
                return {'ok': True}
            body = json.dumps(message['body']).encode() if 'body' in message else None
            request = urllib.request.Request(
                f'http://127.0.0.1:{server.server_port}' + message['path'], data=body,
                headers={'Origin': 'chrome-extension://' + ident, 'Authorization': 'Bearer ' + token, 'Content-Type': 'application/json'})
            try:
                with urllib.request.urlopen(request) as response:
                    return json.load(response)
            except urllib.error.HTTPError as error:
                return json.load(error)

        try:
            with sync_playwright() as p:
                context = p.chromium.launch_persistent_context(str(temp / 'profile'), executable_path=args.chromium, headless=True, args=['--no-sandbox'], viewport={'width': 1366, 'height': 900})
                context.expose_binding('atlasTestBroker', broker)
                context.add_init_script("""
                    const atlasListeners=[];
                    const atlasEmit=(key,oldValue,newValue)=>atlasListeners.forEach(fn=>fn({[key]:{oldValue,newValue}},'session'));
                    window.addEventListener('storage',e=>{if(e.key?.startsWith('atlas-session-'))atlasEmit(e.key.slice(14),JSON.parse(e.oldValue||'null'),JSON.parse(e.newValue||'null'));});
                    window.chrome={
                      runtime:{id:'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',getURL:p=>p,sendMessage:m=>{
                        if(m.type==='state')return Promise.resolve({ok:true,paired:localStorage.getItem('atlas-test-paired')==='yes'});
                        if(m.type==='pair')localStorage.setItem('atlas-test-paired','yes');
                        return window.atlasTestBroker(m);
                      }},
                      storage:{local:{get:async()=>({}),set:async()=>{}},session:{
                        get:async key=>({[key]:JSON.parse(localStorage.getItem('atlas-session-'+key)||'null')}),
                        set:async values=>{for(const [key,value] of Object.entries(values)){const old=JSON.parse(localStorage.getItem('atlas-session-'+key)||'null');localStorage.setItem('atlas-session-'+key,JSON.stringify(value));atlasEmit(key,old,value);}},
                        remove:async key=>{const old=JSON.parse(localStorage.getItem('atlas-session-'+key)||'null');localStorage.removeItem('atlas-session-'+key);atlasEmit(key,old,undefined);}
                      },onChanged:{addListener:fn=>atlasListeners.push(fn)}},tabs:{create:async()=>{}}
                    };
                """)
                page = context.new_page()
                page.on('dialog', lambda dialog: dialog.accept())
                failures = []
                page.on('pageerror', lambda error: failures.append(str(error)))
                page.goto(f'http://127.0.0.1:{web.server_port}/explorer.html')
                page.get_by_role('button', name='Connect companion', exact=True).click()
                page.locator('#token').fill(token)
                page.get_by_role('button', name='Connect securely').click()
                expect(page.locator('#roots .root-open')).to_have_count(1)
                page.locator('#roots .root-open').click()
                expect(page.locator('.file-row')).to_have_count(4)
                page.locator('#roots > .tree-branch > .tree-line > .tree-toggle').click()
                expect(page.locator('#roots > .tree-branch > .tree-children')).to_contain_text('Destination')
                print('PASS lazy authorized directory tree')

                def row(name):
                    return page.locator('.file-row').filter(has=page.locator('.filename', has_text=name))

                def action(name):
                    page.get_by_role('menuitem', name=name, exact=True).click()

                def answer(value):
                    page.locator('#input-value').fill(value)
                    page.locator('#input-form button[type=submit]').click()

                row('notes.md').click()
                page.locator('#search').fill('hello')
                row('hello.txt').click(modifiers=['Shift'])
                expect(page.locator('.file-row.selected')).to_have_count(1)
                page.locator('#search').fill('')
                print('PASS Shift selection after reducing filtered list')
                row('drag.txt').drag_to(row('Destination'))
                expect(page.locator('#notice')).to_contain_text('Copy complete')
                assert (fixture / 'Destination/drag.txt').read_bytes() == b'Internal drag proof'
                assert (fixture / 'drag.txt').read_bytes() == b'Internal drag proof'
                print('PASS confirmed internal drag/drop to authorized folder: exact bytes')
                page.locator('#new-folder').click()
                answer('Inbound')
                expect(row('Inbound')).to_have_count(1)
                assert (fixture / 'Inbound').is_dir()
                row('hello.txt').click(button='right')
                action('Copy to…')
                page.locator('#destination-folders').get_by_role('button', name='▰ Inbound', exact=True).click()
                page.locator('#destination-confirm').click()
                expect(page.locator('#notice')).to_contain_text('Copy complete')
                assert (fixture / 'Inbound/hello.txt').read_bytes() == content
                print('PASS new folder and browsable Copy to destination')
                second = context.new_page()
                second.goto(f'http://127.0.0.1:{web.server_port}/explorer.html')
                second.locator('#roots .root-open').click()
                second.locator('.file-row').filter(has=second.locator('.filename', has_text='Destination')).dblclick()
                row('hello.txt').click(button='right')
                action('Copy')
                expect(second.locator('#paste')).to_be_enabled()
                second.locator('#paste').click()
                expect(second.locator('.file-row').filter(has=second.locator('.filename', has_text='hello.txt'))).to_have_count(1)
                second.close()
                row('Destination').dblclick()
                expect(row('hello.txt')).to_have_count(1)
                assert (fixture / 'Destination/hello.txt').read_bytes() == content
                assert (fixture / 'hello.txt').read_bytes() == content
                print('PASS right-click Copy / Paste across explorer tabs: exact bytes, original unchanged')
                row('hello.txt').click(button='right')
                action('Rename…')
                answer('renamed.txt')
                expect(row('renamed.txt')).to_have_count(1)
                assert not (fixture / 'Destination/hello.txt').exists()
                assert (fixture / 'Destination/renamed.txt').read_bytes() == content
                print('PASS rename: actual filesystem')
                row('renamed.txt').dblclick()
                expect(page.locator('#preview')).to_contain_text(content.decode())
                page.get_by_role('button', name='Compute SHA-256', exact=True).click()
                expect(page.get_by_role('textbox', name='SHA-256 digest', exact=True)).to_have_value(hashlib.sha256(content).hexdigest())
                print('PASS on-demand SHA-256: independently calculated digest')
                page.locator('#close-details').click()
                print('PASS safe text preview')
                row('renamed.txt').click(button='right')
                action('Duplicate…')
                answer('duplicate.txt')
                expect(row('duplicate.txt')).to_have_count(1)
                assert (fixture / 'Destination/duplicate.txt').read_bytes() == content
                print('PASS duplicate: exact bytes')
                row('duplicate.txt').click(button='right')
                action('Move to ATLAS trash')
                expect(row('duplicate.txt')).to_have_count(0)
                assert not (fixture / 'Destination/duplicate.txt').exists()
                page.locator('#undo').click()
                expect(row('duplicate.txt')).to_have_count(1)
                assert (fixture / 'Destination/duplicate.txt').read_bytes() == content
                print('PASS trash and undo: exact bytes restored')
                row('renamed.txt').click(button='right')
                action('Organize · tags & catalogs')
                expect(page.locator('#library-resources')).to_contain_text('renamed.txt')
                page.locator('#library-resources').get_by_role('button', name='Tag', exact=True).click()
                answer('verified')
                expect(page.locator('#library-resources')).to_contain_text('#verified')
                page.locator('#catalog-create').click()
                answer('Research')
                page.locator('#library-resources').get_by_role('button', name='Add to catalog', exact=True).click()
                page.locator('#catalog-filter').select_option(label='Research')
                expect(page.locator('#library-resources')).to_contain_text('renamed.txt')
                page.locator('#catalog-filter').select_option('')
                page.locator('#bookmark-create').click()
                answer('https://example.org/research')
                answer('Research source')
                expect(page.locator('#library-resources')).to_contain_text('Research source')
                local_card = page.locator('.resource-card').filter(has=page.locator('strong', has_text='renamed.txt'))
                local_card.get_by_role('button', name='Select for link', exact=True).click()
                bookmark_card = page.locator('.resource-card').filter(has=page.locator('strong', has_text='Research source'))
                bookmark_card.get_by_role('button', name='Link selected → this', exact=True).click()
                answer('reference-for')
                expect(local_card).to_contain_text('reference-for → Research source')
                page.locator('#library-close').click()
                page.reload()
                page.locator('#library').click()
                expect(page.locator('#library-resources')).to_contain_text('#verified')
                page.locator('#catalog-filter').select_option(label='Research')
                expect(page.locator('#library-resources')).to_contain_text('renamed.txt')
                expect(page.locator('#library-resources')).to_contain_text('reference-for → Research source')
                page.locator('#catalog-filter').select_option('')
                expect(page.locator('#library-resources')).to_contain_text('Research source')
                print('PASS local+bookmark graph/tag/catalog/typed-link persistence across page reload')
                page.locator('#library-close').click()
                page.locator('#roots .root-open').click()
                row('notes.md').click(button='right')
                action('Cut')
                row('Destination').dblclick()
                page.locator('#paste').click()
                expect(row('notes.md')).to_have_count(1)
                assert not (fixture / 'notes.md').exists()
                assert (fixture / 'Destination/notes.md').read_text().startswith('# ATLAS')
                print('PASS Cut / Paste: moved actual file')
                row('duplicate.txt').click(button='right')
                action('Move to ATLAS trash')
                expect(row('duplicate.txt')).to_have_count(0)
                page.reload()
                page.locator('#activity').click()
                page.locator('.activity-result').filter(has_text='duplicate.txt').get_by_role('button', name='Restore to original folder', exact=True).click()
                expect(page.locator('#activity-dialog')).to_contain_text('Restored')
                assert (fixture / 'Destination/duplicate.txt').read_bytes() == content
                page.get_by_role('button', name='Close activity', exact=True).click()
                page.locator('#roots .root-open').click()
                row('Destination').dblclick()
                print('PASS durable Activity restore after page reload: exact bytes')
                if args.artifacts:
                    args.artifacts.mkdir(parents=True, exist_ok=True)
                    page.screenshot(path=str(args.artifacts / 'desktop.png'))
                page.set_viewport_size({'width': 390, 'height': 844})
                assert not page.evaluate('document.body.scrollWidth > innerWidth')
                if args.artifacts:
                    page.screenshot(path=str(args.artifacts / 'narrow.png'))
                assert not failures, failures
                print('PASS 390px layout: no document overflow; no JS page errors')
                print('NOT_RUN actual MV3 worker/CORS/Chrome Native Messaging (managed extension loading policy)')
                context.close()
        finally:
            web.shutdown()
            web.server_close()
            server.shutdown()
            server.server_close()


if __name__ == '__main__':
    main()
