@echo off
setlocal EnableDelayedExpansion

echo ============================================================
echo   VLC YouTube Fix - Updating youtube.lua
echo ============================================================
echo.

:: Check for Administrator privileges
net session >nul 2>&1
if %errorLevel% == 0 (
    echo [INFO] Running as Administrator.
) else (
    echo [ERROR] This script must be run as Administrator!
    echo Please right-click and select "Run as administrator".
    pause
    exit /b 1
)

set "VLC_DIR=C:\Program Files\VideoLAN\VLC"
set "PLAYLIST_DIR=%VLC_DIR%\lua\playlist"

if not exist "%PLAYLIST_DIR%" (
    echo [ERROR] Could not find VLC playlist folder at:
    echo %PLAYLIST_DIR%
    pause
    exit /b 1
)

echo [INFO] Downloading latest youtube.lua from VideoLAN GitLab...
powershell -Command "[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12; Invoke-WebRequest -Uri 'https://code.videolan.org/videolan/vlc/-/raw/master/share/lua/playlist/youtube.lua' -OutFile '%PLAYLIST_DIR%\youtube.lua'"

if errorlevel 1 (
    echo [ERROR] Failed to download youtube.lua.
    pause
    exit /b 1
)

echo [INFO] Backing up old youtube.luac (if it exists)...
if exist "%PLAYLIST_DIR%\youtube.luac" (
    ren "%PLAYLIST_DIR%\youtube.luac" "youtube.luac.bak"
)

echo.
echo [SUCCESS] VLC YouTube parser updated successfully!
echo VLC should now be able to play YouTube videos again.
echo.
pause
exit /b 0
