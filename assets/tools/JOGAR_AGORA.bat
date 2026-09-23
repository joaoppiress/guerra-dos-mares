@echo off
setlocal
cd /d "%~dp0\..\.."
set PORT=8765
where py >nul 2>nul
if %errorlevel%==0 (
  start "" cmd /c "timeout /t 1 /nobreak >nul & start http://127.0.0.1:%PORT%/"
  py -m http.server %PORT% --bind 127.0.0.1
  exit /b
)
where python >nul 2>nul
if %errorlevel%==0 (
  start "" cmd /c "timeout /t 1 /nobreak >nul & start http://127.0.0.1:%PORT%/"
  python -m http.server %PORT% --bind 127.0.0.1
  exit /b
)
echo Python nao encontrado. Abra a pasta no VS Code e use Live Server.
pause
