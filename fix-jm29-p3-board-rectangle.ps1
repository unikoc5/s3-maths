Add-Type -AssemblyName System.Drawing
$ErrorActionPreference = "Stop"

# Replaces the chalk parallelogram on the blackboard with a plain chalk rectangle.
# The old strokes are removed by seamless inpainting (inverse-distance blending from
# the surrounding board pixels), so no cloned patches or visible seams remain.

$AssetDir = "C:\Users\tracy\.cursor\projects\c-Users-tracy-OneDrive-Desktop-S3-Maths\assets"

# Region of the board that contains the old chalk drawing (image coordinates, 1152 x 864).
$Region = [System.Drawing.Rectangle]::new(436, 122, 352, 178)

# The new chalk rectangle.
$RectLeft = 480
$RectTop = 138
$RectRight = 750
$RectBottom = 278

function Test-Skin([int]$R, [int]$G, [int]$B) {
    return ($R -gt 140 -and ($R - $B) -gt 42 -and $R -gt $G)
}

function Test-Chalk([int]$R, [int]$G, [int]$B) {
    $lum = ($R + $G + $B) / 3.0
    $sat = [Math]::Max($R, [Math]::Max($G, $B)) - [Math]::Min($R, [Math]::Min($G, $B))
    return ($lum -gt 106 -and $sat -lt 58 -and -not (Test-Skin $R $G $B))
}

function Test-Board([int]$R, [int]$G, [int]$B) {
    $lum = ($R + $G + $B) / 3.0
    return ($lum -lt 118 -and $G -ge ($R - 3) -and $G -ge ($B - 4))
}

function Make-RectangleScene(
    [string]$InputName,
    [string]$OutputName,
    [System.Drawing.Rectangle[]]$HandRegions
) {
    $inputPath = Join-Path $AssetDir $InputName
    $outputPath = Join-Path $AssetDir $OutputName
    $source = [System.Drawing.Bitmap]::FromFile($inputPath)
    $target = New-Object System.Drawing.Bitmap($source)
    $rand = New-Object System.Random(29)
    try {
        $w = $Region.Width
        $h = $Region.Height
        $ox = $Region.X
        $oy = $Region.Y

        # Load the region into arrays.
        $red = New-Object 'int[,]' $w, $h
        $green = New-Object 'int[,]' $w, $h
        $blue = New-Object 'int[,]' $w, $h
        $skin = New-Object 'bool[,]' $w, $h
        $chalk = New-Object 'bool[,]' $w, $h
        for ($y = 0; $y -lt $h; $y++) {
            for ($x = 0; $x -lt $w; $x++) {
                $c = $source.GetPixel($ox + $x, $oy + $y)
                $red[$x, $y] = $c.R
                $green[$x, $y] = $c.G
                $blue[$x, $y] = $c.B
                $skin[$x, $y] = Test-Skin $c.R $c.G $c.B
                $chalk[$x, $y] = Test-Chalk $c.R $c.G $c.B
            }
        }

        # Dilate the chalk mask so anti-aliased stroke edges are removed as well.
        $mask = New-Object 'bool[,]' $w, $h
        $radius = 3
        for ($y = 0; $y -lt $h; $y++) {
            for ($x = 0; $x -lt $w; $x++) {
                if (-not $chalk[$x, $y]) { continue }
                for ($dy = -$radius; $dy -le $radius; $dy++) {
                    for ($dx = -$radius; $dx -le $radius; $dx++) {
                        $mx = $x + $dx
                        $my = $y + $dy
                        if ($mx -lt 0 -or $my -lt 0 -or $mx -ge $w -or $my -ge $h) { continue }
                        if ($skin[$mx, $my]) { continue }
                        $mask[$mx, $my] = $true
                    }
                }
            }
        }

        # Estimate the board grain so the filled area is not unnaturally smooth.
        $diffSum = 0.0
        $diffCount = 0
        for ($y = 60; $y -lt 130; $y++) {
            for ($x = 130; $x -lt 200; $x++) {
                $x1 = $x + 1
                if ($mask[$x, $y] -or $mask[$x1, $y] -or $skin[$x, $y]) { continue }
                $g0 = $green[$x, $y]
                $g1 = $green[$x1, $y]
                $diffSum += [Math]::Abs($g0 - $g1)
                $diffCount++
            }
        }
        $grain = if ($diffCount -gt 0) { [Math]::Min(4.0, $diffSum / $diffCount) } else { 1.5 }

        # Inpaint every masked pixel from its nearest clean neighbours in four directions.
        $maxSearch = 40
        $directions = @(@(-1, 0), @(1, 0), @(0, -1), @(0, 1))
        for ($y = 0; $y -lt $h; $y++) {
            for ($x = 0; $x -lt $w; $x++) {
                if (-not $mask[$x, $y]) { continue }
                $sumR = 0.0; $sumG = 0.0; $sumB = 0.0; $sumW = 0.0
                foreach ($dir in $directions) {
                    for ($step = 1; $step -le $maxSearch; $step++) {
                        $sx = $x + $dir[0] * $step
                        $sy = $y + $dir[1] * $step
                        if ($sx -lt 0 -or $sy -lt 0 -or $sx -ge $w -or $sy -ge $h) { break }
                        if ($mask[$sx, $sy] -or $skin[$sx, $sy]) { continue }
                        if (-not (Test-Board $red[$sx, $sy] $green[$sx, $sy] $blue[$sx, $sy])) { break }
                        $weight = 1.0 / $step
                        $sumR += $red[$sx, $sy] * $weight
                        $sumG += $green[$sx, $sy] * $weight
                        $sumB += $blue[$sx, $sy] * $weight
                        $sumW += $weight
                        break
                    }
                }
                if ($sumW -le 0) { continue }
                $noise = ($rand.NextDouble() - 0.5) * 2.0 * $grain
                $nr = [int][Math]::Max(0, [Math]::Min(255, [Math]::Round($sumR / $sumW + $noise)))
                $ng = [int][Math]::Max(0, [Math]::Min(255, [Math]::Round($sumG / $sumW + $noise)))
                $nb = [int][Math]::Max(0, [Math]::Min(255, [Math]::Round($sumB / $sumW + $noise)))
                $target.SetPixel($ox + $x, $oy + $y, [System.Drawing.Color]::FromArgb(255, $nr, $ng, $nb))
            }
        }

        # Draw the new chalk rectangle: a soft chalk core with a faint halo.
        $graphics = [System.Drawing.Graphics]::FromImage($target)
        try {
            $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
            $edges = @(
                @($RectLeft, $RectTop, $RectRight, $RectTop),
                @($RectRight, $RectTop, $RectRight, $RectBottom),
                @($RectRight, $RectBottom, $RectLeft, $RectBottom),
                @($RectLeft, $RectBottom, $RectLeft, $RectTop)
            )
            $core = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(255, 176, 166, 150), 2.6)
            $core.StartCap = [System.Drawing.Drawing2D.LineCap]::Round
            $core.EndCap = [System.Drawing.Drawing2D.LineCap]::Round
            $halo = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(70, 176, 166, 150), 4.4)
            $halo.StartCap = [System.Drawing.Drawing2D.LineCap]::Round
            $halo.EndCap = [System.Drawing.Drawing2D.LineCap]::Round
            try {
                foreach ($e in $edges) {
                    $graphics.DrawLine($halo, [float]$e[0], [float]$e[1], [float]$e[2], [float]$e[3])
                    $graphics.DrawLine($core, [float]$e[0], [float]$e[1], [float]$e[2], [float]$e[3])
                }
            } finally {
                $core.Dispose()
                $halo.Dispose()
            }
        } finally {
            $graphics.Dispose()
        }

        # Hands stay pixel-identical and in front of the chalk drawing:
        # restore every non-board, non-chalk source pixel inside the hand regions.
        foreach ($region in $HandRegions) {
            for ($y = $region.Top; $y -lt $region.Bottom; $y++) {
                for ($x = $region.Left; $x -lt $region.Right; $x++) {
                    $c = $source.GetPixel($x, $y)
                    if ((Test-Board $c.R $c.G $c.B) -or (Test-Chalk $c.R $c.G $c.B)) { continue }
                    $target.SetPixel($x, $y, $c)
                }
            }
        }

        $target.Save($outputPath, [System.Drawing.Imaging.ImageFormat]::Png)
    } finally {
        $target.Dispose()
        $source.Dispose()
    }
    Write-Output $outputPath
}

Make-RectangleScene `
    "jm29-v11-p3-01-ming-realises-sze-braids.png" `
    "jm29-v13-p3-01-ming-realises-board-rectangle.png" `
    @([System.Drawing.Rectangle]::new(600, 250, 110, 90))

Make-RectangleScene `
    "jm29-v11-p3-02-ming-guesses-sze-braids.png" `
    "jm29-v13-p3-02-ming-guesses-board-rectangle.png" `
    @(
        [System.Drawing.Rectangle]::new(440, 235, 100, 85),
        [System.Drawing.Rectangle]::new(600, 245, 110, 90)
    )

Make-RectangleScene `
    "jm29-v11-p3-04-ms-tam-warning-sze-braids.png" `
    "jm29-v13-p3-04-ms-tam-warning-board-rectangle.png" `
    @([System.Drawing.Rectangle]::new(450, 245, 110, 95))
