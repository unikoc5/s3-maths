Add-Type -AssemblyName System.Drawing
$ErrorActionPreference = "Stop"

$assetDir = "C:\Users\tracy\.cursor\projects\c-Users-tracy-OneDrive-Desktop-S3-Maths\assets"
$s3 = "C:\Users\tracy\OneDrive\Desktop\S3 Maths\math-s3\dashboard\topics"

function Load-Bitmap([string]$path) {
    $img = [System.Drawing.Image]::FromFile($path)
    try { return New-Object System.Drawing.Bitmap($img) }
    finally { $img.Dispose() }
}

function Draw-Crop($g, $img, [System.Drawing.Rectangle]$dest, [double]$x, [double]$y, [double]$w, [double]$h) {
    $src = New-Object System.Drawing.Rectangle(
        [int]($img.Width * $x),
        [int]($img.Height * $y),
        [int]($img.Width * $w),
        [int]($img.Height * $h)
    )
    $g.DrawImage($img, $dest, $src, [System.Drawing.GraphicsUnit]::Pixel)
}

# Fixed cast reference: accepted Ms Tam plus the established boy and girl.
$cast = New-Object System.Drawing.Bitmap(1100, 720)
$g = [System.Drawing.Graphics]::FromImage($cast)
$g.Clear([System.Drawing.Color]::FromArgb(255, 249, 238))
$g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
$ms = Load-Bitmap (Join-Path $assetDir "c__Users_tracy_AppData_Roaming_Cursor_User_workspaceStorage_f4ab8d5b2c993e0b72240fe0d4e9c8cb_images_Ms-Tam-______-____-b9295bc0-5ffc-4ff2-950b-f19455952e0e.png")
$students = Load-Bitmap (Join-Path $assetDir "jm29-students-style-crop.png")
$g.DrawImage($ms, (New-Object System.Drawing.Rectangle(10, 10, 520, 693)))
$g.DrawImage($students, (New-Object System.Drawing.Rectangle(600, 25, 430, 680)))
$pen = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(25, 83, 120), 5)
$g.DrawLine($pen, 565, 35, 565, 685)
$pen.Dispose()
$ms.Dispose()
$students.Dispose()
$g.Dispose()
$cast.Save((Join-Path $assetDir "jm29-v5-fixed-cast.png"), [System.Drawing.Imaging.ImageFormat]::Png)
$cast.Dispose()

# Character-free JM31-35 style board: environmental panels, diagram cards and dense compositions only.
$style = New-Object System.Drawing.Bitmap(1200, 800)
$g = [System.Drawing.Graphics]::FromImage($style)
$g.Clear([System.Drawing.Color]::White)
$g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic

$incline = Load-Bitmap (Join-Path $s3 "trigonometry_applications\comics\01-inclination-ramp.png")
$map = Load-Bitmap (Join-Path $s3 "trigonometry_applications\comics\03-map-scale.png")
$coord = Load-Bitmap (Join-Path $s3 "coordinates\comics\01-distance-3-4-5.png")
$mean = Load-Bitmap (Join-Path $s3 "central_tendency\comics\01-mean-equal-tea.png")
$trig = Load-Bitmap (Join-Path $s3 "trigonometry\comics\01-lunchbox-45.png")

Draw-Crop $g $incline (New-Object System.Drawing.Rectangle(0, 0, 600, 245)) 0.52 0.04 0.48 0.18
Draw-Crop $g $map (New-Object System.Drawing.Rectangle(600, 0, 600, 245)) 0.63 0.19 0.37 0.20
Draw-Crop $g $coord (New-Object System.Drawing.Rectangle(0, 255, 600, 260)) 0.00 0.41 0.55 0.17
Draw-Crop $g $mean (New-Object System.Drawing.Rectangle(600, 255, 600, 260)) 0.00 0.68 0.47 0.31
Draw-Crop $g $trig (New-Object System.Drawing.Rectangle(0, 525, 600, 275)) 0.52 0.05 0.27 0.26
Draw-Crop $g $map (New-Object System.Drawing.Rectangle(600, 525, 600, 275)) 0.54 0.71 0.30 0.27

$line = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(18, 24, 35), 8)
$g.DrawRectangle($line, 2, 2, 1195, 795)
$g.DrawLine($line, 600, 0, 600, 800)
$g.DrawLine($line, 0, 250, 1200, 250)
$g.DrawLine($line, 0, 520, 1200, 520)
$line.Dispose()

$incline.Dispose()
$map.Dispose()
$coord.Dispose()
$mean.Dispose()
$trig.Dispose()
$g.Dispose()
$style.Save((Join-Path $assetDir "jm31-35-layout-style-no-characters.png"), [System.Drawing.Imaging.ImageFormat]::Png)
$style.Dispose()

Write-Output "Created fixed-cast and character-free style references."
