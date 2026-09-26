Add-Type -AssemblyName System.Drawing

$srcPath = "E:\SimpleAccounting\LogoStandingWhite-Icon.png"
if (-not (Test-Path $srcPath)) {
    $srcPath = "E:\SimpleAccounting\LogoStandingWhite-icon.png"
}

Write-Host "Source image: $srcPath"
$srcImg = [System.Drawing.Bitmap]::FromFile($srcPath)
Write-Host "Image size: $($srcImg.Width) x $($srcImg.Height)"

function Resize-Image {
    param(
        [System.Drawing.Bitmap]$source,
        [int]$targetWidth,
        [int]$targetHeight,
        [string]$outputPath,
        [bool]$isForeground = $false,
        [string]$bgHex = $null
    )

    $destBmp = New-Object System.Drawing.Bitmap $targetWidth, $targetHeight
    $graphics = [System.Drawing.Graphics]::FromImage($destBmp)
    $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $graphics.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    $graphics.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality

    if ($bgHex) {
        $color = [System.Drawing.ColorTranslator]::FromHtml($bgHex)
        $brush = New-Object System.Drawing.SolidBrush $color
        $graphics.FillRectangle($brush, 0, 0, $targetWidth, $targetHeight)
        $brush.Dispose()
    } else {
        $graphics.Clear([System.Drawing.Color]::Transparent)
    }

    if ($isForeground) {
        # Foreground for adaptive icon should be centered with padding (~66% of total canvas to fit safe zone)
        $iconSize = [int]($targetWidth * 0.72)
        $offsetX = [int](($targetWidth - $iconSize) / 2)
        $offsetY = [int](($targetHeight - $iconSize) / 2)
        $graphics.DrawImage($source, $offsetX, $offsetY, $iconSize, $iconSize)
    } else {
        $graphics.DrawImage($source, 0, 0, $targetWidth, $targetHeight)
    }

    $graphics.Dispose()

    # If saving as png
    $destBmp.Save($outputPath, [System.Drawing.Imaging.ImageFormat]::Png)
    $destBmp.Dispose()
    Write-Host "Saved: $outputPath ($targetWidth x $targetHeight)"
}

# 1. Update mobile/assets
$assetsDir = "E:\SimpleAccounting\mobile\assets"
Copy-Item $srcPath "$assetsDir\icon.png" -Force
Copy-Item $srcPath "$assetsDir\adaptive-icon.png" -Force
Copy-Item $srcPath "$assetsDir\splash.png" -Force
Write-Host "Updated mobile\assets (icon, adaptive-icon, splash)"

# 2. Android mipmap densities
$densities = @(
    @{ name = "mipmap-mdpi"; launcherSize = 48; fgSize = 108 },
    @{ name = "mipmap-hdpi"; launcherSize = 72; fgSize = 162 },
    @{ name = "mipmap-xhdpi"; launcherSize = 96; fgSize = 216 },
    @{ name = "mipmap-xxhdpi"; launcherSize = 144; fgSize = 324 },
    @{ name = "mipmap-xxxhdpi"; launcherSize = 192; fgSize = 432 }
)

$resDir = "E:\SimpleAccounting\mobile\android\app\src\main\res"

foreach ($d in $densities) {
    $dir = Join-Path $resDir $d.name
    if (-not (Test-Path $dir)) {
        New-Item -ItemType Directory -Path $dir -Force | Out-Null
    }

    # Standard launcher icon (PNG)
    Resize-Image -source $srcImg -targetWidth $d.launcherSize -targetHeight $d.launcherSize -outputPath "$dir\ic_launcher.png"
    Resize-Image -source $srcImg -targetWidth $d.launcherSize -targetHeight $d.launcherSize -outputPath "$dir\ic_launcher_round.png"

    # Foreground adaptive icon (PNG) - centered icon with transparency
    Resize-Image -source $srcImg -targetWidth $d.fgSize -targetHeight $d.fgSize -outputPath "$dir\ic_launcher_foreground.png" -isForeground $true

    # Remove any conflicting webp files in that folder so gradle doesn't complain about duplicate resources or use old webp
    Get-ChildItem -Path $dir -Filter "*.webp" | Remove-Item -Force
}

$srcImg.Dispose()
Write-Host "All icons updated successfully!"
