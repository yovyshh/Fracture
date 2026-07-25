; Fracture Installer — NSIS Modern UI 2 Wizard
Unicode True
RequestExecutionLevel user

!include "MUI2.nsh"
!include "LogicLib.nsh"

!define PRODUCT_NAME "Fracture"
!define PRODUCT_VERSION "2.0.0"
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

; ── Install ──
Section "Main Application" SEC01
  SetOutPath "$INSTDIR"
  SetOverwrite on
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
SectionEnd

; ── Uninstall ──
Section "Uninstall"
  ExecWait 'taskkill /f /im Fracture.exe'
  Sleep 500

  Delete "$SMPROGRAMS\Fracture\Fracture.lnk"
  Delete "$SMPROGRAMS\Fracture\Uninstall.lnk"
  Delete "$DESKTOP\Fracture.lnk"
  RMDir "$SMPROGRAMS\Fracture"

  Delete "$INSTDIR\Fracture.exe"
  Delete "$INSTDIR\Uninstall.exe"
  RMDir "$INSTDIR"

  DeleteRegKey HKCU "Software\${PRODUCT_NAME}"
  DeleteRegKey HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\${PRODUCT_NAME}"
SectionEnd
