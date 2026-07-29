@echo off
REM Download ffmpeg/ffprobe and yt-dlp for the NSIS installer embed folder
REM Run this from the repo root before building the installer locally

setlocal
set EMBED_DIR=build\windows\installer\embed

echo === Downloading yt-dlp ===
curl -fSL -o "%EMBED_DIR%\yt-dlp.exe" "https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp.exe" || exit /b 1

echo === Downloading ffmpeg and ffprope ===
curl -fSL -o ffmpeg-release.7z "https://www.gyan.dev/ffmpeg/builds/ffmpeg-release-essentials.7z" || exit /b 1

echo === Extracting ffmpeg and ffprobe ===
tar -xf ffmpeg-release.7z -C %TEMP%\ffmpeg-temp >nul 2>&1
if %ERRORLEVEL% neq 0 (
    REM fallback: try 7z
    7z x ffmpeg-release.7z -o%TEMP%\ffmpeg-temp -y >nul || exit /b 1
)
REM Find and copy the executables from the extracted directory
for /r "%TEMP%\ffmpeg-temp" %%f in (ffmpeg.exe) do (
    copy /y "%%f" "%EMBED_DIR%\ffmpeg.exe" >nul
    echo ffmpeg.exe copied
    goto :ffmpeg_found
)
:ffmpeg_found
for /r "%TEMP%\ffmpeg-temp" %%f in (ffprobe.exe) do (
    copy /y "%%f" "%EMBED_DIR%\ffprobe.exe" >nul
    echo ffprobe.exe copied
    goto :ffprobe_found
)
:ffprobe_found
REM Clean up
del ffmpeg-release.7z 2>nul
rmdir /s /q "%TEMP%\ffmpeg-temp" 2>nul
echo === Done ===
echo Embed files:
dir "%EMBED_DIR%" /b
