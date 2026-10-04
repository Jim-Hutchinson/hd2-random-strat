@echo off
setlocal
cd /d "%~dp0"

rem Port the local server listens on. Change if 8734 is already in use.
set PORT=8734
set URL=http://127.0.0.1:%PORT%/randomizer/

rem Find a Python interpreter for the tiny built-in web server.
where python >nul 2>nul
if %errorlevel%==0 (
    set "SERVER_CMD=python -m http.server %PORT% --bind 127.0.0.1"
    goto :found_python
)
where py >nul 2>nul
if %errorlevel%==0 (
    set "SERVER_CMD=py -m http.server %PORT% --bind 127.0.0.1"
    goto :found_python
)

echo Python 3 is required to run the local server.
echo Install it from https://www.python.org/downloads/ ^(tick "Add python.exe to PATH"^),
echo or simply double-click randomizer\index.html instead - no server needed.
pause
exit /b 1

:found_python
echo Starting the Helldivers 2 Randomizer...
echo   %URL%
echo.

start "HD2 Randomizer server" /min cmd /c "%SERVER_CMD%"

timeout /t 1 /nobreak >nul
start "" "%URL%"

echo The server is running in the minimized "HD2 Randomizer server" window.
echo Keep that window open while playing; close it to stop the server.
echo This window can be closed.
timeout /t 4 /nobreak >nul
