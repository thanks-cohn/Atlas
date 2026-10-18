"""Actual frozen duplicate-GUI launch: only an owned disposable process tree."""
import ctypes
from ctypes import wintypes as w
import os
from pathlib import Path
import subprocess
import sys
import tempfile
import time

if sys.platform!='win32':raise SystemExit('Actual Windows required')
binary=Path(sys.argv[1]).absolute()
user=ctypes.WinDLL('user32');user.FindWindowW.argtypes=[w.LPCWSTR,w.LPCWSTR];user.FindWindowW.restype=w.HWND
with tempfile.TemporaryDirectory(prefix='atlas-launch-smoke-') as state:
    command=[str(binary),'--desktop','--advanced','--state-dir',state]
    started=time.monotonic()
    first=subprocess.Popen(command)
    try:
        deadline=time.monotonic()+20
        while not user.FindWindowW(None,'ATLAS Companion - Setup & Locations'):
            if first.poll() is not None:raise AssertionError('First setup exited before opening')
            if time.monotonic()>deadline:raise AssertionError('Small helper setup did not open within 20 seconds')
            time.sleep(.1)
        print('PASS: first frozen setup window visible in',round(time.monotonic()-started,2),'seconds.')
        elapsed=time.monotonic()
        result=subprocess.run(command,capture_output=True,timeout=10)
        assert result.returncode==0,result.stderr.decode(errors='replace')
        assert first.poll() is None,'Duplicate launch terminated the existing window'
        print('PASS: second frozen GUI invocation returned in',round(time.monotonic()-elapsed,2),'seconds; first remained open.')
    finally:
        # Scope only to our own Popen process. Its retained process handle prevents
        # PID reuse; do not terminate by global process name.
        if first.poll() is None:
            subprocess.run([str(Path(os.environ['SystemRoot'])/'System32/taskkill.exe'),'/PID',str(first.pid),'/T','/F'],capture_output=True,timeout=10)
            first.wait(timeout=10)
