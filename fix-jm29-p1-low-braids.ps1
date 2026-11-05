Add-Type -AssemblyName System.Drawing
$ErrorActionPreference = "Stop"

$AssetDir = "C:\Users\tracy\.cursor\projects\c-Users-tracy-OneDrive-Desktop-S3-Maths\assets"
# v13: braids gathered low at the nape (edit v2). Only the girl's region is taken from
# the edited image; Ms Tam and Ming keep the original pixels.
$OriginalPath = Join-Path $AssetDir "jm29-v11-p1-03-ming-speaks-sze-braids.png"
$EditedPath = Join-Path $AssetDir "jm29-p1-panel3-low-braids-edit-v2.png"
$OutputPath = Join-Path $AssetDir "jm29-v13-p1-03-ming-speaks-sze-low-braids.png"

function Get-Pixels([System.Drawing.Bitmap]$Bitmap) {
    $rect = [System.Drawing.Rectangle]::new(0, 0, $Bitmap.Width, $Bitmap.Height)
    $data = $Bitmap.LockBits(
        $rect,
        [System.Drawing.Imaging.ImageLockMode]::ReadOnly,
        [System.Drawing.Imaging.PixelFormat]::Format32bppArgb
    )
    try {
        $bytes = New-Object byte[] ($data.Stride * $data.Height)
        [System.Runtime.InteropServices.Marshal]::Copy($data.Scan0, $bytes, 0, $bytes.Length)
        return @{ Bytes = $bytes; Stride = $data.Stride }
    } finally {
        $Bitmap.UnlockBits($data)
    }
}

function Smooth-Step([double]$Value) {
    $t = [Math]::Max(0.0, [Math]::Min(1.0, $Value))
    return $t * $t * (3.0 - 2.0 * $t)
}

# The girl occupies x >= ~895; Ms Tam's right edge never exceeds x = 885.
# The fade band 884..894 sits in the wall gap between them.
$MaskLeft = 884
$MaskTop = 105
$MaskBottom = 585

function Get-GirlHairAlpha([int]$X, [int]$Y) {
    if ($X -lt $MaskLeft -or $Y -lt $MaskTop -or $Y -gt $MaskBottom) { return 0.0 }

    $leftFade = Smooth-Step (($X - $MaskLeft) / 10.0)
    $topFade = Smooth-Step (($Y - $MaskTop) / 20.0)
    $bottomFade = Smooth-Step (($MaskBottom - $Y) / 40.0)
    return [Math]::Min($leftFade, [Math]::Min($topFade, $bottomFade))
}

$original = [System.Drawing.Bitmap]::FromFile($OriginalPath)
$edited = [System.Drawing.Bitmap]::FromFile($EditedPath)
try {
    if ($original.Width -ne $edited.Width -or $original.Height -ne $edited.Height) {
        throw "Original and edited images must have matching dimensions."
    }

    $source = Get-Pixels $original
    $replacement = Get-Pixels $edited
    $resultBytes = New-Object byte[] $source.Bytes.Length
    [Array]::Copy($source.Bytes, $resultBytes, $source.Bytes.Length)

    for ($y = $MaskTop; $y -le $MaskBottom; $y++) {
        for ($x = ($MaskLeft - 12); $x -lt $original.Width; $x++) {
            $alpha = Get-GirlHairAlpha $x $y
            $offset = $y * $source.Stride + $x * 4

            # The tip of the old left braid (x 872..894, y 320..500) sits in the narrow wall gap
            # beside Ms Tam's sleeve. Where the edited image shows plain wall there, take it fully;
            # dark (sleeve) pixels keep the ordinary mask so Ms Tam is untouched.
            if ($alpha -lt 1.0 -and $x -ge 872 -and $y -ge 320 -and $y -le 500) {
                $editLum = ($replacement.Bytes[$offset] + $replacement.Bytes[$offset + 1] + $replacement.Bytes[$offset + 2]) / 3.0
                if ($editLum -gt 170) { $alpha = 1.0 }
            }
            if ($alpha -le 0.0) { continue }
            for ($channel = 0; $channel -lt 3; $channel++) {
                $oldValue = $source.Bytes[$offset + $channel]
                $newValue = $replacement.Bytes[$offset + $channel]
                $resultBytes[$offset + $channel] = [byte][Math]::Round(
                    $oldValue * (1.0 - $alpha) + $newValue * $alpha
                )
            }
        }
    }

    $result = New-Object System.Drawing.Bitmap(
        $original.Width,
        $original.Height,
        [System.Drawing.Imaging.PixelFormat]::Format32bppArgb
    )
    try {
        $rect = [System.Drawing.Rectangle]::new(0, 0, $result.Width, $result.Height)
        $data = $result.LockBits(
            $rect,
            [System.Drawing.Imaging.ImageLockMode]::WriteOnly,
            [System.Drawing.Imaging.PixelFormat]::Format32bppArgb
        )
        try {
            [System.Runtime.InteropServices.Marshal]::Copy(
                $resultBytes,
                0,
                $data.Scan0,
                $resultBytes.Length
            )
        } finally {
            $result.UnlockBits($data)
        }
        $result.Save($OutputPath, [System.Drawing.Imaging.ImageFormat]::Png)
    } finally {
        $result.Dispose()
    }
} finally {
    $original.Dispose()
    $edited.Dispose()
}

Write-Output $OutputPath
