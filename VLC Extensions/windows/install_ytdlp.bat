@echo off
setlocal EnableDelayedExpansion

echo ============================================================
echo   VLC YouTube Fix - Installing yt-dlp
echo ============================================================
echo.
echo YouTube frequently changes its code to break VLC's built-in 
echo youtube.lua script.
echo.
echo The bulletproof fix is to use "yt-dlp", an open-source tool 
echo that bypasses YouTube's restrictions perfectly.
echo.
echo Downloading yt-dlp.exe...

set "SCRIPT_DIR=%~dp0"
set "YTDLP_PATH=%SCRIPT_DIR%yt-dlp.exe"

powershell -Command "[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12; Invoke-WebRequest -Uri 'https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp.exe' -OutFile '!YTDLP_PATH!'"

if not exist "!YTDLP_PATH!" (
    echo [ERROR] Failed to download yt-dlp.exe.
    pause
    exit /b 1
)

echo.
echo [SUCCESS] yt-dlp installed successfully!
echo The VLC Launcher will now use it to bypass YouTube restrictions.
echo.
pause
exit /b 0
