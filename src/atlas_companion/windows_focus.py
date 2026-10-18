"""Focus only an Atlas setup window owned by this user's same executable."""
import ctypes
from ctypes import wintypes as w
import os
from pathlib import Path
import sys


def existing_setup():
    from .windows_state import windows_api, current_sid, token_sid
    kernel,_=windows_api();user=ctypes.WinDLL('user32',use_last_error=True)
    user.FindWindowW.argtypes=[w.LPCWSTR,w.LPCWSTR];user.FindWindowW.restype=w.HWND
    window=user.FindWindowW(None,'ATLAS Companion - Setup & Locations')
    if not window:return False
    pid=w.DWORD();user.GetWindowThreadProcessId.argtypes=[w.HWND,ctypes.POINTER(w.DWORD)]
    user.GetWindowThreadProcessId(window,ctypes.byref(pid))
    kernel.OpenProcess.argtypes=[w.DWORD,w.BOOL,w.DWORD];kernel.OpenProcess.restype=w.HANDLE
    process=kernel.OpenProcess(0x1000,False,pid.value)
    if not process:return False
    try:
        if token_sid(process)!=current_sid():return False
        size=w.DWORD(32768);image=ctypes.create_unicode_buffer(size.value)
        kernel.QueryFullProcessImageNameW.argtypes=[w.HANDLE,w.DWORD,w.LPWSTR,ctypes.POINTER(w.DWORD)]
        if not kernel.QueryFullProcessImageNameW(process,0,image,ctypes.byref(size)):return False
        if os.path.normcase(image.value)!=os.path.normcase(str(Path(sys.executable).absolute())):return False
        user.ShowWindow.argtypes=[w.HWND,ctypes.c_int];user.ShowWindow(window,9)
        user.SetForegroundWindow.argtypes=[w.HWND];user.SetForegroundWindow(window)
        return True
    finally:kernel.CloseHandle(process)
