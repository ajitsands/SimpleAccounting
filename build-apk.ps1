# One-click Android APK Builder for Simple Accounting

Write-Host "=========================================" -ForegroundColor Cyan
Write-Host " Building Simple Accounting Android APK  " -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan

$env:ANDROID_HOME = "$env:LOCALAPPDATA\Android\Sdk"
$env:ANDROID_SDK_ROOT = "$env:LOCALAPPDATA\Android\Sdk"
$env:PATH += ";$env:ANDROID_HOME\platform-tools;$env:ANDROID_HOME\cmdline-tools\latest\bin"

Set-Location "$PSScriptRoot\mobile\android"

Write-Host "`n[1/2] Running Gradle assembleDebug..." -ForegroundColor Yellow
.\gradlew.bat assembleDebug

if ($LASTEXITCODE -eq 0) {
    $apkPath = "$PSScriptRoot\mobile\android\app\build\outputs\apk\debug\app-debug.apk"
    $destPath = "$PSScriptRoot\SimpleAccounting.apk"
    Copy-Item -Path $apkPath -Destination $destPath -Force
    $fileSize = [math]::round((Get-Item $destPath).Length / 1MB, 2)
    Write-Host "`n[2/2] ✅ Build Successful!" -ForegroundColor Green
    Write-Host "APK Location: $destPath ($fileSize MB)" -ForegroundColor Green
    Write-Host "You can now install this APK on any Android phone or tablet.`n" -ForegroundColor White
} else {
    Write-Host "`n❌ Build Failed! Check the error messages above." -ForegroundColor Red
}

Set-Location "$PSScriptRoot"
