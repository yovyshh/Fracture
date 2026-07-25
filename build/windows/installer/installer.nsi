; Fracture Installer — NSIS Modern UI 2 Wizard
; Bundles FFmpeg for users who don't have it installed.

Unicode True
RequestExecutionLevel user

!include "MUI2.nsh"
!include "LogicLib.nsh"

!define PRODUCT_NAME "Fracture"
!define PRODUCT_VERSION "2.0.0"
!define PRODUCT_PUBLISHER "yovyshh"
!define PRODUCT_WEB_SITE "https://github.com/yovyshh/Fracture"
!define FFMPEG_URL "https://github.com/BtbN/FFmpeg-Builds/releases/download/latest/ffmpeg-master-latest-win64-gpl.zip"
!define YTDLP_URL "https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp.exe"

Name "${PRODUCT_NAME} ${PRODUCT_VERSION}"
OutFile "Fracture-Installer.exe"
InstallDir "$LOCALAPPDATA\${PRODUCT_NAME}"
InstallDirRegKey HKCU "Software\${PRODUCT_NAME}" ""
ShowInstDetails show
ShowUnInstDetails show

!define MUI_ICON "..\icon.ico"
!define MUI_UNICON "..\icon.ico"
!define MUI_ABORTWARNING
!define MUI_FINISHPAGE_RUN "$INSTDIR\Fracture.exe"
!define MUI_FINISHPAGE_RUN_TEXT "Launch Fracture"

; ── Pages ──
!insertmacro MUI_PAGE_WELCOME
!insertmacro MUI_PAGE_DIRECTORY
!insertmacro MUI_PAGE_INSTFILES
!insertmacro MUI_PAGE_FINISH

!insertmacro MUI_UNPAGE_CONFIRM
!insertmacro MUI_UNPAGE_INSTFILES

!insertmacro MUI_LANGUAGE "English"

Var FFMPEG_CHECKED

; ── Install Section ──
Section "Main Application" SEC01
  SetOutPath "$INSTDIR"
  SetOverwrite on

  ; Copy Fracture executable
  File "..\..\bin\Fracture.exe"

  ; Shortcuts
  CreateDirectory "$SMPROGRAMS\Fracture"
  CreateShortCut "$SMPROGRAMS\Fracture\Fracture.lnk" "$INSTDIR\Fracture.exe"
  CreateShortCut "$DESKTOP\Fracture.lnk" "$INSTDIR\Fracture.exe"
  CreateShortCut "$SMPROGRAMS\Fracture\Uninstall.lnk" "$INSTDIR\Uninstall.exe"

  ; Uninstaller
  WriteUninstaller "$INSTDIR\Uninstall.exe"

  ; Registry
  WriteRegStr HKCU "Software\${PRODUCT_NAME}" "" "$INSTDIR"
  WriteRegStr HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\${PRODUCT_NAME}" \
    "DisplayName" "${PRODUCT_NAME} ${PRODUCT_VERSION}"
  WriteRegStr HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\${PRODUCT_NAME}" \
    "UninstallString" "$INSTDIR\Uninstall.exe"
  WriteRegStr HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\${PRODUCT_NAME}" \
    "DisplayIcon" "$INSTDIR\Fracture.exe"
  WriteRegStr HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\${PRODUCT_NAME}" \
    "Publisher" "${PRODUCT_PUBLISHER}"
  WriteRegStr HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\${PRODUCT_NAME}" \
    "URLInfoAbout" "${PRODUCT_WEB_SITE}"
  WriteRegStr HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\${PRODUCT_NAME}" \
    "DisplayVersion" "${PRODUCT_VERSION}"
  WriteRegDWORD HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\${PRODUCT_NAME}" \
    "NoModify" 1
  WriteRegDWORD HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\${PRODUCT_NAME}" \
    "NoRepair" 1

  ; ── FFmpeg check & download ──
  DetailPrint "Checking for FFmpeg..."
  StrCpy $FFMPEG_CHECKED "0"

  ; Check if ffmpeg is already available on PATH
  nsExec::ExecToStack '"$WINDIR\system32\where.exe" ffmpeg 2>nul'
  Pop $0
  ${If} $0 == 0
    StrCpy $FFMPEG_CHECKED "1"
    DetailPrint "FFmpeg found on system — skipping download."
  ${EndIf}

  ${If} $FFMPEG_CHECKED == "0"
    ; Check if we already have ffmpeg in our install dir
    IfFileExists "$INSTDIR\ffmpeg.exe" 0 downloadFFmpeg
    IfFileExists "$INSTDIR\ffprobe.exe" 0 downloadFFmpeg
    DetailPrint "FFmpeg already in app directory."
    StrCpy $FFMPEG_CHECKED "1"
  ${EndIf}

  downloadFFmpeg:
  ${If} $FFMPEG_CHECKED == "0"
    DetailPrint "Downloading FFmpeg (essential tools: ~8MB)..."
    SetDetailsView show

    ; Download zip using NSISdl
    NSISdl::download_quiet "${FFMPEG_URL}" "$TEMP\ffmpeg.zip"
    Pop $0
    ${If} $0 != "success"
      DetailPrint "FFmpeg download failed ($0). You'll need to install FFmpeg manually."
      Goto ffmpegDone
    ${EndIf}

    DetailPrint "Extracting FFmpeg..."
    ; Extract the zip to a temp folder using PowerShell (available on all Windows 10+)
    nsExec::ExecToLog 'powershell -NoProfile -Command "& { Expand-Archive -Path "$TEMP\ffmpeg.zip" -DestinationPath "$TEMP\ffmpeg-temp" -Force; Copy-Item "$TEMP\ffmpeg-temp\*\bin\ffmpeg.exe" "$INSTDIR\ffmpeg.exe"; Copy-Item "$TEMP\ffmpeg-temp\*\bin\ffprobe.exe" "$INSTDIR\ffprobe.exe"; Remove-Item "$TEMP\ffmpeg-temp" -Recurse -Force; Remove-Item "$TEMP\ffmpeg.zip" -Force }"'
    Pop $0

    ${If} ${FileExists} "$INSTDIR\ffmpeg.exe"
      DetailPrint "FFmpeg installed successfully."
    ${Else}
      DetailPrint "FFmpeg extraction failed. You'll need to install it manually."
    ${EndIf}
  ${EndIf}


  ; ── yt-dlp check & download ──
  DetailPrint "Checking for yt-dlp..."
  nsExec::ExecToStack '"$WINDIR\system32\where.exe" yt-dlp 2>nul'
  Pop $0
  ${If} $0 == 0
    DetailPrint "yt-dlp found on system — skipping download."
  ${Else}
    IfFileExists "$INSTDIR\yt-dlp.exe" ytdlpDone downloadYtdlp
  ${EndIf}

  downloadYtdlp:
  IfFileExists "$INSTDIR\yt-dlp.exe" ytdlpDone
    DetailPrint "Downloading yt-dlp..."
    NSISdl::download_quiet "${YTDLP_URL}" "$INSTDIR\yt-dlp.exe"
    Pop $0
    ${If} $0 == "success"
      DetailPrint "yt-dlp installed successfully."
    ${Else}
      DetailPrint "yt-dlp download failed ($0). You may need to install it manually."
    ${EndIf}
  
  ytdlpDone:

  ffmpegDone:

  ; Add install dir to user PATH if ffmpeg was placed there
  ${If} ${FileExists} "$INSTDIR\ffmpeg.exe"
    ; Add Fracture to user PATH via registry
    ReadRegStr $0 HKCU "Environment" "PATH"
    ${If} $0 != ""
      StrCpy $0 "$INSTDIR;$0"
    ${Else}
      StrCpy $0 "$INSTDIR"
    ${EndIf}
    WriteRegExpandStr HKCU "Environment" "PATH" "$0"
    DetailPrint "Added Fracture to system PATH."
    ; Notify Explorer of environment change
    SendMessage 0xFFFF 0x001A 0 "" /TIMEOUT=500
  ${EndIf}

SectionEnd

; ── Uninstall Section ──
Section "Uninstall"
  ExecWait 'taskkill /f /im Fracture.exe'
  Sleep 500

  Delete "$SMPROGRAMS\Fracture\Fracture.lnk"
  Delete "$SMPROGRAMS\Fracture\Uninstall.lnk"
  Delete "$DESKTOP\Fracture.lnk"
  RMDir "$SMPROGRAMS\Fracture"

  Delete "$INSTDIR\Fracture.exe"
  Delete "$INSTDIR\ffmpeg.exe"
  Delete "$INSTDIR\ffprobe.exe"
  Delete "$INSTDIR\Uninstall.exe"
  RMDir "$INSTDIR"

  ; Clear WebView2 user data (export history, localStorage, settings)
  RMDir /r "$LOCALAPPDATA\Fracture"
  RMDir /r "$LOCALAPPDATA\fracture"
  RMDir /r "$APPDATA\Fracture"
  RMDir /r "$APPDATA\fracture"

  ; Remove Fracture from PATH
  ReadRegStr $0 HKCU "Environment" "PATH"
  ${If} $0 != ""
    ; Remove $INSTDIR from PATH
    StrCpy $1 $INSTDIR
    StrLen $2 $1
    StrCpy $3 $0
    StrLen $4 $3
    ; Find and remove the install dir entry
    ${If} $3 == $1
      StrCpy $0 ""
    ${Else}
      StrCpy $5 $3 1
      ${If} $5 == ";"
        StrCpy $3 $3 $4 1
      ${EndIf}
      ${If} $3 != ""
        StrCpy $0 "$3"
      ${EndIf}
    ${EndIf}
    WriteRegExpandStr HKCU "Environment" "PATH" "$0"
    SendMessage 0xFFFF 0x001A 0 "" /TIMEOUT=500
  ${EndIf}

  DeleteRegKey HKCU "Software\${PRODUCT_NAME}"
  DeleteRegKey HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\${PRODUCT_NAME}"
SectionEnd
