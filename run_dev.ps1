$env:Path = "C:\Users\Windows 11 Pro\AppData\Roaming\npm;C:\ffmpeg\bin;" + $env:Path
Set-Location 'C:\Users\Windows 11 Pro\Videos\Projects\fracture-ui'
Write-Output "PNPM test:"
pnpm --version
Write-Output "Starting wails dev..."
& 'C:\Users\Windows 11 Pro\go\bin\wails.exe' dev
if ($LASTEXITCODE -ne 0) {
    Write-Output "WAILS EXIT CODE: $LASTEXITCODE"
}