"""One explicit model job per process. No pairing/grants or evidence writes here."""
import argparse
import json
import sys
from pathlib import Path
from types import SimpleNamespace


def resources():
    if sys.platform=='win32':
        import ctypes
        from ctypes import wintypes as w
        class Counters(ctypes.Structure):
            _fields_=[('cb',w.DWORD),('faults',w.DWORD)]+[(name,ctypes.c_size_t) for name in
                ('peak_ws','ws','peak_paged','paged','peak_nonpaged','nonpaged','pagefile','peak_pagefile')]
        counters=Counters();counters.cb=ctypes.sizeof(counters)
        kernel=ctypes.WinDLL('kernel32');kernel.GetCurrentProcess.restype=w.HANDLE
        psapi=ctypes.WinDLL('psapi');psapi.GetProcessMemoryInfo.argtypes=[w.HANDLE,ctypes.POINTER(Counters),w.DWORD]
        if psapi.GetProcessMemoryInfo(kernel.GetCurrentProcess(),ctypes.byref(counters),counters.cb):
            return {'peak_working_set_bytes':counters.peak_ws,'peak_commit_bytes':counters.peak_pagefile}
        return {'peak_working_set_bytes':None}
    import resource
    peak=resource.getrusage(resource.RUSAGE_SELF).ru_maxrss
    return {'peak_working_set_bytes':int(peak*(1 if sys.platform=='darwin' else 1024))}


def main():
    parser=argparse.ArgumentParser()
    parser.add_argument('--state-dir',required=True)
    args=parser.parse_args()
    try:
        raw=sys.stdin.buffer.read(2*1024*1024+1)
        if len(raw)>2*1024*1024:raise ValueError('Payload exceeds job limit')
        body=json.loads(raw)
        if not isinstance(body,dict):raise ValueError('Expected one image request')
        from .onnx_tags import predict
        result=predict(SimpleNamespace(directory=Path(args.state_dir)),body)
        print(json.dumps({'ok':True,**result,'resources':resources()},allow_nan=False),flush=True)
        return 0
    except Exception as exc:
        from .security import APIError
        code=exc.code if isinstance(exc,APIError) else 'TAG_WORKER_FAILED'
        message=exc.message if isinstance(exc,APIError) else 'Tagging process failed; inspect companion diagnostics.'
        print(json.dumps({'ok':False,'error':{'code':code,'message':message}}),flush=True)
        return 1

if __name__=='__main__':raise SystemExit(main())
