@echo off
setlocal EnableDelayedExpansion

echo ============================================================
echo   VLC YouTube Launcher - Protocol Handler Installer
echo ============================================================
echo.

set "SCRIPT_DIR=%~dp0"
set "VBS=%SCRIPT_DIR%launch_vlc.vbs"

if not exist "!VBS!" (
    echo [ERROR] Cannot find launch_vlc.vbs in: !SCRIPT_DIR!
    pause
    exit /b 1
)

echo [INFO] VBS launcher: !VBS!
echo [INFO] Writing registry via PowerShell (no admin needed)...
echo.

:: Use PowerShell to write HKCU\Software\Classes (no Administrator required).
:: HKCU\Software\Classes merges into HKCR automatically on Windows.
::
:: The command stored will be:
::   wscript.exe "D:\path\launch_vlc.vbs" "%1"
::
:: wscript.exe is ALWAYS in System32 with no spaces in path.
:: It reliably passes %1 to VBScript as WScript.Arguments(0).

powershell -NoProfile -ExecutionPolicy Bypass -Command "$vbs = '!VBS!'; $wscript = [System.Environment]::SystemDirectory + '\wscript.exe'; $cmd = '\"' + $wscript + '\" \"' + $vbs + '\" \"%%1\"'; $base = 'HKCU:\Software\Classes\playvlc'; New-Item -Path $base -Force | Out-Null; New-ItemProperty -Path $base -Name '(Default)' -Value 'URL:VLC YouTube Launcher Protocol' -PropertyType String -Force | Out-Null; New-ItemProperty -Path $base -Name 'URL Protocol' -Value '' -PropertyType String -Force | Out-Null; New-Item -Path ($base + '\shell\open\command') -Force | Out-Null; New-ItemProperty -Path ($base + '\shell\open\command') -Name '(Default)' -Value $cmd -PropertyType String -Force | Out-Null; Write-Host ('Stored command: ' + $cmd); Write-Host '[SUCCESS] Registry written to HKCU (no admin needed).'"

if errorlevel 1 goto :failed

echo.
echo [SUCCESS] Protocol handler installed!
echo.
echo   Next steps:
echo     1. Open Chrome - chrome://extensions/
echo     2. Enable Developer mode (top-right)
echo     3. Click "Load unpacked" - select the "extension" folder
echo     4. Go to any YouTube video and click the VLC icon!
echo.
goto :end

:failed
echo.
echo [ERROR] PowerShell failed. Try running as Administrator.
echo.

:end
pause
exit /b 0
