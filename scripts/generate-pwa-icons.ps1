Add-Type -AssemblyName System.Drawing

$srcPath = Join-Path $PSScriptRoot "..\public\logo.jpg"
if (-not (Test-Path $srcPath)) {
    Write-Error "Source image not found: $srcPath"
    exit 1
}

$srcImg = [System.Drawing.Image]::FromFile($srcPath)
Write-Host "Source dimensions: $($srcImg.Width) x $($srcImg.Height)"

function Resize-Image {
    param(
        [System.Drawing.Image]$Image,
        [int]$Width,
        [int]$Height,
        [string]$OutPath,
        [bool]$AddPadding = $false
    )

    $destBmp = New-Object System.Drawing.Bitmap($Width, $Height)
    $g = [System.Drawing.Graphics]::FromImage($destBmp)
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    $g.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality

    if ($AddPadding) {
        # Fill background with brand color or white
        $brush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(51, 4, 13)) # #33040D
        $g.FillRectangle($brush, 0, 0, $Width, $Height)
        $brush.Dispose()
        
        # Draw image inside 80% safe zone
        $padX = [int]($Width * 0.1)
        $padY = [int]($Height * 0.1)
        $destW = $Width - ($padX * 2)
        $destH = $Height - ($padY * 2)
        $g.DrawImage($Image, $padX, $padY, $destW, $destH)
    } else {
        $g.DrawImage($Image, 0, 0, $Width, $Height)
    }

    $g.Dispose()
    $destBmp.Save($OutPath, [System.Drawing.Imaging.ImageFormat]::Png)
    $destBmp.Dispose()
    Write-Host "Generated: $OutPath ($Width x $Height)"
}

# 1. Standard icons
Resize-Image -Image $srcImg -Width 192 -Height 192 -OutPath (Join-Path $PSScriptRoot "..\public\icon-192.png")
Resize-Image -Image $srcImg -Width 512 -Height 512 -OutPath (Join-Path $PSScriptRoot "..\public\icon-512.png")
Resize-Image -Image $srcImg -Width 180 -Height 180 -OutPath (Join-Path $PSScriptRoot "..\public\apple-touch-icon.png")
Resize-Image -Image $srcImg -Width 180 -Height 180 -OutPath (Join-Path $PSScriptRoot "..\public\apple-touch-icon-precomposed.png")
Resize-Image -Image $srcImg -Width 512 -Height 512 -OutPath (Join-Path $PSScriptRoot "..\public\logo.png")

# 2. Maskable icons for Android
Resize-Image -Image $srcImg -Width 192 -Height 192 -OutPath (Join-Path $PSScriptRoot "..\public\icon-maskable-192.png") -AddPadding $true
Resize-Image -Image $srcImg -Width 512 -Height 512 -OutPath (Join-Path $PSScriptRoot "..\public\icon-maskable-512.png") -AddPadding $true

# 3. Next.js App directory icons
Resize-Image -Image $srcImg -Width 512 -Height 512 -OutPath (Join-Path $PSScriptRoot "..\src\app\icon.png")
Resize-Image -Image $srcImg -Width 180 -Height 180 -OutPath (Join-Path $PSScriptRoot "..\src\app\apple-icon.png")

$srcImg.Dispose()
Write-Host "All PWA icons successfully generated!"
