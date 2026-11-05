Add-Type -AssemblyName System.Drawing
$ErrorActionPreference = "Stop"

$AssetDir = "C:\Users\tracy\.cursor\projects\c-Users-tracy-OneDrive-Desktop-S3-Maths\assets"
$OutDir = "C:\Users\tracy\Desktop\S3-unikoc5-homepage\topics\quadrilaterals\comics"

$PageW = 1440
$PageH = 1920
$TitleH = 82
$Gap = 8
$PanelW = 708
$PanelH = 604
$X = @(8, 724)
$Y = @(86, 698, 1310)

function New-Brush([int]$a, [int]$r, [int]$g, [int]$b) {
    return New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb($a, $r, $g, $b))
}

function New-Pen($color, [float]$width) {
    return New-Object -TypeName System.Drawing.Pen -ArgumentList @($color, $width)
}

function New-Font([string]$family, [float]$size, [bool]$bold = $true) {
    $style = if ($bold) { [System.Drawing.FontStyle]::Bold } else { [System.Drawing.FontStyle]::Regular }
    return New-Object System.Drawing.Font($family, $size, $style, [System.Drawing.GraphicsUnit]::Pixel)
}

function New-Page {
    $bmp = New-Object System.Drawing.Bitmap($PageW, $PageH)
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    $g.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::AntiAliasGridFit
    $paper = New-Brush 255 250 247 239
    $g.FillRectangle($paper, 0, 0, $PageW, $PageH)
    $paper.Dispose()
    return @($bmp, $g)
}

function Draw-CoverImage($g, [string]$path, [System.Drawing.Rectangle]$dest) {
    $img = [System.Drawing.Image]::FromFile($path)
    try {
        $sourceRatio = $img.Width / [double]$img.Height
        $destRatio = $dest.Width / [double]$dest.Height
        if ($sourceRatio -gt $destRatio) {
            $srcH = $img.Height
            $srcW = [int]($srcH * $destRatio)
            $srcX = [int](($img.Width - $srcW) / 2)
            $srcY = 0
        } else {
            $srcW = $img.Width
            $srcH = [int]($srcW / $destRatio)
            $srcX = 0
            $srcY = [int](($img.Height - $srcH) / 2)
        }
        $src = New-Object System.Drawing.Rectangle($srcX, $srcY, $srcW, $srcH)
        $g.DrawImage($img, $dest, $src, [System.Drawing.GraphicsUnit]::Pixel)
    } finally {
        $img.Dispose()
    }
}

function Rounded-Path([System.Drawing.RectangleF]$r, [float]$radius) {
    $d = $radius * 2
    $path = New-Object System.Drawing.Drawing2D.GraphicsPath
    $path.AddArc($r.X, $r.Y, $d, $d, 180, 90)
    $path.AddArc($r.Right - $d, $r.Y, $d, $d, 270, 90)
    $path.AddArc($r.Right - $d, $r.Bottom - $d, $d, $d, 0, 90)
    $path.AddArc($r.X, $r.Bottom - $d, $d, $d, 90, 90)
    $path.CloseFigure()
    return $path
}

function Draw-RoundedBox(
    $g,
    [System.Drawing.RectangleF]$rect,
    $fill,
    $stroke,
    [float]$strokeWidth = 3,
    [float]$radius = 18
) {
    $path = Rounded-Path $rect $radius
    $brush = New-Object System.Drawing.SolidBrush $fill
    $pen = New-Pen $stroke $strokeWidth
    $g.FillPath($brush, $path)
    $g.DrawPath($pen, $path)
    $brush.Dispose()
    $pen.Dispose()
    $path.Dispose()
}

function Draw-FitText(
    $g,
    [string]$text,
    [System.Drawing.RectangleF]$rect,
    [float]$maxSize,
    [float]$minSize,
    $color,
    [bool]$bold = $true,
    [System.Drawing.StringAlignment]$align = [System.Drawing.StringAlignment]::Center
) {
    $format = New-Object System.Drawing.StringFormat
    $format.Alignment = $align
    $format.LineAlignment = [System.Drawing.StringAlignment]::Center
    $format.Trimming = [System.Drawing.StringTrimming]::Word
    $format.FormatFlags = [System.Drawing.StringFormatFlags]::LineLimit
    $font = $null
    for ($size = $maxSize; $size -ge $minSize; $size -= 1) {
        if ($font) { $font.Dispose() }
        $font = New-Font "Arial" $size $bold
        $measured = $g.MeasureString($text, $font, [int]$rect.Width, $format)
        if ($measured.Height -le $rect.Height -and $measured.Width -le $rect.Width + 2) { break }
    }
    $brush = New-Object System.Drawing.SolidBrush $color
    $g.DrawString($text, $font, $brush, $rect, $format)
    $brush.Dispose()
    $font.Dispose()
    $format.Dispose()
}

function Draw-Bubble($g, [System.Drawing.RectangleF]$rect, [string]$text, [string]$tail = "none", [float]$maxSize = 27) {
    $fill = [System.Drawing.Color]::FromArgb(244, 255, 255, 255)
    $stroke = [System.Drawing.Color]::FromArgb(255, 23, 32, 42)
    Draw-RoundedBox $g $rect $fill $stroke 3 28

    if ($tail -ne "none") {
        $path = New-Object System.Drawing.Drawing2D.GraphicsPath
        if ($tail -eq "br") {
            $pts = [System.Drawing.PointF[]]@(
                [System.Drawing.PointF]::new($rect.Right - 70, $rect.Bottom - 4),
                [System.Drawing.PointF]::new($rect.Right - 28, $rect.Bottom - 4),
                [System.Drawing.PointF]::new($rect.Right - 18, $rect.Bottom + 34)
            )
        } elseif ($tail -eq "bl") {
            $pts = [System.Drawing.PointF[]]@(
                [System.Drawing.PointF]::new($rect.X + 28, $rect.Bottom - 4),
                [System.Drawing.PointF]::new($rect.X + 70, $rect.Bottom - 4),
                [System.Drawing.PointF]::new($rect.X + 18, $rect.Bottom + 34)
            )
        } elseif ($tail -eq "tr") {
            $pts = [System.Drawing.PointF[]]@(
                [System.Drawing.PointF]::new($rect.Right - 70, $rect.Y + 4),
                [System.Drawing.PointF]::new($rect.Right - 28, $rect.Y + 4),
                [System.Drawing.PointF]::new($rect.Right - 18, $rect.Y - 30)
            )
        } else {
            $pts = [System.Drawing.PointF[]]@(
                [System.Drawing.PointF]::new($rect.X + 28, $rect.Y + 4),
                [System.Drawing.PointF]::new($rect.X + 70, $rect.Y + 4),
                [System.Drawing.PointF]::new($rect.X + 18, $rect.Y - 30)
            )
        }
        $path.AddPolygon($pts)
        $brush = New-Object System.Drawing.SolidBrush $fill
        $pen = New-Pen $stroke 3
        $g.FillPath($brush, $path)
        $g.DrawPath($pen, $path)
        $brush.Dispose(); $pen.Dispose(); $path.Dispose()
    }

    $textRect = [System.Drawing.RectangleF]::new($rect.X + 18, $rect.Y + 12, $rect.Width - 36, $rect.Height - 24)
    Draw-FitText $g $text $textRect $maxSize 17 ([System.Drawing.Color]::FromArgb(255, 24, 31, 42)) $true
}

function Draw-Card(
    $g,
    [System.Drawing.RectangleF]$rect,
    [string]$text,
    [string]$theme = "blue",
    [float]$maxSize = 25
) {
    if ($theme -eq "green") {
        $fill = [System.Drawing.Color]::FromArgb(238, 239, 252, 241)
        $stroke = [System.Drawing.Color]::FromArgb(255, 38, 126, 74)
        $ink = [System.Drawing.Color]::FromArgb(255, 22, 102, 58)
    } elseif ($theme -eq "yellow") {
        $fill = [System.Drawing.Color]::FromArgb(245, 255, 238, 145)
        $stroke = [System.Drawing.Color]::FromArgb(255, 92, 76, 26)
        $ink = [System.Drawing.Color]::FromArgb(255, 46, 40, 22)
    } elseif ($theme -eq "red") {
        $fill = [System.Drawing.Color]::FromArgb(241, 255, 242, 238)
        $stroke = [System.Drawing.Color]::FromArgb(255, 183, 54, 40)
        $ink = [System.Drawing.Color]::FromArgb(255, 150, 44, 34)
    } else {
        $fill = [System.Drawing.Color]::FromArgb(240, 242, 249, 255)
        $stroke = [System.Drawing.Color]::FromArgb(255, 35, 93, 163)
        $ink = [System.Drawing.Color]::FromArgb(255, 25, 72, 132)
    }
    Draw-RoundedBox $g $rect $fill $stroke 3 14
    $textRect = [System.Drawing.RectangleF]::new($rect.X + 14, $rect.Y + 8, $rect.Width - 28, $rect.Height - 16)
    Draw-FitText $g $text $textRect $maxSize 15 $ink $true
}

function Draw-PageTitle($g, [string]$title) {
    $brush = New-Brush 255 250 247 239
    $g.FillRectangle($brush, 0, 0, $PageW, $TitleH)
    $brush.Dispose()
    $ink = [System.Drawing.Color]::FromArgb(255, 16, 26, 38)
    $r = [System.Drawing.RectangleF]::new(20, 4, $PageW - 40, $TitleH - 8)
    Draw-FitText $g $title $r 38 25 $ink $true
    $pen = New-Pen ([System.Drawing.Color]::FromArgb(255, 10, 16, 24)) 5
    $g.DrawLine($pen, 0, $TitleH - 2, $PageW, $TitleH - 2)
    $pen.Dispose()
}

function Draw-Panel($g, [int]$col, [int]$row, [string]$imageName, [int]$number, [string]$heading) {
    $px = $X[$col]
    $py = $Y[$row]
    $rect = New-Object System.Drawing.Rectangle($px, $py, $PanelW, $PanelH)
    Draw-CoverImage $g (Join-Path $AssetDir $imageName) $rect

    $headerBrush = New-Brush 226 252 248 236
    $g.FillRectangle($headerBrush, $px, $py, $PanelW, 48)
    $headerBrush.Dispose()

    $circleBrush = New-Brush 255 21 76 139
    $g.FillEllipse($circleBrush, $px + 8, $py + 5, 38, 38)
    $circleBrush.Dispose()
    $numRect = [System.Drawing.RectangleF]::new($px + 8, $py + 4, 38, 39)
    Draw-FitText $g ([string]$number) $numRect 26 22 ([System.Drawing.Color]::White) $true

    $headRect = [System.Drawing.RectangleF]::new($px + 52, $py + 2, $PanelW - 60, 44)
    Draw-FitText $g $heading $headRect 26 18 ([System.Drawing.Color]::FromArgb(255, 20, 70, 124)) $true ([System.Drawing.StringAlignment]::Near)

    $border = New-Pen ([System.Drawing.Color]::FromArgb(255, 15, 20, 28)) 5
    $g.DrawRectangle($border, $rect)
    $border.Dispose()
}

function Draw-SegmentMark($g, [float]$x1, [float]$y1, [float]$x2, [float]$y2, [string]$kind, [int]$count, $color) {
    $dx = $x2 - $x1
    $dy = $y2 - $y1
    $len = [Math]::Sqrt($dx * $dx + $dy * $dy)
    $ux = $dx / $len
    $uy = $dy / $len
    $px = -$uy
    $py = $ux
    $cx = ($x1 + $x2) / 2
    $cy = ($y1 + $y2) / 2
    $pen = New-Pen $color 4
    for ($i = 0; $i -lt $count; $i++) {
        $offset = ($i - ($count - 1) / 2.0) * 11
        $mx = $cx + $ux * $offset
        $my = $cy + $uy * $offset
        if ($kind -eq "tick") {
            $g.DrawLine($pen, $mx - $px * 10, $my - $py * 10, $mx + $px * 10, $my + $py * 10)
        } else {
            $tipX = $mx + $ux * 5
            $tipY = $my + $uy * 5
            $g.DrawLine($pen, $tipX - $ux * 13 + $px * 8, $tipY - $uy * 13 + $py * 8, $tipX, $tipY)
            $g.DrawLine($pen, $tipX - $ux * 13 - $px * 8, $tipY - $uy * 13 - $py * 8, $tipX, $tipY)
        }
    }
    $pen.Dispose()
}

function Draw-AngleArc($g, [float]$vx, [float]$vy, [float]$ax, [float]$ay, [float]$bx, [float]$by, [float]$radius, $color, [float]$width = 4) {
    $a1 = [Math]::Atan2($ay - $vy, $ax - $vx) * 180 / [Math]::PI
    $a2 = [Math]::Atan2($by - $vy, $bx - $vx) * 180 / [Math]::PI
    $sweep = $a2 - $a1
    while ($sweep -le -180) { $sweep += 360 }
    while ($sweep -gt 180) { $sweep -= 360 }
    $pen = New-Pen $color $width
    $g.DrawArc($pen, $vx - $radius, $vy - $radius, $radius * 2, $radius * 2, $a1, $sweep)
    $pen.Dispose()
}

function Draw-RightAngle($g, [float]$vx, [float]$vy, [float]$ax, [float]$ay, [float]$bx, [float]$by, [float]$size, $color) {
    $dx1 = $ax - $vx; $dy1 = $ay - $vy
    $l1 = [Math]::Sqrt($dx1 * $dx1 + $dy1 * $dy1)
    $dx2 = $bx - $vx; $dy2 = $by - $vy
    $l2 = [Math]::Sqrt($dx2 * $dx2 + $dy2 * $dy2)
    $ux1 = $dx1 / $l1; $uy1 = $dy1 / $l1
    $ux2 = $dx2 / $l2; $uy2 = $dy2 / $l2
    $p1x = $vx + $ux1 * $size; $p1y = $vy + $uy1 * $size
    $p2x = $vx + $ux2 * $size; $p2y = $vy + $uy2 * $size
    $cornerX = $p1x + $ux2 * $size; $cornerY = $p1y + $uy2 * $size
    $pen = New-Pen $color 4
    $g.DrawLine($pen, $p1x, $p1y, $cornerX, $cornerY)
    $g.DrawLine($pen, $p2x, $p2y, $cornerX, $cornerY)
    $pen.Dispose()
}

function Save-Page($bmp, $g, [string]$filename) {
    $g.Dispose()
    $path = Join-Path $OutDir $filename
    $bmp.Save($path, [System.Drawing.Imaging.ImageFormat]::Png)
    $bmp.Dispose()
    Write-Output "Saved $path"
}

function Make-P01 {
    $page = New-Page
    $bmp = $page[0]
    $g = $page[1]
    Draw-PageTitle $g "QUADRILATERALS QUEST — PAGE 1: SHAPES ALL AROUND US"

    Draw-Panel $g 0 0 "jm29-v6-p01-01.png" 1 "COURTYARD EXPLORATION"
    Draw-Bubble $g ([System.Drawing.RectangleF]::new(32, 160, 360, 152)) "Geometry isn't trapped in a textbook. Let's go shape spotting!" "br" 26
    Draw-Card $g ([System.Drawing.RectangleF]::new(470, 106, 205, 74)) "AROUND SCHOOL..." "yellow" 24

    Draw-Panel $g 1 0 "jm29-v6-p01-02.png" 2 "THE CLASSROOM WINDOW"
    Draw-Bubble $g ([System.Drawing.RectangleF]::new(742, 154, 276, 108)) "Four straight sides and four vertices!" "br" 25
    Draw-Bubble $g ([System.Drawing.RectangleF]::new(1114, 138, 282, 104)) "That makes it a quadrilateral." "bl" 24
    Draw-Card $g ([System.Drawing.RectangleF]::new(1055, 575, 340, 94)) "QUADRILATERAL = A 4-SIDED POLYGON" "blue" 25

    Draw-Panel $g 0 1 "jm29-v6-p01-03.png" 3 "SHAPES IN MOTION"
    Draw-Bubble $g ([System.Drawing.RectangleF]::new(30, 765, 310, 120)) "They look different, but they all have four sides!" "br" 24
    Draw-Bubble $g ([System.Drawing.RectangleF]::new(390, 750, 286, 118)) "We need clues to tell the families apart." "bl" 23

    Draw-Panel $g 1 1 "jm29-v6-p01-04.png" 4 "READ THE SIDE MARKS"
    $card4 = [System.Drawing.RectangleF]::new(994, 1057, 410, 208)
    Draw-RoundedBox $g $card4 ([System.Drawing.Color]::FromArgb(231, 246, 251, 255)) ([System.Drawing.Color]::FromArgb(255, 30, 88, 150)) 3 16
    Draw-FitText $g "chevrons = parallel" ([System.Drawing.RectangleF]::new(1010, 1065, 375, 38)) 23 18 ([System.Drawing.Color]::FromArgb(255, 24, 74, 132)) $true
    $blue = [System.Drawing.Color]::FromArgb(255, 32, 104, 188)
    $green = [System.Drawing.Color]::FromArgb(255, 35, 132, 79)
    $pen = New-Pen $blue 4
    $g.DrawLine($pen, 1030, 1120, 1360, 1120)
    $g.DrawLine($pen, 1030, 1156, 1360, 1156)
    $pen.Dispose()
    Draw-SegmentMark $g 1030 1120 1360 1120 "chevron" 1 $blue
    Draw-SegmentMark $g 1030 1156 1360 1156 "chevron" 1 $blue
    Draw-FitText $g "ticks = equal length" ([System.Drawing.RectangleF]::new(1010, 1170, 375, 34)) 22 18 $green $true
    $pen = New-Pen $green 4
    $g.DrawLine($pen, 1030, 1218, 1360, 1218)
    $g.DrawLine($pen, 1030, 1250, 1360, 1250)
    $pen.Dispose()
    Draw-SegmentMark $g 1030 1218 1360 1218 "tick" 1 $green
    Draw-SegmentMark $g 1030 1250 1360 1250 "tick" 1 $green

    Draw-Panel $g 0 2 "jm29-v6-p01-05.png" 5 "READ THE ANGLE MARKS"
    Draw-Bubble $g ([System.Drawing.RectangleF]::new(30, 1386, 290, 110)) "The marks tell us what is guaranteed." "br" 24
    $card5 = [System.Drawing.RectangleF]::new(34, 1650, 640, 225)
    Draw-RoundedBox $g $card5 ([System.Drawing.Color]::FromArgb(231, 255, 252, 243)) ([System.Drawing.Color]::FromArgb(255, 45, 120, 74)) 3 16
    $ink = [System.Drawing.Color]::FromArgb(255, 24, 42, 55)
    $pen = New-Pen $ink 4
    $g.DrawLine($pen, 100, 1760, 205, 1715)
    $g.DrawLine($pen, 100, 1760, 205, 1805)
    $g.DrawLine($pen, 290, 1760, 395, 1715)
    $g.DrawLine($pen, 290, 1760, 395, 1805)
    $g.DrawLine($pen, 485, 1822, 610, 1822)
    $g.DrawLine($pen, 485, 1822, 485, 1702)
    $pen.Dispose()
    Draw-AngleArc $g 100 1760 205 1715 205 1805 32 $blue
    Draw-AngleArc $g 290 1760 395 1715 395 1805 32 $blue
    Draw-RightAngle $g 485 1822 610 1822 485 1702 24 $green
    Draw-FitText $g "same arcs = equal angles" ([System.Drawing.RectangleF]::new(60, 1662, 360, 44)) 23 18 $blue $true
    Draw-FitText $g "small square = 90°" ([System.Drawing.RectangleF]::new(430, 1662, 220, 44)) 22 17 $green $true

    Draw-Panel $g 1 2 "jm29-v6-p01-06.png" 6 "IMPORTANT REMINDER"
    Draw-Bubble $g ([System.Drawing.RectangleF]::new(750, 1384, 310, 112)) "Read the markings — not just the look!" "br" 25
    Draw-Card $g ([System.Drawing.RectangleF]::new(936, 1750, 440, 116)) "A DIAGRAM MAY NOT BE DRAWN TO SCALE." "green" 27

    Save-Page $bmp $g "v6-01-shapes-around-us.png"
}

if ($args.Count -eq 0 -or $args -contains "p01") {
    Make-P01
}
