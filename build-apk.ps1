# One-click Android APK Builder for Simple Accounting

Write-Host "=========================================" -ForegroundColor Cyan
Write-Host " Building Simple Accounting Android APK  " -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan

$env:ANDROID_HOME = "$env:LOCALAPPDATA\Android\Sdk"
$env:ANDROID_SDK_ROOT = "$env:LOCALAPPDATA\Android\Sdk"
$env:PATH += ";$env:ANDROID_HOME\platform-tools;$env:ANDROID_HOME\cmdline-tools\latest\bin"

Write-Host "`n[1/3] Updating app icons from LogoStandingWhite-Icon.png..." -ForegroundColor Yellow
if (Test-Path "$PSScriptRoot\update-icons.ps1") {
    & "$PSScriptRoot\update-icons.ps1"
}

Set-Location "$PSScriptRoot\mobile\android"

Write-Host "`n[2/3] Running Gradle assembleRelease (Bundles offline JS & assets)..." -ForegroundColor Yellow
.\gradlew.bat assembleRelease

if ($LASTEXITCODE -eq 0) {
    $apkPath = "$PSScriptRoot\mobile\android\app\build\outputs\apk\release\app-release.apk"
    $destPath = "$PSScriptRoot\SimpleAccounting.apk"
    Copy-Item -Path $apkPath -Destination $destPath -Force
    $fileSize = [math]::round((Get-Item $destPath).Length / 1MB, 2)
    Write-Host "`n[3/3] ✅ Build Successful!" -ForegroundColor Green
    Write-Host "APK Location: $destPath ($fileSize MB)" -ForegroundColor Green
    Write-Host "You can now install this standalone APK on any Android phone or tablet without needing a PC/Metro connection.`n" -ForegroundColor White
} else {
    Write-Host "`n❌ Build Failed! Check the error messages above." -ForegroundColor Red
}

Set-Location "$PSScriptRoot"

