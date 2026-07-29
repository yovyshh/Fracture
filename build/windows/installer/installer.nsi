; Fracture Installer — NSIS Modern UI 2 Wizard
; Bundles ffmpeg, ffprobe, and yt-dlp directly in the installer.

Unicode True
RequestExecutionLevel user
SetCompressor /SOLID lzma

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

  ; Add install dir to user PATH (so ffmpeg/ffprobe/yt-dlp are available from command line)
  ; Read current user PATH, prepend our directory, write back as REG_SZ
  ReadRegStr $0 HKCU "Environment" "PATH"
  ${If} $0 != ""
    StrCpy $0 "$INSTDIR;$0"
  ${Else}
    StrCpy $0 "$INSTDIR"
  ${EndIf}
  WriteRegStr HKCU "Environment" "PATH" "$0"
  DetailPrint "Added Fracture install dir to user PATH."
  ; Broadcast WM_SETTINGCHANGE so running processes pick up the PATH change
  SendMessage 0xFFFF 0x001A 0 "Environment" /TIMEOUT=500

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

  ; Remove Fracture from PATH — remove our INSTDIR entry (with or without trailing backslash)
  ReadRegStr $R0 HKCU "Environment" "PATH"
  ${If} $R0 != ""
    ; Normalize: ensure INSTDIR ends with \ for matching
    StrCpy $R1 "$INSTDIR\"
    StrLen $R2 $R1
    ; Remove INSTDIR\ entry
    ${Do}
      StrCpy $R3 $R0 $R2
      ${If} $R3 == $R1
        ; Found it at the start — remove prefix including trailing ;
        StrCpy $R0 $R0 "" $R2
        ${If} $R0 == ";"
          StrCpy $R0 ""
        ${ElseIf} $R0 != ""
          StrCpy $R0 $R0 "" 1
        ${EndIf}
        ${ExitDo}
      ${EndIf}
      ; Check if INSTDIR\ appears after a ;
      StrCpy $R4 $R0 1
      ${If} $R4 == ";"
        StrCpy $R5 $R0 "" 1
        StrCpy $R4 $R5 $R2
        ${If} $R4 == $R1
          StrCpy $R0 $R5 "" $R2
          ${If} $R0 == ";"
            StrCpy $R0 ""
          ${ElseIf} $R0 != ""
            StrCpy $R0 $R0 "" 1
          ${EndIf}
          ${ExitDo}
        ${EndIf}
      ${EndIf}
      ; Move one char forward
      StrCpy $R0 $R0 "" 1
    ${LoopUntil} $R0 == ""
    WriteRegStr HKCU "Environment" "PATH" "$R0"
    SendMessage 0xFFFF 0x001A 0 "Environment" /TIMEOUT=500
  ${EndIf}

  DeleteRegKey HKCU "Software\${PRODUCT_NAME}"
  DeleteRegKey HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\${PRODUCT_NAME}"
SectionEnd
