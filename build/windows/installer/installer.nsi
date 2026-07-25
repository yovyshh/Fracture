; Fracture Installer — Windows NSIS Modern UI Wizard
; Wails v2 NSIS template override

Unicode True
RequestExecutionLevel user

!include "MUI2.nsh"
!include "FileFunc.nsh"
!include "LogicLib.nsh"
!include "WinMessages.nsh"

; ──── App Metadata ────
!define PRODUCT_NAME "Fracture"
!define PRODUCT_VERSION "2.0.0"
!define PRODUCT_PUBLISHER "yovyshh"
!define PRODUCT_WEB_SITE "https://github.com/yovyshh/Fracture"
!define PRODUCT_DIR_REGKEY "Software\Microsoft\Windows\CurrentVersion\App Paths\Fracture.exe"
!define PRODUCT_UNINST_KEY "Software\Microsoft\Windows\CurrentVersion\Uninstall\${PRODUCT_NAME}"
!define PRODUCT_UNINST_ROOT_KEY "HKCU"

; ──── Branding ────
!define MUI_ICON "..\icon.ico"
!define MUI_UNICON "..\icon.ico"
!define MUI_HEADERIMAGE
!define MUI_HEADERIMAGE_BITMAP ""
!define MUI_HEADERIMAGE_UNBITMAP ""

; ──── Installer Attributes ────
Name "${PRODUCT_NAME} ${PRODUCT_VERSION}"
OutFile "..\..\bin\Fracture-Installer.exe"
InstallDir "$LOCALAPPDATA\fracture"
InstallDirRegKey HKCU "${PRODUCT_DIR_REGKEY}" ""
ShowInstDetails show
ShowUnInstDetails show

; ──── Interface Settings ────
!define MUI_ABORTWARNING
!define MUI_FINISHPAGE_RUN "$INSTDIR\Fracture.exe"
!define MUI_FINISHPAGE_RUN_TEXT "Launch Fracture"
!define MUI_FINISHPAGE_SHOWREADME ""
!define MUI_FINISHPAGE_NOREBOOTSUPPORT

; ──── Pages ────
!insertmacro MUI_PAGE_WELCOME
!insertmacro MUI_PAGE_LICENSE "..\..\..\LICENSE"
!insertmacro MUI_PAGE_DIRECTORY
!insertmacro MUI_PAGE_INSTFILES
!insertmacro MUI_PAGE_FINISH

!insertmacro MUI_UNPAGE_CONFIRM
!insertmacro MUI_UNPAGE_INSTFILES

; ──── Languages ────
!insertmacro MUI_LANGUAGE "English"

; ──── Installer Section ────
Section "Main Application" SEC_APP
  SetOutPath "$INSTDIR"
  SetOverwrite on

  ; Copy all app files
  File /r "..\..\..\build\bin\Fracture.exe"
  File /r "..\..\..\build\bin\*.dll"
  File /r "..\..\..\build\bin\resources\*.*"

  ; Create shortcuts
  CreateDirectory "$SMPROGRAMS\Fracture"
  SetOutPath "$INSTDIR"
  CreateShortCut "$SMPROGRAMS\Fracture\Fracture.lnk" "$INSTDIR\Fracture.exe"
  CreateShortCut "$DESKTOP\Fracture.lnk" "$INSTDIR\Fracture.exe"
  CreateShortCut "$SMPROGRAMS\Fracture\Uninstall Fracture.lnk" "$INSTDIR\Uninstall.exe"

  ; Write uninstaller
  WriteUninstaller "$INSTDIR\Uninstall.exe"

  ; Registry — App Paths
  WriteRegStr HKCU "${PRODUCT_DIR_REGKEY}" "" "$INSTDIR\Fracture.exe"
  WriteRegStr HKCU "${PRODUCT_DIR_REGKEY}" "Path" "$INSTDIR"

  ; Registry — Uninstall info
  WriteRegStr HKCU "${PRODUCT_UNINST_KEY}" "DisplayName" "$(^Name)"
  WriteRegStr HKCU "${PRODUCT_UNINST_KEY}" "UninstallString" "$INSTDIR\Uninstall.exe"
  WriteRegStr HKCU "${PRODUCT_UNINST_KEY}" "DisplayIcon" "$INSTDIR\Fracture.exe"
  WriteRegStr HKCU "${PRODUCT_UNINST_KEY}" "DisplayVersion" "${PRODUCT_VERSION}"
  WriteRegStr HKCU "${PRODUCT_UNINST_KEY}" "Publisher" "${PRODUCT_PUBLISHER}"
  WriteRegStr HKCU "${PRODUCT_UNINST_KEY}" "URLInfoAbout" "${PRODUCT_WEB_SITE}"
  WriteRegDWORD HKCU "${PRODUCT_UNINST_KEY}" "NoModify" 1
  WriteRegDWORD HKCU "${PRODUCT_UNINST_KEY}" "NoRepair" 1

  ; Register ffmpeg path in user PATH
  Push $0
  ReadRegStr $0 HKCU "Environment" "PATH"
  ${If} $0 != ""
    Push $0
    Push "$INSTDIR"
    Call un.AddToPath
  ${Else}
    WriteRegStr HKCU "Environment" "PATH" "$INSTDIR"
  ${EndIf}
  Pop $0

SectionEnd

; ──── Uninstaller Section ────
Section Uninstall
  ; Kill running instance
  ExecWait 'taskkill /f /im Fracture.exe'
  Sleep 500

  ; Remove shortcuts
  Delete "$SMPROGRAMS\Fracture\Fracture.lnk"
  Delete "$SMPROGRAMS\Fracture\Uninstall Fracture.lnk"
  Delete "$DESKTOP\Fracture.lnk"
  RMDir "$SMPROGRAMS\Fracture"

  ; Remove files
  RMDir /r "$INSTDIR\*.*"
  RMDir "$INSTDIR"

  ; Remove registry keys
  DeleteRegKey HKCU "${PRODUCT_UNINST_KEY}"
  DeleteRegKey HKCU "${PRODUCT_DIR_REGKEY}"

  ; Remove from PATH
  Push "$INSTDIR"
  Call un.RemoveFromPath
SectionEnd

; ──── Path Helpers ────
Function un.AddToPath
  Exch $0
  Push $1
  ReadRegStr $1 HKCU "Environment" "PATH"
  Push $1
  Push "$0;"
  Call un.StrStr
  Pop $1
  StrCmp $1 "" 0 +3
    ReadRegStr $1 HKCU "Environment" "PATH"
    WriteRegStr HKCU "Environment" "PATH" "$0;$1"
  Pop $1
  Pop $0
FunctionEnd

Function un.RemoveFromPath
  Exch $0
  Push $1
  ReadRegStr $1 HKCU "Environment" "PATH"
  Push $1
  Push "$0;"
  Call un.StrStr
  Pop $1
  StrCmp $1 "" done
    Push $1
    Push "$0;"
    Call un.StrStr
    Pop $1
    StrLen $0 $1
    StrCpy $1 $1 $0
    WriteRegStr HKCU "Environment" "PATH" "$1"
  done:
  Pop $1
  Pop $0
FunctionEnd

Function un.StrStr
  Exch $1
  Exch
  Exch $0
  Push $0
  Push $1
  Push $0
  StrLen $1 $1
  StrCpy $0 0
  loop:
    StrCpy $2 $1 $1 $0
    StrCmp $2 $0 found
    IntOp $0 $0 + 1
    StrCmp $0 4096 not_found
    Goto loop
  not_found:
    StrCpy $0 ""
    Goto done
  found:
    StrCpy $0 $1 "" $0
  done:
    Pop $1
    Exch $0
FunctionEnd

; ──── WebView2 Bootstrapper ────
Function .onInit
  ; Check if WebView2 is already installed
  ReadRegStr $0 HKLM "SOFTWARE\Microsoft\EdgeUpdate\Clients\{F3017226-FE2A-4295-8BDF-00C3A9A7E4C5}" "pv"
  StrCmp $0 "" 0 webview_ok

  ; If not found, try per-machine
  ReadRegStr $0 HKLM "SOFTWARE\WOW6432Node\Microsoft\EdgeUpdate\Clients\{F3017226-FE2A-4295-8BDF-00C3A9A7E4C5}" "pv"
  StrCmp $0 "" 0 webview_ok

  ; Download and install WebView2 Bootstrapper
  DetailPrint "Installing WebView2 Runtime..."
  nsExec::ExecToStack '"$WINDIR\system32\cmd.exe" /c start /wait "" "https://go.microsoft.com/fwlink/p/?LinkId=2124703"'
  Pop $0
  Goto webview_ok

  webview_ok:
FunctionEnd
