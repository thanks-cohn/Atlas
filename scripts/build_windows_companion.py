#!/usr/bin/env python3
"""Small helper + reusable onedir AI engine/models; build only on Windows."""
import hashlib
import importlib.metadata
import json
from pathlib import Path
import platform
import shutil
import subprocess
import sys

ROOT=Path(__file__).resolve().parents[1]

def sha(path):
    with path.open('rb') as stream:return hashlib.file_digest(stream,'sha256').hexdigest()


def main():
    if sys.platform!='win32':raise SystemExit('Build this target on Windows')
    if importlib.metadata.version('pyinstaller')!='6.16.0':raise SystemExit('Use pinned PyInstaller==6.16.0')
    from prepare_tagging_models import prepare
    output=ROOT/'dist/windows';output.mkdir(parents=True,exist_ok=True)
    rich = '--rich-tagging' in sys.argv[1:]
    prepare(output/'tagging-models', keys=('anime','anime_labels') if rich else None)
    model_manifest = ROOT/'src/atlas_companion/tagging-models.json'
    profile_manifest = ROOT/'src/atlas_companion/tagging-profile.json'
    if rich:
        from prepare_rich_tagging_models import prepare as prepare_rich
        prepare_rich(output/'tagging-models')
        generated = ROOT/'build/windows/rich'; generated.mkdir(parents=True, exist_ok=True)
        legacy = json.loads(model_manifest.read_text())
        combined = {**{key:legacy[key] for key in ('anime','anime_labels')}, **json.loads((ROOT/'src/atlas_companion/tagging-models-rich.json').read_text())}
        allowed={spec['file'] for spec in combined.values()}
        for stale in (output/'tagging-models').iterdir():
            if stale.is_file() and stale.name not in allowed: stale.unlink()
        model_manifest = generated/'tagging-models.json'
        model_manifest.write_text(json.dumps(combined, indent=2), encoding='utf-8')
        profile_manifest = generated/'tagging-profile.json'
        profile_manifest.write_text(json.dumps({'profile':'rich','status':'candidate; representative-image and owner acceptance required'}), encoding='utf-8')
    common=[sys.executable,'-m','PyInstaller','--noconfirm','--clean','--noupx','--paths',str(ROOT/'src'),
            '--distpath',str(output),'--workpath',str(ROOT/'build/windows'),'--specpath',str(ROOT/'build/windows')]
    if rich: common += ['--exclude-module','atlas_companion.people_tags']
    model_data=['--add-data',str(model_manifest)+';atlas_companion',
                '--add-data',str(profile_manifest)+';atlas_companion',
                '--add-data',str(ROOT/'src/atlas_companion/tagging-models-rich.json')+';atlas_companion']
    subprocess.run(common+['--onedir','--name','atlas-tagging-engine','--collect-all','onnxruntime',
        '--collect-all','cv2','--collect-all','PIL',*model_data,str(ROOT/'packaging/tagging_engine_entry.py')],check=True)
    engine=output/'tagging-engine'
    if engine.exists():shutil.rmtree(engine)
    (output/'atlas-tagging-engine').rename(engine)
    engine_spec={'schema':1,'files':{p.relative_to(engine).as_posix():{'sha256':sha(p),'bytes':p.stat().st_size}
                                  for p in sorted(engine.rglob('*')) if p.is_file()}}
    spec_path=ROOT/'build/windows/tagging-engine.json';spec_path.write_text(json.dumps(engine_spec,sort_keys=True),encoding='utf-8')
    subprocess.run(common+['--onefile','--name','atlas-companion',
        '--collect-submodules','atlas_companion','--collect-submodules','atlas_native','--collect-submodules','atlas_core',
        '--exclude-module','onnxruntime','--exclude-module','numpy','--exclude-module','cv2','--exclude-module','PIL',
        *model_data,'--add-data',str(spec_path)+';atlas_companion',
        '--hidden-import','tkinter','--hidden-import','tkinter.filedialog','--hidden-import','tkinter.messagebox',
        str(ROOT/'packaging/companion_entry.py')],check=True)
    binary=output/'atlas-companion.exe';shutil.copy2(binary,output/'debug.exe')
    if binary.stat().st_size>30*1024*1024:raise SystemExit('Small helper exceeded 30 MiB packaging gate')
    # Assert the actual core archive excludes scientific DLLs and weights, not just Python imports.
    from PyInstaller.archive.readers import CArchiveReader
    names=CArchiveReader(str(binary)).toc
    forbidden=('onnxruntime','numpy','cv2','pillow','tagging-models/','tagging-models\\')
    if any(any(word in name.lower() for word in forbidden) for name in names):raise SystemExit('AI assets leaked into core helper archive')
    source=hashlib.sha256()
    for p in sorted((ROOT/'src').rglob('*.py')):source.update(p.relative_to(ROOT).as_posix().encode()+b'\0'+p.read_bytes())
    receipt={'source_sha256':source.hexdigest(),'artifact':binary.name,'debug_artifact':'debug.exe',
             'sha256':sha(binary),'bytes':binary.stat().st_size,'engine_files':len(engine_spec['files']),
             'engine_bytes':sum(x['bytes'] for x in engine_spec['files'].values()),
             'model_bytes':sum(x['bytes'] for x in json.loads(model_manifest.read_text()).values()),
             'tagging_profile':'rich-candidate' if rich else 'legacy',
             'platform':platform.platform(),'architecture':platform.machine(),'python':platform.python_version(),
             'pyinstaller':'6.16.0','layout':'small-helper/separate-onedir-engine/shared-model-cache',
             'status':'unsigned development build; actual low-memory owner hardware acceptance NOT_RUN'}
    (output/'BUILD_RECEIPT.json').write_text(json.dumps(receipt,indent=2)+'\n')
    (output/'SHA256SUMS').write_text(receipt['sha256']+'  atlas-companion.exe\n'+receipt['sha256']+'  debug.exe\n')
    (output/'README.md').write_bytes((ROOT/'packaging/WINDOWS.md').read_bytes())
    shutil.copy2(ROOT/'packaging/TAGGING_MODEL_NOTICES.md',output/'TAGGING_MODEL_NOTICES.md')
    shutil.copytree(ROOT/'packaging/model-licenses',output/'model-licenses',dirs_exist_ok=True)
    subprocess.run([sys.executable,str(ROOT/'scripts/package_extension.py')],check=True)
    for p in (ROOT/'dist').glob('atlas-extension-*.zip'):shutil.copy2(p,output/p.name)
    print(json.dumps(receipt,indent=2))

if __name__=='__main__':main()
