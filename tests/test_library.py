"""Native library persistence, exact bytes and authenticated route boundaries."""
import base64
import copy
import hashlib
import http.client
import json
import tempfile
import threading
import unittest
from pathlib import Path
from atlas_companion.state import State
from atlas_companion.server import Server

class LibraryTests(unittest.TestCase):
    def make_state(self,path): return State(path)
    def close_state(self):
        if hasattr(self.state,"close"): self.state.close()
    def setUp(self):
        self.temp=tempfile.TemporaryDirectory();self.addCleanup(self.temp.cleanup)
        self.root=Path(self.temp.name)/'state';self.state=self.make_state(self.root)
        self.origin='chrome-extension://'+'a'*32;self.token=self.state.pair('a'*32)
        self.addCleanup(self.close_state);self.start();self.addCleanup(self.stop)
    def start(self):
        self.server=Server(self.state,port=0,provider_factory=getattr(self,'provider_factory',None));self.thread=threading.Thread(target=self.server.serve_forever,kwargs={'poll_interval':.01},daemon=True);self.thread.start()
    def stop(self):
        self.server.shutdown();self.server.server_close();self.thread.join(2)
    def call(self,data,token=None):
        conn=http.client.HTTPConnection('127.0.0.1',self.server.server_port,timeout=5)
        try:
            conn.request('POST','/v1/library',json.dumps(data),{'Origin':self.origin,'Authorization':'Bearer '+(token if token is not None else self.token),'Content-Type':'application/json'})
            r=conn.getresponse();return r.status,json.loads(r.read())
        finally:conn.close()
    def page(self):
        return {'version':1,'id':'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa','kind':'page','template':'gallery','title':'My gallery','text':'Notes','revision':1,'images':[{'id':'one','caption':'A','sourceKind':'local','source':'data:image/webp;base64,'+base64.b64encode(b'RIFF\x04\x00\x00\x00WEBPtest').decode()}],'sourceBookmark':{'id':'17','url':'https://example.com/'}}
    def test_unpaired_denied_and_no_ambient_filesystem_access(self):
        self.assertEqual(self.call({'action':'location'},'wrong')[0],401)
        for request in [{'action':'read-page','id':'../../private'}, {'action':'put-asset','mime':'image/svg+xml','base64':base64.b64encode(b'<svg/>').decode()}, {'action':'put-asset','mime':'image/png','base64':'bad!'}, {'action':'unknown','path':'/tmp/arbitrary'}]:
            self.assertGreaterEqual(self.call(request)[0],400)
    def test_bytes_restart_and_chrome_independent_recovery(self):
        raw=b'\x89PNG\r\n\x1a\noriginal bytes\x00\xff';ident=hashlib.sha256(raw).hexdigest()
        status,result=self.call({'action':'put-asset','mime':'image/png','base64':base64.b64encode(raw).decode()});self.assertEqual(status,200);self.assertEqual(result['asset']['id'],ident)
        page=self.page();page['galleryStyle']='nocturne';page['images'][0]['originalAssetId']=ident
        self.assertEqual(self.call({'action':'save-page','page':page,'expectedRevision':None})[0],200)
        self.stop();self.close_state();self.state=self.make_state(self.root);self.start()
        status,result=self.call({'action':'read-page','id':page['id']});self.assertEqual(status,200);self.assertEqual(result['page']['images'][0]['source'],page['images'][0]['source'])
        self.assertEqual(result['page']['galleryStyle'],'nocturne')
        status,result=self.call({'action':'read-asset','id':ident});self.assertEqual(status,200);self.assertEqual(base64.b64decode(result['base64']),raw)
        status,result=self.call({'action':'list-pages','bookmarkId':'17','bookmarkUrl':'https://example.com/'});self.assertEqual(len(result['pages']),1)
        self.assertTrue(self.state.path.is_file())
    def test_revision_conflict_and_safe_idempotent_save(self):
        page=self.page();request={'action':'save-page','page':page,'expectedRevision':None}
        status,result=self.call(request);self.assertEqual(status,200);self.assertEqual(result['libraryRevision'],1)
        self.assertEqual(self.call(request)[1]['libraryRevision'],1)
        changed=copy.deepcopy(page);changed['title']='Changed'
        self.assertEqual(self.call({'action':'save-page','page':changed,'expectedRevision':None})[0],409)
        self.assertEqual(self.call({'action':'save-page','page':changed,'expectedRevision':1})[1]['libraryRevision'],2)
        page['images'][0]['originalAssetId']='f'*64
        self.assertGreaterEqual(self.call({'action':'save-page','page':page,'expectedRevision':2})[0],400)
