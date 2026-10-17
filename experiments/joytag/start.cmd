@echo off
setlocal
cd /d "%~dp0"
if not exist ".venv\Scripts\python.exe" (
  py -3 -m venv .venv
  if errorlevel 1 goto failed
)
.venv\Scripts\python.exe -m pip install -r requirements.txt
if errorlevel 1 goto failed
.venv\Scripts\python.exe joytag.py --download
if errorlevel 1 goto failed
.venv\Scripts\python.exe joytag.py --gui
if errorlevel 1 goto failed
exit /b 0
:failed
echo JoyTag experiment could not start. Your Atlas installation has not been changed.
pause
exit /b 1
