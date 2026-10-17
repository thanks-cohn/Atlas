"""Durable user library in the existing private companion database.

No caller-selected paths, network fetches or filesystem grants. Image bytes and
page manifests are committed through State's existing SQLite transaction boundary.
"""
import base64
import binascii
import hashlib
import json
import re
from urllib.parse import urlsplit
from .security import APIError

MAX_ASSET = 10 * 1024 * 1024
READ_ACTIONS = frozenset({'location', 'read-page', 'list-pages', 'read-asset'})

def fail(code, message, status=400):
    raise APIError(code, message, status)

def identity(value, page=False):
    if not isinstance(value,str) or not re.fullmatch(r'[a-f0-9-]{36}' if page else r'[a-f0-9]{64}',value):
        fail('LIBRARY_INVALID_ID','Invalid library identifier.')
    return value

def decoded(mime, value):
    if mime not in ('image/png','image/jpeg','image/webp','image/gif') or not isinstance(value,str) or len(value)>((MAX_ASSET+2)//3)*4:
        fail('LIBRARY_INVALID_IMAGE','Use a bounded PNG, JPEG, WebP or GIF image.')
    try: raw=base64.b64decode(value,validate=True)
    except (ValueError,binascii.Error): fail('LIBRARY_INVALID_IMAGE','Invalid image encoding.')
    valid=(mime=='image/png' and raw.startswith(b'\x89PNG\r\n\x1a\n') or mime=='image/jpeg' and raw.startswith(b'\xff\xd8\xff') or mime=='image/webp' and raw[:4]==b'RIFF' and raw[8:12]==b'WEBP' or mime=='image/gif' and raw[:6] in (b'GIF87a',b'GIF89a'))
    if not valid or not raw or len(raw)>MAX_ASSET: fail('LIBRARY_INVALID_IMAGE','Image signature or size does not match its type.')
    return raw

def insert_asset(db,mime,raw):
    ident=hashlib.sha256(raw).hexdigest()
    db.execute('INSERT OR IGNORE INTO library_assets VALUES(?,?,?)',(ident,mime,raw))
    return ident

def read_asset(db,ident):
    identity(ident);row=db.execute('SELECT mime,body FROM library_assets WHERE id=?',(ident,)).fetchone()
    if not row: fail('LIBRARY_ASSET_NOT_FOUND','The saved image is unavailable.',404)
    mime,raw=row
    if hashlib.sha256(raw).hexdigest()!=ident: fail('LIBRARY_CORRUPT','Saved image failed its integrity check.',409)
    return mime,raw

def page_document(db,value):
    if not isinstance(value,dict): fail('LIBRARY_INVALID_PAGE','Expected a page document.')
    value=json.loads(json.dumps(value,allow_nan=False))
    identity(value.get('id'),True)
    if value.get('version')!=1 or value.get('kind')!='page' or value.get('template')!='gallery': fail('LIBRARY_INVALID_PAGE','Unsupported page format or template.')
    if not isinstance(value.get('title'),str) or not value['title'].strip() or len(value['title'])>200 or not isinstance(value.get('text'),str) or len(value['text'])>100000:
        fail('LIBRARY_INVALID_PAGE','Invalid page title or text.')
    if type(value.get('revision')) is not int or value['revision']<1: fail('LIBRARY_INVALID_PAGE','Invalid page revision.')
    images=value.get('images')
    if not isinstance(images,list) or len(images)>24 or len(json.dumps(value,ensure_ascii=False))>4000000: fail('LIBRARY_PAGE_LIMIT','Gallery exceeds its supported size.')
    seen=set()
    for image in images:
        if not isinstance(image,dict) or not isinstance(image.get('id'),str) or not image['id'] or len(image['id'])>128 or image['id'] in seen or not isinstance(image.get('caption'),str) or len(image['caption'])>300: fail('LIBRARY_INVALID_PAGE','Invalid image record.')
        seen.add(image['id']);source=image.get('source')
        if image.get('sourceKind')=='local':
            if not isinstance(source,str) or len(source)>700000: fail('LIBRARY_INVALID_IMAGE','Invalid gallery preview.')
            match=re.fullmatch(r'data:(image/(?:png|jpeg|webp));base64,(.+)',source)
            if not match: fail('LIBRARY_INVALID_IMAGE','Invalid gallery preview.')
            mime,encoded=match.groups();asset=insert_asset(db,mime,decoded(mime,encoded));image['assetId']=asset;image['source']='atlas-local:'+asset
            if image.get('originalAssetId'): read_asset(db,image['originalAssetId'])
        elif image.get('sourceKind')=='url':
            if not isinstance(source,str) or len(source)>8192: fail('LIBRARY_INVALID_IMAGE','Invalid image URL.')
            url=urlsplit(source)
            if url.scheme not in ('http','https') or not url.netloc or url.username or url.password: fail('LIBRARY_INVALID_IMAGE','Use an HTTP(S) image URL without credentials.')
        else: fail('LIBRARY_INVALID_IMAGE','Unsupported image source.')
    binding=value.get('sourceBookmark',{})
    if not isinstance(binding,dict) or not isinstance(binding.get('id',''),str) or len(binding.get('id',''))>128 or not isinstance(binding.get('url',''),str) or len(binding.get('url',''))>8192:
        fail('LIBRARY_INVALID_PAGE','Invalid bookmark association.')
    value.pop('libraryRevision',None);value.pop('libraryLocation',None)
    return value,binding

def hydrated(db,body,revision):
    page=json.loads(body)
    for image in page['images']:
        if image['sourceKind']=='local':
            mime,raw=read_asset(db,image['assetId']);image['source']='data:'+mime+';base64,'+base64.b64encode(raw).decode('ascii')
    page['libraryRevision']=revision
    return page

def dispatch(state,request):
    action=request.get('action')
    if action not in READ_ACTIONS|{'put-asset','save-page'}: fail('LIBRARY_UNSUPPORTED','Unsupported library action.')
    with state.connect() as db:
        db.execute('BEGIN IMMEDIATE')
        db.execute('CREATE TABLE IF NOT EXISTS library_meta(version INTEGER NOT NULL)')
        rows=db.execute('SELECT version FROM library_meta').fetchall()
        if rows and (len(rows)!=1 or rows[0][0]!=1): fail('LIBRARY_UNSUPPORTED_VERSION','A newer library format cannot be modified.')
        if not rows: db.execute('INSERT INTO library_meta VALUES(1)')
        db.execute('CREATE TABLE IF NOT EXISTS library_assets(id TEXT PRIMARY KEY,mime TEXT NOT NULL,body BLOB NOT NULL)')
        db.execute('CREATE TABLE IF NOT EXISTS library_pages(id TEXT PRIMARY KEY,revision INTEGER NOT NULL,body TEXT NOT NULL,bookmark_id TEXT NOT NULL,bookmark_url TEXT NOT NULL)')
        db.execute('CREATE INDEX IF NOT EXISTS library_pages_binding ON library_pages(bookmark_id,bookmark_url)')
        if action=='location': return {'location':str(state.directory),'database':state.path.name,'storage':'SQLite library tables','version':1}
        if action=='put-asset':
            raw=decoded(request.get('mime'),request.get('base64'));ident=insert_asset(db,request['mime'],raw)
            return {'asset':{'id':ident,'mime':request['mime'],'bytes':len(raw)}}
        if action=='read-asset':
            ident=identity(request.get('id'));mime,raw=read_asset(db,ident)
            return {'id':ident,'mime':mime,'base64':base64.b64encode(raw).decode('ascii')}
        if action=='list-pages':
            bid=request.get('bookmarkId');url=request.get('bookmarkUrl')
            if not isinstance(bid,str) or len(bid)>128 or not isinstance(url,str) or len(url)>8192: fail('LIBRARY_INVALID_BINDING','Invalid bookmark binding.')
            rows=db.execute('SELECT id,revision,body FROM library_pages WHERE bookmark_id=? AND bookmark_url=? ORDER BY rowid LIMIT 200',(bid,url)).fetchall()
            return {'pages':[{'id':r[0],'libraryRevision':r[1],'title':json.loads(r[2])['title']} for r in rows]}
        if action=='read-page':
            row=db.execute('SELECT body,revision FROM library_pages WHERE id=?',(identity(request.get('id'),True),)).fetchone()
            if not row: fail('LIBRARY_PAGE_NOT_FOUND','The saved page is unavailable.',404)
            page=hydrated(db,row[0],row[1]);page['libraryLocation']=str(state.directory)
            return {'page':page}
        page,binding=page_document(db,request.get('page'));body=json.dumps(page,ensure_ascii=True,sort_keys=True,separators=(',',':'))
        current=db.execute('SELECT revision,body FROM library_pages WHERE id=?',(page['id'],)).fetchone()
        expected=request.get('expectedRevision')
        if expected is not None and (type(expected) is not int or expected<1): fail('LIBRARY_INVALID_REVISION','Invalid expected revision.')
        if current and current[1]==body: revision=current[0]
        else:
            if current and expected!=current[0]: fail('LIBRARY_EDIT_CONFLICT','The local library has a different saved version. Reload before overwriting.',409)
            if not current and expected is not None: fail('LIBRARY_EDIT_CONFLICT','The previous library version is unavailable.',409)
            revision=current[0]+1 if current else 1
            db.execute('INSERT INTO library_pages VALUES(?,?,?,?,?) ON CONFLICT(id) DO UPDATE SET revision=excluded.revision,body=excluded.body,bookmark_id=excluded.bookmark_id,bookmark_url=excluded.bookmark_url',(page['id'],revision,body,binding.get('id',''),binding.get('url','')))
        return {'libraryRevision':revision,'location':str(state.directory),'database':state.path.name}
