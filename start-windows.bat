@echo off
cd /d "%~dp0"
echo.
echo Starting Folio at http://127.0.0.1:5173
start "" "http://127.0.0.1:5173"
where py >nul 2>&1
if %errorlevel%==0 (
  py -m http.server 5173 --bind 127.0.0.1
) else (
  where python >nul 2>&1
  if %errorlevel%==0 (
    python -m http.server 5173 --bind 127.0.0.1
  ) else (
    echo Python 3 was not found. Install Python 3 for free, or run this app using a local web server.
    pause
  )
)
