@echo off
echo Packaging Chrome Extensions into ZIP archives...

powershell -NoProfile -ExecutionPolicy Bypass -Command "if (Test-Path 'dist') { Remove-Item -Recurse -Force 'dist' }; New-Item -ItemType Directory -Path 'dist' | Out-Null; Compress-Archive -Path 'Glitch Ad Skipper\*' -DestinationPath 'dist\Glitch-Ad-Skipper.zip' -Force; Compress-Archive -Path 'PixivFanbox Downloader\*' -DestinationPath 'dist\PixivFanbox-Downloader.zip' -Force; Compress-Archive -Path 'Translate Web\*' -DestinationPath 'dist\Translate-Web.zip' -Force; Compress-Archive -Path 'VLC Extensions\*' -DestinationPath 'dist\VLC-Extensions.zip' -Force;"

if exist dist (
    echo.
    echo Packaging successful! ZIP files created in dist\ folder:
    dir /b dist
) else (
    echo.
    echo Packaging failed.
)

pause
