; Fracture Installer — NSIS Modern UI 2 Wizard
; Bundles ffmpeg, ffprobe, and yt-dlp directly in the installer.

Unicode True
RequestExecutionLevel user

!include "MUI2.nsh"
!include "LogicLib.nsh"

!define PRODUCT_NAME "Fracture"
!define PRODUCT_VERSION "1.0.0"
!define PRODUCT_PUBLISHER "yovyshh"
!define PRODUCT_WEB_SITE "https://github.com/yovyshh/Fracture"

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

; ── Install Section ──
Section "Main Application" SEC01
  SetOutPath "$INSTDIR"
  SetOverwrite on

  ; Fracture app
  File "..\..\bin\Fracture.exe"

  ; Bundled dependencies (ffmpeg, ffprobe, yt-dlp)
  File "embed\ffmpeg.exe"
  File "embed\ffprobe.exe"
  File "embed\yt-dlp.exe"

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

  ; Add install dir to user PATH (so ffmpeg/yt-dlp are available from command line)
  ReadRegStr $0 HKCU "Environment" "PATH"
  ${If} $0 != ""
    StrCpy $0 "$INSTDIR;$0"
  ${Else}
    StrCpy $0 "$INSTDIR"
  ${EndIf}
  WriteRegExpandStr HKCU "Environment" "PATH" "$0"
  DetailPrint "Added Fracture to system PATH."
  SendMessage 0xFFFF 0x001A 0 "" /TIMEOUT=500

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
  Delete "$INSTDIR\yt-dlp.exe"
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
    StrCpy $1 $INSTDIR
    StrLen $2 $1
    StrCpy $3 $0
    StrLen $4 $3
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
