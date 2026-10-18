"""Installer-owned, separately stored models/engine. Never install from HTTP.

Fixed: pairing, grants, original evidence and explicit inference. Fluid: packaging.
The small helper embeds the engine manifest; it never trusts a sibling checksum
as authority. The engine file tree is verified before installation and execution.
"""
import hashlib
import json
import os
from pathlib import Path, PurePosixPath
import shutil
import sys
import uuid

ENGINE_SPEC = Path(__file__).with_name('tagging-engine.json')
MODEL_SPEC = Path(__file__).with_name('tagging-models.json')


def reparse(path):
    try:
        info=path.lstat()
        return path.is_symlink() or bool(getattr(info,'st_file_attributes',0)&1024)
    except FileNotFoundError:return False


def digest(path):
    with path.open('rb') as handle:return hashlib.file_digest(handle,'sha256').hexdigest()


def valid(path,spec):
    return not reparse(path) and path.is_file() and path.stat().st_size==spec['bytes'] and digest(path)==spec['sha256']


def verify_tree(root,spec):
    if reparse(root) or not root.is_dir():raise ValueError('Engine folder is missing or linked')
    files=spec.get('files',{})
    if spec.get('schema')!=1 or not files or len(files)>10000:raise ValueError('Invalid engine manifest')
    for name,entry in files.items():
        parts=PurePosixPath(name)
        if parts.is_absolute() or '..' in parts.parts or '\\' in name or ':' in name:raise ValueError('Invalid engine member')
        path=root.joinpath(*parts.parts)
        for parent in path.parents:
            if parent==root:break
            if reparse(parent):raise ValueError('Linked engine directory')
        if not valid(path,entry):raise ValueError('Engine verification failed: '+name)
    actual=set()
    for directory,dirs,names in os.walk(root,followlinks=False):
        for name in dirs:
            if reparse(Path(directory)/name):raise ValueError('Linked engine directory')
        actual.update((Path(directory)/name).relative_to(root).as_posix() for name in names)
    if actual!=set(files):raise ValueError('Unlisted engine files are not executable inputs')


def copy_asset(source,target,spec):
    if target.exists() or reparse(target):
        if not valid(target,spec):raise ValueError('Refusing to overwrite modified model: '+target.name)
        return
    if not valid(source,spec):raise ValueError('Model bundle verification failed: '+source.name)
    partial=target.with_name(target.name+'.partial-'+uuid.uuid4().hex)
    try:
        with source.open('rb') as src,partial.open('xb') as dst:
            shutil.copyfileobj(src,dst,1024*1024);dst.flush();os.fsync(dst.fileno())
        if not valid(partial,spec):raise ValueError('Model copy verification failed')
        # Destination is inside an owner-restricted state directory.
        if target.exists() or reparse(target):raise ValueError('Model destination changed during installation')
        os.replace(partial,target)
    finally:partial.unlink(missing_ok=True)


def engine_spec():
    return json.loads(ENGINE_SPEC.read_text(encoding='utf-8'))


def cache_engine(app,spec):
    key=hashlib.sha256(json.dumps(spec,sort_keys=True,separators=(',',':')).encode()).hexdigest()
    return Path(app)/'tagging-runtime'/key


def install_bundle(source,state_dir,app,secure_directory):
    """Called only in the consented Windows installer, not service startup."""
    if not ENGINE_SPEC.is_file():return None # Source/basic helper fixtures have no AI bundle.
    spec=engine_spec();source=Path(source).parent;target=cache_engine(app,spec)
    secure_directory(target.parent)
    if target.exists() or reparse(target):verify_tree(target,spec)
    else:
        src=source/'tagging-engine'
        if not src.exists() and not reparse(src):return None # Core-only install remains fully usable without AI.
        verify_tree(src,spec)
        partial=target.with_name('.engine-'+uuid.uuid4().hex)
        try:
            secure_directory(partial)
            for name,entry in spec['files'].items():
                dest=partial/PurePosixPath(name)
                secure_directory(dest.parent)
                copy_asset(src/PurePosixPath(name),dest,entry)
            verify_tree(partial,spec)
            os.replace(partial,target)
        finally:
            if partial.exists():shutil.rmtree(partial)
    models=Path(state_dir)/'tagging-models';secure_directory(models)
    for entry in json.loads(MODEL_SPEC.read_text(encoding='utf-8')).values():
        copy_asset(source/'tagging-models'/entry['file'],models/entry['file'],entry)
    return str(target/'atlas-tagging-engine.exe')


def engine_command(state):
    if not getattr(sys,'frozen',False):
        return [sys.executable,'-m','atlas_companion.tagging_worker','--state-dir',str(state.directory)]
    spec=engine_spec();app=Path(sys.executable).parent
    cached=cache_engine(app,spec)
    candidate=cached if cached.is_dir() else app/'tagging-engine'
    verify_tree(candidate,spec)
    return [str(candidate/'atlas-tagging-engine.exe'),'--state-dir',str(state.directory)]
