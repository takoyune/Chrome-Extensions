@echo off
setlocal EnableDelayedExpansion

echo ============================================================
echo   Glitch Ad Skipper - Protocol Handler Installer
echo ============================================================
echo.

set "SCRIPT_DIR=%~dp0"
:: Remove trailing backslash
if "%SCRIPT_DIR:~-1%"=="\" set "SCRIPT_DIR=%SCRIPT_DIR:~0,-1%"

set "PROTOCOL_NAME=glitchskip"
set "EXE_PATH=%SCRIPT_DIR%\fake.bat"

echo [INFO] Fake script found at:
echo   %EXE_PATH%
echo.
echo [INFO] Registering %PROTOCOL_NAME%:// protocol in Windows Registry...

:: Write to HKCU so it doesn't require Admin rights
reg add "HKCU\Software\Classes\%PROTOCOL_NAME%" /ve /d "URL:%PROTOCOL_NAME% Protocol" /f >nul
reg add "HKCU\Software\Classes\%PROTOCOL_NAME%" /v "URL Protocol" /d "" /f >nul
reg add "HKCU\Software\Classes\%PROTOCOL_NAME%\shell\open\command" /ve /d "cmd.exe /c \"\"%EXE_PATH%\" \"%%1\"\"" /f >nul

if %errorlevel% equ 0 (
    echo.
    echo [SUCCESS] Protocol handler installed successfully.
    echo.
    echo   %PROTOCOL_NAME%:// is now registered on this PC.
    echo   It points to your fake.bat script.
    echo.
) else (
    echo.
    echo [ERROR] Failed to register the protocol handler.
    echo.
)

pause
exit /b 0
