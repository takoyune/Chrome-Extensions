@echo off
setlocal EnableDelayedExpansion

:: Log file for debugging - written next to this script
set "LOG=%~dp0vlc_launch.log"
echo [%date% %time%] launch_vlc.bat called > "!LOG!"
echo [%date% %time%] Raw argument: %1 >> "!LOG!"

:: Get raw URI from Windows
set "RAW_URI=%~1"
echo [%date% %time%] RAW_URI: !RAW_URI! >> "!LOG!"

:: Strip the "playvlc://" prefix
set "YT_URL=!RAW_URI:playvlc://=!"

:: URL-decode the YouTube URL
set "YT_URL=!YT_URL:%%3A=:!"
set "YT_URL=!YT_URL:%%2F=/!"
set "YT_URL=!YT_URL:%%3F=?!"
set "YT_URL=!YT_URL:%%3D==!"
set "YT_URL=!YT_URL:%%26=&!"
set "YT_URL=!YT_URL:%%25=%%!"

:: Remove trailing slash Windows may append
if "!YT_URL:~-1!"=="/" set "YT_URL=!YT_URL:~0,-1!"
echo [%date% %time%] Decoded URL: !YT_URL! >> "!LOG!"

:: --- Locate VLC ---
set "VLC_EXE="

if exist "C:\Program Files\VideoLAN\VLC\vlc.exe" (
    set "VLC_EXE=C:\Program Files\VideoLAN\VLC\vlc.exe"
    goto :found_vlc
)

if exist "C:\Program Files (x86)\VideoLAN\VLC\vlc.exe" (
    set "VLC_EXE=C:\Program Files (x86)\VideoLAN\VLC\vlc.exe"
    goto :found_vlc
)

if exist "%LOCALAPPDATA%\Programs\VideoLAN\VLC\vlc.exe" (
    set "VLC_EXE=%LOCALAPPDATA%\Programs\VideoLAN\VLC\vlc.exe"
    goto :found_vlc
)

for /f "delims=" %%i in ('where vlc.exe 2^>nul') do (
    set "VLC_EXE=%%i"
    goto :found_vlc
)

for %%D in (C D E F G) do (
    if exist "%%D:\VideoLAN\VLC\vlc.exe" (
        set "VLC_EXE=%%D:\VideoLAN\VLC\vlc.exe"
        goto :found_vlc
    )
    if exist "%%D:\VLC\vlc.exe" (
        set "VLC_EXE=%%D:\VLC\vlc.exe"
        goto :found_vlc
    )
)

for %%D in (C D E) do (
    for /r "%%D:\Program Files" %%F in (vlc.exe) do (
        set "VLC_EXE=%%F"
        goto :found_vlc
    )
    for /r "%%D:\Program Files (x86)" %%F in (vlc.exe) do (
        set "VLC_EXE=%%F"
        goto :found_vlc
    )
)

:: VLC not found
echo [%date% %time%] ERROR: vlc.exe not found on this system >> "!LOG!"
echo VLC not found! Check: !LOG!
pause
exit /b 1

:found_vlc
echo [%date% %time%] VLC found at: !VLC_EXE! >> "!LOG!"
echo [%date% %time%] Launching VLC... >> "!LOG!"

start "" "!VLC_EXE!" "!YT_URL!"

echo [%date% %time%] start command executed, errorlevel=%errorlevel% >> "!LOG!"
exit /b 0
