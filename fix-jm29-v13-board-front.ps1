Add-Type -AssemblyName System.Drawing
$ErrorActionPreference = "Stop"

# Straightens the generated front-facing board so that its side edges are exactly
# vertical (the generated image had ~1 degree of residual perspective).
# Each row is rescaled horizontally so the inner frame edges land on fixed columns.

$AssetDir = "C:\Users\tracy\.cursor\projects\c-Users-tracy-OneDrive-Desktop-S3-Maths\assets"
$inputPath = Join-Path $AssetDir "jm29-v13-board-front.png"
$outputPath = Join-Path $AssetDir "jm29-v13-board-front-rect.png"

# Measured inner frame edges (x) as a function of y in the generated image.
function LeftEdge([double]$Y) { return 153.0 - 0.02353 * ($Y - 180.0) }
function RightEdge([double]$Y) { return 1017.0 + 0.02550 * ($Y - 180.0) }
$TargetLeft = 147.0
$TargetRight = 1023.0

$source = [System.Drawing.Bitmap]::FromFile($inputPath)
$w = $source.Width
$h = $source.Height
$target = New-Object System.Drawing.Bitmap($w, $h, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)

$rect = [System.Drawing.Rectangle]::new(0, 0, $w, $h)
$srcData = $source.LockBits($rect, [System.Drawing.Imaging.ImageLockMode]::ReadOnly, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
$dstData = $target.LockBits($rect, [System.Drawing.Imaging.ImageLockMode]::WriteOnly, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
try {
    $stride = $srcData.Stride
    $srcBytes = New-Object byte[] ($stride * $h)
    $dstBytes = New-Object byte[] ($stride * $h)
    [System.Runtime.InteropServices.Marshal]::Copy($srcData.Scan0, $srcBytes, 0, $srcBytes.Length)

    for ($y = 0; $y -lt $h; $y++) {
        $left = LeftEdge $y
        $right = RightEdge $y
        $scale = ($right - $left) / ($TargetRight - $TargetLeft)
        $rowOffset = $y * $stride
        for ($x = 0; $x -lt $w; $x++) {
            $sx = $left + ($x - $TargetLeft) * $scale
            if ($sx -lt 0) { $sx = 0 }
            if ($sx -gt ($w - 1)) { $sx = $w - 1 }
            $x0 = [int][Math]::Floor($sx)
            $x1 = [Math]::Min($w - 1, $x0 + 1)
            $t = $sx - $x0
            $i0 = $rowOffset + $x0 * 4
            $i1 = $rowOffset + $x1 * 4
            $o = $rowOffset + $x * 4
            for ($c = 0; $c -lt 3; $c++) {
                $v = $srcBytes[$i0 + $c] * (1.0 - $t) + $srcBytes[$i1 + $c] * $t
                $dstBytes[$o + $c] = [byte][Math]::Round($v)
            }
            $dstBytes[$o + 3] = 255
        }
    }
    [System.Runtime.InteropServices.Marshal]::Copy($dstBytes, 0, $dstData.Scan0, $dstBytes.Length)
} finally {
    $source.UnlockBits($srcData)
    $target.UnlockBits($dstData)
}
$target.Save($outputPath, [System.Drawing.Imaging.ImageFormat]::Png)
$target.Dispose()
$source.Dispose()
Write-Output $outputPath
