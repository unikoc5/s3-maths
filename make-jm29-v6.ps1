Add-Type -AssemblyName System.Drawing
$ErrorActionPreference = "Stop"

$AssetDir = "C:\Users\tracy\.cursor\projects\c-Users-tracy-OneDrive-Desktop-S3-Maths\assets"
$ComicDir = "C:\Users\tracy\Desktop\S3-unikoc5-homepage\topics\quadrilaterals\comics"
$DesktopDir = "C:\Users\tracy\Desktop"
$PageWidth = 1200
$PageHeight = 1600

function Load-Bitmap([string]$Path) {
    $image = [System.Drawing.Image]::FromFile($Path)
    try { return New-Object System.Drawing.Bitmap($image) }
    finally { $image.Dispose() }
}

function New-Pen([System.Drawing.Color]$Color, [float]$Width) {
    return New-Object System.Drawing.Pen($Color, $Width)
}

function New-Brush([System.Drawing.Color]$Color) {
    return New-Object System.Drawing.SolidBrush($Color)
}

function New-RoundedPath([System.Drawing.RectangleF]$Rect, [float]$Radius) {
    $path = New-Object System.Drawing.Drawing2D.GraphicsPath
    $diameter = $Radius * 2
    $path.AddArc($Rect.X, $Rect.Y, $diameter, $diameter, 180, 90)
    $path.AddArc($Rect.Right - $diameter, $Rect.Y, $diameter, $diameter, 270, 90)
    $path.AddArc($Rect.Right - $diameter, $Rect.Bottom - $diameter, $diameter, $diameter, 0, 90)
    $path.AddArc($Rect.X, $Rect.Bottom - $diameter, $diameter, $diameter, 90, 90)
    $path.CloseFigure()
    return $path
}

function Draw-CoverImage(
    [System.Drawing.Graphics]$Graphics,
    [System.Drawing.Bitmap]$Bitmap,
    [System.Drawing.Rectangle]$Destination
) {
    $sourceRatio = $Bitmap.Width / [double]$Bitmap.Height
    $destinationRatio = $Destination.Width / [double]$Destination.Height
    if ($sourceRatio -gt $destinationRatio) {
        $sourceHeight = $Bitmap.Height
        $sourceWidth = [int]($sourceHeight * $destinationRatio)
        $sourceX = [int](($Bitmap.Width - $sourceWidth) / 2)
        $sourceY = 0
    } else {
        $sourceWidth = $Bitmap.Width
        $sourceHeight = [int]($sourceWidth / $destinationRatio)
        $sourceX = 0
        $sourceY = [int](($Bitmap.Height - $sourceHeight) / 2)
    }
    $source = New-Object System.Drawing.Rectangle($sourceX, $sourceY, $sourceWidth, $sourceHeight)
    $Graphics.DrawImage($Bitmap, $Destination, $source, [System.Drawing.GraphicsUnit]::Pixel)
}

function Draw-FittedText(
    [System.Drawing.Graphics]$Graphics,
    [string]$Text,
    [System.Drawing.RectangleF]$Rect,
    [float]$MaxSize,
    [float]$MinSize,
    [System.Drawing.Color]$Color,
    [System.Drawing.FontStyle]$Style = [System.Drawing.FontStyle]::Bold,
    [System.Drawing.StringAlignment]$Alignment = [System.Drawing.StringAlignment]::Center
) {
    $format = New-Object System.Drawing.StringFormat
    $format.Alignment = $Alignment
    $format.LineAlignment = [System.Drawing.StringAlignment]::Center
    $format.Trimming = [System.Drawing.StringTrimming]::Word
    $format.FormatFlags = [System.Drawing.StringFormatFlags]::LineLimit
    $brush = New-Brush $Color
    $chosen = $null
    for ($size = $MaxSize; $size -ge $MinSize; $size -= 1) {
        if ($chosen) { $chosen.Dispose() }
        $chosen = New-Object System.Drawing.Font("Arial", $size, $Style, [System.Drawing.GraphicsUnit]::Pixel)
        $measured = $Graphics.MeasureString($Text, $chosen, [int]$Rect.Width, $format)
        if ($measured.Height -le $Rect.Height -and $measured.Width -le ($Rect.Width + 2)) { break }
    }
    $Graphics.DrawString($Text, $chosen, $brush, $Rect, $format)
    $chosen.Dispose()
    $brush.Dispose()
    $format.Dispose()
}

function Draw-Balloon(
    [System.Drawing.Graphics]$Graphics,
    [string]$Text,
    [System.Drawing.RectangleF]$Rect,
    [System.Drawing.PointF]$Tail,
    [float]$MaxSize = 24
) {
    $fill = New-Brush ([System.Drawing.Color]::FromArgb(247, 255, 255, 252))
    $outline = New-Pen ([System.Drawing.Color]::FromArgb(255, 24, 31, 40)) 3
    $path = New-RoundedPath $Rect 20
    $tipX = [Math]::Max($Rect.X + 24, [Math]::Min($Rect.Right - 24, $Tail.X))
    $baseY = if ($Tail.Y -ge $Rect.Bottom) { $Rect.Bottom - 2 } else { $Rect.Y + 2 }
    $tailPoints = if ($Tail.Y -ge $Rect.Bottom) {
        [System.Drawing.PointF[]]@(
            ([System.Drawing.PointF]::new([float]($tipX - 13), [float]$baseY)),
            ([System.Drawing.PointF]::new([float]$tipX, [float]($Rect.Bottom + 22))),
            ([System.Drawing.PointF]::new([float]($tipX + 13), [float]$baseY))
        )
    } else {
        [System.Drawing.PointF[]]@(
            ([System.Drawing.PointF]::new([float]($tipX - 13), [float]$baseY)),
            ([System.Drawing.PointF]::new([float]$tipX, [float]($Rect.Y - 22))),
            ([System.Drawing.PointF]::new([float]($tipX + 13), [float]$baseY))
        )
    }
    $Graphics.FillPolygon($fill, $tailPoints)
    $Graphics.DrawPolygon($outline, $tailPoints)
    $Graphics.FillPath($fill, $path)
    $Graphics.DrawPath($outline, $path)
    $inner = New-Object System.Drawing.RectangleF(
        ($Rect.X + 12), ($Rect.Y + 8), ($Rect.Width - 24), ($Rect.Height - 16)
    )
    Draw-FittedText $Graphics $Text $inner $MaxSize 15 ([System.Drawing.Color]::FromArgb(255, 18, 27, 38))
    $path.Dispose()
    $outline.Dispose()
    $fill.Dispose()
}

function Draw-Card(
    [System.Drawing.Graphics]$Graphics,
    [string]$Text,
    [System.Drawing.RectangleF]$Rect,
    [System.Drawing.Color]$FillColor,
    [System.Drawing.Color]$BorderColor,
    [System.Drawing.Color]$TextColor,
    [float]$MaxSize = 23
) {
    $fill = New-Brush $FillColor
    $outline = New-Pen $BorderColor 3
    $path = New-RoundedPath $Rect 14
    $Graphics.FillPath($fill, $path)
    $Graphics.DrawPath($outline, $path)
    $inner = New-Object System.Drawing.RectangleF(
        ($Rect.X + 12), ($Rect.Y + 8), ($Rect.Width - 24), ($Rect.Height - 16)
    )
    Draw-FittedText $Graphics $Text $inner $MaxSize 14 $TextColor
    $path.Dispose()
    $outline.Dispose()
    $fill.Dispose()
}

function Draw-Sticky(
    [System.Drawing.Graphics]$Graphics,
    [string]$Text,
    [System.Drawing.RectangleF]$Rect
) {
    $state = $Graphics.Save()
    $Graphics.TranslateTransform($Rect.X + $Rect.Width / 2, $Rect.Y + $Rect.Height / 2)
    $Graphics.RotateTransform(-4)
    $local = New-Object System.Drawing.RectangleF(
        (-$Rect.Width / 2), (-$Rect.Height / 2), $Rect.Width, $Rect.Height
    )
    $shadow = New-Brush ([System.Drawing.Color]::FromArgb(70, 0, 0, 0))
    $paper = New-Brush ([System.Drawing.Color]::FromArgb(255, 255, 228, 82))
    $outline = New-Pen ([System.Drawing.Color]::FromArgb(255, 85, 71, 22)) 2
    $shadowRect = New-Object System.Drawing.RectangleF(
        ($local.X + 6), ($local.Y + 7), $local.Width, $local.Height
    )
    $Graphics.FillRectangle($shadow, $shadowRect)
    $Graphics.FillRectangle($paper, $local)
    $Graphics.DrawRectangle($outline, $local.X, $local.Y, $local.Width, $local.Height)
    Draw-FittedText $Graphics $Text $local 22 15 ([System.Drawing.Color]::FromArgb(255, 31, 38, 43))
    $outline.Dispose()
    $paper.Dispose()
    $shadow.Dispose()
    $Graphics.Restore($state)
}

function Draw-Chevron(
    [System.Drawing.Graphics]$Graphics,
    [System.Drawing.Pen]$Pen,
    [float]$X,
    [float]$Y,
    [float]$AngleDegrees,
    [int]$Count = 1
) {
    $angle = $AngleDegrees * [Math]::PI / 180
    $ux = [Math]::Cos($angle)
    $uy = [Math]::Sin($angle)
    $px = -$uy
    $py = $ux
    for ($index = 0; $index -lt $Count; $index++) {
        $offset = ($index - (($Count - 1) / 2.0)) * 14
        $cx = $X + $ux * $offset
        $cy = $Y + $uy * $offset
        $tipX = $cx + $ux * 7
        $tipY = $cy + $uy * 7
        $Graphics.DrawLine($Pen, $tipX, $tipY, $cx - $ux * 9 + $px * 7, $cy - $uy * 9 + $py * 7)
        $Graphics.DrawLine($Pen, $tipX, $tipY, $cx - $ux * 9 - $px * 7, $cy - $uy * 9 - $py * 7)
    }
}

function Draw-Tick(
    [System.Drawing.Graphics]$Graphics,
    [System.Drawing.Pen]$Pen,
    [float]$X,
    [float]$Y,
    [float]$SegmentAngleDegrees,
    [int]$Count = 1
) {
    $angle = $SegmentAngleDegrees * [Math]::PI / 180
    $ux = [Math]::Cos($angle)
    $uy = [Math]::Sin($angle)
    $px = -$uy
    $py = $ux
    for ($index = 0; $index -lt $Count; $index++) {
        $offset = ($index - (($Count - 1) / 2.0)) * 9
        $cx = $X + $ux * $offset
        $cy = $Y + $uy * $offset
        $Graphics.DrawLine($Pen, $cx - $px * 9, $cy - $py * 9, $cx + $px * 9, $cy + $py * 9)
    }
}

function Draw-AngleArc(
    [System.Drawing.Graphics]$Graphics,
    [System.Drawing.Pen]$Pen,
    [System.Drawing.PointF]$Vertex,
    [System.Drawing.PointF]$ArmA,
    [System.Drawing.PointF]$ArmB,
    [float]$Radius
) {
    $start = [Math]::Atan2($ArmA.Y - $Vertex.Y, $ArmA.X - $Vertex.X) * 180 / [Math]::PI
    $finish = [Math]::Atan2($ArmB.Y - $Vertex.Y, $ArmB.X - $Vertex.X) * 180 / [Math]::PI
    $sweep = $finish - $start
    while ($sweep -le -180) { $sweep += 360 }
    while ($sweep -gt 180) { $sweep -= 360 }
    $Graphics.DrawArc($Pen, $Vertex.X - $Radius, $Vertex.Y - $Radius, $Radius * 2, $Radius * 2, $start, $sweep)
}

function Draw-RightAngle(
    [System.Drawing.Graphics]$Graphics,
    [System.Drawing.Pen]$Pen,
    [System.Drawing.PointF]$Vertex,
    [System.Drawing.PointF]$ArmA,
    [System.Drawing.PointF]$ArmB,
    [float]$Size = 15
) {
    $dA = [Math]::Max(1, [Math]::Sqrt([Math]::Pow($ArmA.X - $Vertex.X, 2) + [Math]::Pow($ArmA.Y - $Vertex.Y, 2)))
    $dB = [Math]::Max(1, [Math]::Sqrt([Math]::Pow($ArmB.X - $Vertex.X, 2) + [Math]::Pow($ArmB.Y - $Vertex.Y, 2)))
    $uAx = ($ArmA.X - $Vertex.X) / $dA
    $uAy = ($ArmA.Y - $Vertex.Y) / $dA
    $uBx = ($ArmB.X - $Vertex.X) / $dB
    $uBy = ($ArmB.Y - $Vertex.Y) / $dB
    $pA = [System.Drawing.PointF]::new($Vertex.X + $uAx * $Size, $Vertex.Y + $uAy * $Size)
    $corner = [System.Drawing.PointF]::new($pA.X + $uBx * $Size, $pA.Y + $uBy * $Size)
    $pB = [System.Drawing.PointF]::new($Vertex.X + $uBx * $Size, $Vertex.Y + $uBy * $Size)
    $Graphics.DrawLines($Pen, [System.Drawing.PointF[]]@($pA, $corner, $pB))
}

function Draw-Arrow(
    [System.Drawing.Graphics]$Graphics,
    [System.Drawing.Pen]$Pen,
    [float]$X1,
    [float]$Y1,
    [float]$X2,
    [float]$Y2
) {
    $Graphics.DrawLine($Pen, $X1, $Y1, $X2, $Y2)
    $angle = [Math]::Atan2($Y2 - $Y1, $X2 - $X1)
    $length = 12
    $a1 = $angle + 2.55
    $a2 = $angle - 2.55
    $Graphics.DrawLine($Pen, $X2, $Y2, $X2 + $length * [Math]::Cos($a1), $Y2 + $length * [Math]::Sin($a1))
    $Graphics.DrawLine($Pen, $X2, $Y2, $X2 + $length * [Math]::Cos($a2), $Y2 + $length * [Math]::Sin($a2))
}

function Draw-PanelBase(
    [System.Drawing.Graphics]$Graphics,
    [int]$Number,
    [string]$Heading,
    [string]$ImageName,
    [System.Drawing.Rectangle]$PanelRect
) {
    $headingHeight = 42
    $contentRect = New-Object System.Drawing.Rectangle(
        $PanelRect.X, ($PanelRect.Y + $headingHeight), $PanelRect.Width, ($PanelRect.Height - $headingHeight)
    )
    $bitmap = Load-Bitmap (Join-Path $AssetDir $ImageName)
    Draw-CoverImage $Graphics $bitmap $contentRect
    $bitmap.Dispose()

    $headingBrush = New-Brush ([System.Drawing.Color]::FromArgb(255, 13, 70, 118))
    $Graphics.FillRectangle($headingBrush, $PanelRect.X, $PanelRect.Y, $PanelRect.Width, $headingHeight)
    $headingBrush.Dispose()

    $numberBrush = New-Brush ([System.Drawing.Color]::FromArgb(255, 25, 122, 190))
    $numberOutline = New-Pen ([System.Drawing.Color]::White) 3
    $numberRect = New-Object System.Drawing.RectangleF(
        ($PanelRect.X + 6), ($PanelRect.Y + 3), 36, 36
    )
    $Graphics.FillEllipse($numberBrush, $numberRect)
    $Graphics.DrawEllipse($numberOutline, $numberRect)
    Draw-FittedText $Graphics ([string]$Number) $numberRect 24 18 ([System.Drawing.Color]::White)
    $numberBrush.Dispose()
    $numberOutline.Dispose()

    $headingRect = New-Object System.Drawing.RectangleF(
        ($PanelRect.X + 48), $PanelRect.Y, ($PanelRect.Width - 54), $headingHeight
    )
    Draw-FittedText $Graphics $Heading $headingRect 24 17 ([System.Drawing.Color]::White) `
        ([System.Drawing.FontStyle]::Bold) ([System.Drawing.StringAlignment]::Near)

    $border = New-Pen ([System.Drawing.Color]::FromArgb(255, 15, 22, 30)) 5
    $Graphics.DrawRectangle($border, $PanelRect)
    $border.Dispose()
    return $contentRect
}

function New-Page([string]$Title) {
    $bitmap = New-Object System.Drawing.Bitmap($PageWidth, $PageHeight)
    $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
    $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
    $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $graphics.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    $graphics.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::AntiAliasGridFit
    $graphics.Clear([System.Drawing.Color]::FromArgb(255, 247, 242, 230))

    $titleBrush = New-Brush ([System.Drawing.Color]::FromArgb(255, 247, 242, 230))
    $graphics.FillRectangle($titleBrush, 0, 0, $PageWidth, 76)
    $titleBrush.Dispose()
    $titleRect = New-Object System.Drawing.RectangleF(18, 4, ($PageWidth - 36), 66)
    Draw-FittedText $graphics $Title $titleRect 38 25 ([System.Drawing.Color]::FromArgb(255, 16, 23, 31))
    $titlePen = New-Pen ([System.Drawing.Color]::FromArgb(255, 16, 23, 31)) 5
    $graphics.DrawLine($titlePen, 0, 74, $PageWidth, 74)
    $titlePen.Dispose()

    return @{
        Bitmap = $bitmap
        Graphics = $graphics
    }
}

function Save-Page($Page, [string]$FileName) {
    $path = Join-Path $AssetDir $FileName
    $comicPath = Join-Path $ComicDir $FileName
    $desktopPath = Join-Path $DesktopDir $FileName
    [System.IO.Directory]::CreateDirectory($ComicDir) | Out-Null
    $Page.Graphics.Dispose()
    $Page.Bitmap.Save($path, [System.Drawing.Imaging.ImageFormat]::Png)
    $Page.Bitmap.Save($comicPath, [System.Drawing.Imaging.ImageFormat]::Png)
    $Page.Bitmap.Save($desktopPath, [System.Drawing.Imaging.ImageFormat]::Png)
    $Page.Bitmap.Dispose()
    Write-Output $path
}

# V6 PAGE 1
$page = New-Page "QUADRILATERALS QUEST - PAGE 1: SHAPES ALL AROUND US"
$gfx = $page.Graphics
$panels = @(
    (New-Object System.Drawing.Rectangle(8, 78, 588, 499)),
    (New-Object System.Drawing.Rectangle(604, 78, 588, 499)),
    (New-Object System.Drawing.Rectangle(8, 585, 588, 499)),
    (New-Object System.Drawing.Rectangle(604, 585, 588, 499)),
    (New-Object System.Drawing.Rectangle(8, 1092, 588, 499)),
    (New-Object System.Drawing.Rectangle(604, 1092, 588, 499))
)

$content1 = Draw-PanelBase $gfx 1 "COURTYARD EXPLORATION" "jm29-v6-p1-01-courtyard.png" $panels[0]
Draw-Sticky $gfx "AROUND`nSCHOOL..." (New-Object System.Drawing.RectangleF(24, 132, 118, 74))
Draw-Balloon $gfx "Geometry isn't trapped in a textbook. Let's go shape spotting!" `
    (New-Object System.Drawing.RectangleF(300, 130, 270, 116)) `
    (New-Object System.Drawing.PointF(314, 284)) 23

$content2 = Draw-PanelBase $gfx 2 "THE CLASSROOM WINDOW" "jm29-v6-p1-02-window.png" $panels[1]
Draw-Balloon $gfx "Four straight sides and four vertices!" `
    (New-Object System.Drawing.RectangleF(622, 130, 210, 92)) `
    (New-Object System.Drawing.PointF(800, 286)) 22
Draw-Balloon $gfx "That makes it a quadrilateral." `
    (New-Object System.Drawing.RectangleF(954, 132, 218, 92)) `
    (New-Object System.Drawing.PointF(942, 285)) 22
Draw-Card $gfx "QUADRILATERAL =`nA 4-SIDED POLYGON" `
    (New-Object System.Drawing.RectangleF(902, 468, 264, 84)) `
    ([System.Drawing.Color]::FromArgb(244, 238, 248, 255)) `
    ([System.Drawing.Color]::FromArgb(255, 15, 82, 143)) `
    ([System.Drawing.Color]::FromArgb(255, 15, 82, 143)) 22

$content3 = Draw-PanelBase $gfx 3 "SHAPES IN MOTION" "jm29-v6-p1-03-shapes.png" $panels[2]
Draw-Balloon $gfx "They look different, but they all have four sides!" `
    (New-Object System.Drawing.RectangleF(25, 645, 245, 102)) `
    (New-Object System.Drawing.PointF(260, 785)) 22
Draw-Balloon $gfx "We need clues to tell the families apart." `
    (New-Object System.Drawing.RectangleF(347, 645, 226, 102)) `
    (New-Object System.Drawing.PointF(392, 803)) 22

$content4 = Draw-PanelBase $gfx 4 "READ THE SIDE MARKS" "jm29-v6-p1-04-railing.png" $panels[3]
$bluePen = New-Pen ([System.Drawing.Color]::FromArgb(255, 18, 76, 180)) 6
$greenPen = New-Pen ([System.Drawing.Color]::FromArgb(255, 20, 128, 80)) 6
Draw-Chevron $gfx $bluePen 720 767 0 1
Draw-Chevron $gfx $bluePen 866 834 0 1
Draw-Tick $gfx $greenPen 762 896 90 1
Draw-Tick $gfx $greenPen 880 896 90 1
$bluePen.Dispose()
$greenPen.Dispose()
Draw-Card $gfx "matching chevrons = parallel`nmatching ticks = equal length" `
    (New-Object System.Drawing.RectangleF(902, 966, 270, 94)) `
    ([System.Drawing.Color]::FromArgb(242, 255, 255, 248)) `
    ([System.Drawing.Color]::FromArgb(255, 24, 100, 74)) `
    ([System.Drawing.Color]::FromArgb(255, 21, 73, 60)) 19

$content5 = Draw-PanelBase $gfx 5 "READ THE ANGLE MARKS" "jm29-v6-p1-05-playground.png" $panels[4]
Draw-Balloon $gfx "The marks tell us what is guaranteed." `
    (New-Object System.Drawing.RectangleF(28, 1145, 230, 96)) `
    (New-Object System.Drawing.PointF(244, 1305)) 21
Draw-Card $gfx "" `
    (New-Object System.Drawing.RectangleF(236, 1436, 342, 132)) `
    ([System.Drawing.Color]::FromArgb(239, 255, 255, 250)) `
    ([System.Drawing.Color]::FromArgb(255, 22, 83, 137)) `
    ([System.Drawing.Color]::FromArgb(255, 22, 83, 137)) 18
$markPen = New-Pen ([System.Drawing.Color]::FromArgb(255, 21, 74, 139)) 4
$gfx.DrawLine($markPen, 260, 1495, 320, 1468)
$gfx.DrawLine($markPen, 260, 1495, 320, 1522)
$gfx.DrawArc($markPen, 258, 1477, 42, 36, -30, 60)
$gfx.DrawLine($markPen, 370, 1495, 430, 1468)
$gfx.DrawLine($markPen, 370, 1495, 430, 1522)
$gfx.DrawArc($markPen, 368, 1477, 42, 36, -30, 60)
$gfx.DrawLine($markPen, 476, 1525, 548, 1525)
$gfx.DrawLine($markPen, 476, 1525, 476, 1463)
$gfx.DrawLine($markPen, 476, 1510, 491, 1510)
$gfx.DrawLine($markPen, 491, 1510, 491, 1525)
$markPen.Dispose()
Draw-FittedText $gfx "same arcs = equal angles" `
    (New-Object System.Drawing.RectangleF(246, 1442, 204, 28)) 17 13 `
    ([System.Drawing.Color]::FromArgb(255, 22, 83, 137))
Draw-FittedText $gfx "small square = 90 degrees" `
    (New-Object System.Drawing.RectangleF(440, 1442, 128, 44)) 16 12 `
    ([System.Drawing.Color]::FromArgb(255, 22, 83, 137))

$content6 = Draw-PanelBase $gfx 6 "IMPORTANT REMINDER" "jm29-v6-p1-06-exit.png" $panels[5]
Draw-Balloon $gfx "Read the markings - not just the look!" `
    (New-Object System.Drawing.RectangleF(918, 1146, 252, 92)) `
    (New-Object System.Drawing.PointF(900, 1320)) 22
Draw-Card $gfx "A DIAGRAM MAY NOT BE`nDRAWN TO SCALE." `
    (New-Object System.Drawing.RectangleF(628, 1466, 250, 88)) `
    ([System.Drawing.Color]::FromArgb(245, 235, 250, 231)) `
    ([System.Drawing.Color]::FromArgb(255, 36, 126, 66)) `
    ([System.Drawing.Color]::FromArgb(255, 29, 99, 52)) 21

Save-Page $page "jm29-v7-01-shapes-around-us.png"

# V6 PAGE 2
$page = New-Page "QUADRILATERALS QUEST - PAGE 2: THE TILTING PICTURE FRAME"
$gfx = $page.Graphics

$content1 = Draw-PanelBase $gfx 1 "A FRAME GOES CROOKED" "jm29-v6-p2-01-crooked-frame.png" $panels[0]
Draw-Balloon $gfx "It was a rectangle... then it got pushed sideways!" `
    (New-Object System.Drawing.RectangleF(22, 130, 238, 108)) `
    (New-Object System.Drawing.PointF(250, 270)) 22

$content2 = Draw-PanelBase $gfx 2 "CHECK THE OPPOSITE SIDES" "jm29-v6-p2-02-check-sides.png" $panels[1]
Draw-Balloon $gfx "It still has four sides." `
    (New-Object System.Drawing.RectangleF(622, 438, 205, 86)) `
    (New-Object System.Drawing.PointF(735, 380)) 21
Draw-Balloon $gfx "Now check the opposite sides." `
    (New-Object System.Drawing.RectangleF(952, 130, 218, 86)) `
    (New-Object System.Drawing.PointF(1040, 255)) 21

$content3 = Draw-PanelBase $gfx 3 "DEFINITION" "jm29-v6-p2-03-definition-frame.png" $panels[2]
$shapePen = New-Pen ([System.Drawing.Color]::FromArgb(255, 18, 73, 137)) 6
$p3A = [System.Drawing.PointF]::new(118, 722)
$p3B = [System.Drawing.PointF]::new(522, 700)
$p3C = [System.Drawing.PointF]::new(470, 962)
$p3D = [System.Drawing.PointF]::new(66, 986)
$gfx.DrawPolygon($shapePen, [System.Drawing.PointF[]]@($p3A, $p3B, $p3C, $p3D))
Draw-Chevron $gfx $shapePen 320 711 -3 1
Draw-Chevron $gfx $shapePen 268 974 -3 1
Draw-Chevron $gfx $shapePen 92 855 101 2
Draw-Chevron $gfx $shapePen 496 831 101 2
$shapePen.Dispose()
Draw-Card $gfx "PARALLELOGRAM = BOTH PAIRS`nOF OPPOSITE SIDES PARALLEL" `
    (New-Object System.Drawing.RectangleF(106, 982, 390, 82)) `
    ([System.Drawing.Color]::FromArgb(246, 239, 248, 255)) `
    ([System.Drawing.Color]::FromArgb(255, 20, 82, 143)) `
    ([System.Drawing.Color]::FromArgb(255, 20, 82, 143)) 20

$content4 = Draw-PanelBase $gfx 4 "A PROPERTY FOLLOWS" "jm29-v6-p2-04-property-frame.png" $panels[3]
$tickPen = New-Pen ([System.Drawing.Color]::FromArgb(255, 13, 69, 126)) 6
Draw-Tick $gfx $tickPen 820 743 4 1
Draw-Tick $gfx $tickPen 810 1005 4 1
Draw-Tick $gfx $tickPen 684 872 101 2
Draw-Tick $gfx $tickPen 1082 872 101 2
$tickPen.Dispose()
Draw-Balloon $gfx "Its opposite sides are equal too!" `
    (New-Object System.Drawing.RectangleF(620, 642, 220, 92)) `
    (New-Object System.Drawing.PointF(760, 770)) 21
Draw-Card $gfx "Only after we know its family." `
    (New-Object System.Drawing.RectangleF(912, 978, 248, 70)) `
    ([System.Drawing.Color]::FromArgb(244, 255, 247, 232)) `
    ([System.Drawing.Color]::FromArgb(255, 45, 124, 66)) `
    ([System.Drawing.Color]::FromArgb(255, 33, 94, 49)) 19

$content5 = Draw-PanelBase $gfx 5 "NAME, THEN USE" "jm29-v6-p2-05-name-then-use.png" $panels[4]
Draw-Card $gfx "1  NAME THE SHAPE`nUse the definition" `
    (New-Object System.Drawing.RectangleF(28, 1420, 245, 108)) `
    ([System.Drawing.Color]::FromArgb(242, 255, 252, 237)) `
    ([System.Drawing.Color]::FromArgb(255, 45, 126, 69)) `
    ([System.Drawing.Color]::FromArgb(255, 31, 88, 50)) 20
Draw-Card $gfx "2  USE ITS PROPERTIES`nOpposite sides equal`nOpposite angles equal`nDiagonals bisect each other" `
    (New-Object System.Drawing.RectangleF(292, 1398, 286, 150)) `
    ([System.Drawing.Color]::FromArgb(245, 238, 248, 255)) `
    ([System.Drawing.Color]::FromArgb(255, 22, 84, 145)) `
    ([System.Drawing.Color]::FromArgb(255, 22, 74, 126)) 18

$content6 = Draw-PanelBase $gfx 6 "STRAIGHTEN IT" "jm29-v6-p2-06-straighten.png" $panels[5]
Draw-Card $gfx "NAME IT FIRST - THEN USE ITS PROPERTIES.`nNever assume a property before the shape is known." `
    (New-Object System.Drawing.RectangleF(638, 1444, 520, 112)) `
    ([System.Drawing.Color]::FromArgb(245, 235, 250, 231)) `
    ([System.Drawing.Color]::FromArgb(255, 36, 126, 66)) `
    ([System.Drawing.Color]::FromArgb(255, 28, 92, 48)) 22

Save-Page $page "jm29-v7-02-tilting-frame.png"

# V6 PAGE 3
$page = New-Page "QUADRILATERALS QUEST - PAGE 3: BUILDING THE FAIR STALL"
$gfx = $page.Graphics

$content1 = Draw-PanelBase $gfx 1 "COURTYARD CONSTRUCTION" "jm29-v6-p3-01-stall.png" $panels[0]
Draw-Balloon $gfx "Can we prove this frame is a parallelogram?" `
    (New-Object System.Drawing.RectangleF(24, 132, 245, 100)) `
    (New-Object System.Drawing.PointF(230, 275)) 21
Draw-Balloon $gfx "Only if the given facts are sufficient." `
    (New-Object System.Drawing.RectangleF(348, 130, 225, 100)) `
    (New-Object System.Drawing.PointF(402, 272)) 21

$content2 = Draw-PanelBase $gfx 2 "NOT ENOUGH: ONE PARALLEL PAIR" "jm29-v6-p3-02-one-parallel.png" $panels[1]
$p = New-Pen ([System.Drawing.Color]::FromArgb(255, 20, 67, 111)) 5
$a = [System.Drawing.PointF]::new(748, 205)
$b = [System.Drawing.PointF]::new(1050, 205)
$c = [System.Drawing.PointF]::new(1100, 435)
$d = [System.Drawing.PointF]::new(698, 435)
$gfx.DrawPolygon($p, [System.Drawing.PointF[]]@($a, $b, $c, $d))
Draw-Chevron $gfx $p 899 205 0 1
Draw-Chevron $gfx $p 899 435 0 1
$p.Dispose()
Draw-Card $gfx "ONLY ONE PARALLEL PAIR`nIS NOT ENOUGH." `
    (New-Object System.Drawing.RectangleF(750, 468, 300, 72)) `
    ([System.Drawing.Color]::FromArgb(246, 255, 245, 238)) `
    ([System.Drawing.Color]::FromArgb(255, 171, 61, 48)) `
    ([System.Drawing.Color]::FromArgb(255, 143, 48, 38)) 19

$content3 = Draw-PanelBase $gfx 3 "NOT ENOUGH: ONE EQUAL PAIR" "jm29-v6-p3-03-one-equal.png" $panels[2]
$p = New-Pen ([System.Drawing.Color]::FromArgb(255, 20, 67, 111)) 5
$a = [System.Drawing.PointF]::new(112, 700)
$b = [System.Drawing.PointF]::new(500, 730)
$c = [System.Drawing.PointF]::new(460, 965)
$d = [System.Drawing.PointF]::new(82, 925)
$gfx.DrawPolygon($p, [System.Drawing.PointF[]]@($a, $b, $c, $d))
Draw-Tick $gfx $p 306 715 4 1
Draw-Tick $gfx $p 271 945 6 1
$p.Dispose()
Draw-Card $gfx "ONLY ONE EQUAL PAIR`nIS NOT ENOUGH." `
    (New-Object System.Drawing.RectangleF(148, 980, 300, 72)) `
    ([System.Drawing.Color]::FromArgb(246, 255, 245, 238)) `
    ([System.Drawing.Color]::FromArgb(255, 171, 61, 48)) `
    ([System.Drawing.Color]::FromArgb(255, 143, 48, 38)) 19

$content4 = Draw-PanelBase $gfx 4 "VALID ROUTES" "jm29-v6-p3-04-valid-routes.png" $panels[3]
$checkCol = [System.Drawing.Color]::FromArgb(255, 24, 105, 66)
$inkCol = [System.Drawing.Color]::FromArgb(255, 28, 40, 48)
Draw-Card $gfx "" `
    (New-Object System.Drawing.RectangleF(765, 690, 390, 330)) `
    ([System.Drawing.Color]::FromArgb(238, 255, 253, 247)) `
    ([System.Drawing.Color]::FromArgb(255, 27, 92, 62)) `
    $inkCol 18
$rows = @(
    "Both pairs of opposite sides parallel",
    "Both pairs of opposite sides equal",
    "Diagonals bisect each other",
    "The SAME opposite pair is equal and parallel"
)
for ($i = 0; $i -lt $rows.Count; $i++) {
    $y = 735 + ($i * 68)
    $boxPen = New-Pen $checkCol 4
    $gfx.DrawRectangle($boxPen, 785, $y, 24, 24)
    $gfx.DrawLine($boxPen, 790, ($y + 13), 797, ($y + 21))
    $gfx.DrawLine($boxPen, 797, ($y + 21), 808, ($y + 5))
    $boxPen.Dispose()
    Draw-FittedText $gfx $rows[$i] `
        (New-Object System.Drawing.RectangleF(820, ($y - 7), 335, 44)) 21 15 $inkCol `
        ([System.Drawing.FontStyle]::Bold) ([System.Drawing.StringAlignment]::Near)
}

$content5 = Draw-PanelBase $gfx 5 "MEASURING DIAGONALS" "jm29-v6-p3-05-measuring.png" $panels[4]
Draw-Card $gfx "[diags. bisect each other]" `
    (New-Object System.Drawing.RectangleF(24, 1138, 250, 62)) `
    ([System.Drawing.Color]::FromArgb(244, 238, 248, 255)) `
    ([System.Drawing.Color]::FromArgb(255, 18, 82, 143)) `
    ([System.Drawing.Color]::FromArgb(255, 18, 75, 132)) 18
Draw-Card $gfx "[2 sides equal and //]" `
    (New-Object System.Drawing.RectangleF(320, 1138, 250, 62)) `
    ([System.Drawing.Color]::FromArgb(244, 255, 247, 232)) `
    ([System.Drawing.Color]::FromArgb(255, 42, 124, 68)) `
    ([System.Drawing.Color]::FromArgb(255, 33, 95, 51)) 18

$content6 = Draw-PanelBase $gfx 6 "COMPLETED STALL" "jm29-v6-p3-06-complete.png" $panels[5]
Draw-Balloon $gfx "Check every word in the condition." `
    (New-Object System.Drawing.RectangleF(626, 1148, 235, 92)) `
    (New-Object System.Drawing.PointF(760, 1320)) 21
Draw-Card $gfx "ONE PAIR ALONE`nIS NOT ENOUGH." `
    (New-Object System.Drawing.RectangleF(918, 1448, 240, 90)) `
    ([System.Drawing.Color]::FromArgb(245, 235, 250, 231)) `
    ([System.Drawing.Color]::FromArgb(255, 36, 126, 66)) `
    ([System.Drawing.Color]::FromArgb(255, 28, 92, 48)) 21

Save-Page $page "jm29-v7-03-stall-frame-tests.png"

# V7 PAGE 4
$page = New-Page "QUADRILATERALS QUEST - PAGE 4: ANGLES IN THE RAILING"
$gfx = $page.Graphics

$content1 = Draw-PanelBase $gfx 1 "A LEANING FRAME" "jm29-v7-p4-01-railing-talk.png" $panels[0]
Draw-Balloon $gfx "The frame is leaning. Are all four angles equal?" `
    (New-Object System.Drawing.RectangleF(24, 420, 255, 102)) `
    (New-Object System.Drawing.PointF(190, 360)) 21

$content2 = Draw-PanelBase $gfx 2 "TWO OPPOSITE PAIRS" "jm29-v7-p4-01-railing-talk.png" $panels[1]
Draw-Balloon $gfx "No. Opposite and adjacent angles follow different rules." `
    (New-Object System.Drawing.RectangleF(626, 420, 278, 104)) `
    (New-Object System.Drawing.PointF(830, 360)) 20

$content3 = Draw-PanelBase $gfx 3 "OPPOSITE = EQUAL" "jm29-v7-p4-03-railing-close.png" $panels[2]
Draw-Card $gfx "" `
    (New-Object System.Drawing.RectangleF(42, 676, 512, 336)) `
    ([System.Drawing.Color]::FromArgb(235, 255, 253, 247)) `
    ([System.Drawing.Color]::FromArgb(255, 27, 70, 105)) `
    ([System.Drawing.Color]::FromArgb(255, 27, 70, 105)) 18
$qa = [System.Drawing.PointF]::new(128, 734)
$qb = [System.Drawing.PointF]::new(490, 734)
$qc = [System.Drawing.PointF]::new(445, 918)
$qd = [System.Drawing.PointF]::new(82, 918)
$outline = New-Pen ([System.Drawing.Color]::FromArgb(255, 28, 44, 58)) 5
$gfx.DrawPolygon($outline, [System.Drawing.PointF[]]@($qa, $qb, $qc, $qd))
$blueArc = New-Pen ([System.Drawing.Color]::FromArgb(255, 39, 105, 190)) 6
$orangeArc = New-Pen ([System.Drawing.Color]::FromArgb(255, 218, 111, 31)) 5
Draw-AngleArc $gfx $blueArc $qa $qb $qd 28
Draw-AngleArc $gfx $blueArc $qc $qb $qd 28
Draw-AngleArc $gfx $orangeArc $qb $qa $qc 22
Draw-AngleArc $gfx $orangeArc $qb $qa $qc 32
Draw-AngleArc $gfx $orangeArc $qd $qa $qc 22
Draw-AngleArc $gfx $orangeArc $qd $qa $qc 32
$outline.Dispose(); $blueArc.Dispose(); $orangeArc.Dispose()
Draw-Card $gfx "BLUE = BLUE        ORANGE = ORANGE" `
    (New-Object System.Drawing.RectangleF(106, 944, 385, 54)) `
    ([System.Drawing.Color]::FromArgb(246, 239, 248, 255)) `
    ([System.Drawing.Color]::FromArgb(255, 28, 84, 143)) `
    ([System.Drawing.Color]::FromArgb(255, 28, 74, 126)) 18

$content4 = Draw-PanelBase $gfx 4 "NEIGHBOURS = 180 DEGREES" "jm29-v7-p4-03-railing-close.png" $panels[3]
Draw-Card $gfx "" `
    (New-Object System.Drawing.RectangleF(638, 676, 512, 336)) `
    ([System.Drawing.Color]::FromArgb(235, 255, 253, 247)) `
    ([System.Drawing.Color]::FromArgb(255, 27, 70, 105)) `
    ([System.Drawing.Color]::FromArgb(255, 27, 70, 105)) 18
$qa = [System.Drawing.PointF]::new(724, 734)
$qb = [System.Drawing.PointF]::new(1086, 734)
$qc = [System.Drawing.PointF]::new(1041, 918)
$qd = [System.Drawing.PointF]::new(678, 918)
$outline = New-Pen ([System.Drawing.Color]::FromArgb(255, 28, 44, 58)) 5
$gfx.DrawPolygon($outline, [System.Drawing.PointF[]]@($qa, $qb, $qc, $qd))
$blueArc = New-Pen ([System.Drawing.Color]::FromArgb(255, 39, 105, 190)) 6
$orangeArc = New-Pen ([System.Drawing.Color]::FromArgb(255, 218, 111, 31)) 6
Draw-AngleArc $gfx $blueArc $qa $qb $qd 30
Draw-AngleArc $gfx $orangeArc $qb $qa $qc 30
$outline.Dispose(); $blueArc.Dispose(); $orangeArc.Dispose()
Draw-FittedText $gfx "x" (New-Object System.Drawing.RectangleF(752, 752, 32, 32)) 22 18 ([System.Drawing.Color]::FromArgb(255, 39, 105, 190))
Draw-FittedText $gfx "y" (New-Object System.Drawing.RectangleF(1032, 752, 32, 32)) 22 18 ([System.Drawing.Color]::FromArgb(255, 218, 111, 31))
Draw-Card $gfx "x + y = 180 degrees" `
    (New-Object System.Drawing.RectangleF(758, 944, 275, 54)) `
    ([System.Drawing.Color]::FromArgb(246, 239, 248, 255)) `
    ([System.Drawing.Color]::FromArgb(255, 28, 84, 143)) `
    ([System.Drawing.Color]::FromArgb(255, 28, 74, 126)) 19

$content5 = Draw-PanelBase $gfx 5 "SAY THE EXACT RULE" "jm29-v7-p4-05-walking.png" $panels[4]
Draw-Balloon $gfx "Opposite angles are equal; neighbours add to 180 degrees." `
    (New-Object System.Drawing.RectangleF(22, 1146, 270, 110)) `
    (New-Object System.Drawing.PointF(240, 1330)) 19
Draw-Balloon $gfx "Exactly." `
    (New-Object System.Drawing.RectangleF(420, 1150, 145, 72)) `
    (New-Object System.Drawing.PointF(470, 1300)) 21
Draw-Card $gfx "[opp. angles of //gram.]" `
    (New-Object System.Drawing.RectangleF(25, 1480, 255, 60)) `
    ([System.Drawing.Color]::FromArgb(244, 238, 248, 255)) `
    ([System.Drawing.Color]::FromArgb(255, 18, 82, 143)) `
    ([System.Drawing.Color]::FromArgb(255, 18, 75, 132)) 17
Draw-Card $gfx "[int. angles, // lines]" `
    (New-Object System.Drawing.RectangleF(316, 1480, 250, 60)) `
    ([System.Drawing.Color]::FromArgb(244, 255, 247, 232)) `
    ([System.Drawing.Color]::FromArgb(255, 42, 124, 68)) `
    ([System.Drawing.Color]::FromArgb(255, 33, 95, 51)) 17

$content6 = Draw-PanelBase $gfx 6 "QUICK REMINDER" "jm29-v7-p4-06-reminder.png" $panels[5]
Draw-Card $gfx "OPPOSITE = EQUAL`nADJACENT = 180 degrees" `
    (New-Object System.Drawing.RectangleF(756, 1450, 330, 92)) `
    ([System.Drawing.Color]::FromArgb(245, 235, 250, 231)) `
    ([System.Drawing.Color]::FromArgb(255, 36, 126, 66)) `
    ([System.Drawing.Color]::FromArgb(255, 28, 92, 48)) 21

Save-Page $page "jm29-v7-04-railing-angles.png"

# V7 PAGE 5
$page = New-Page "QUADRILATERALS QUEST - PAGE 5: THREE DIAGONAL FACTS"
$gfx = $page.Graphics

$content1 = Draw-PanelBase $gfx 1 "THE GATE AND THE WINDOW" "jm29-v7-p5-01-gate-window.png" $panels[0]
Draw-Balloon $gfx "Both have crossed diagonals. Do they tell us the same thing?" `
    (New-Object System.Drawing.RectangleF(24, 130, 260, 118)) `
    (New-Object System.Drawing.PointF(240, 290)) 20

$content2 = Draw-PanelBase $gfx 2 "THREE FACTS, OFTEN MIXED" "jm29-v7-p5-02-three-cards.png" $panels[1]
Draw-Balloon $gfx "These three facts are often mixed up." `
    (New-Object System.Drawing.RectangleF(626, 132, 250, 96)) `
    (New-Object System.Drawing.PointF(790, 282)) 21
Draw-FittedText $gfx "BISECT" `
    (New-Object System.Drawing.RectangleF(790, 287, 84, 44)) 18 14 ([System.Drawing.Color]::FromArgb(255, 109, 57, 8))
Draw-FittedText $gfx "EQUAL" `
    (New-Object System.Drawing.RectangleF(852, 286, 84, 44)) 18 14 ([System.Drawing.Color]::FromArgb(255, 29, 85, 55))
Draw-FittedText $gfx "PERPENDICULAR" `
    (New-Object System.Drawing.RectangleF(914, 288, 118, 44)) 15 11 ([System.Drawing.Color]::FromArgb(255, 72, 48, 118))

$content3 = Draw-PanelBase $gfx 3 "PARALLELOGRAM: BISECT" "jm29-v7-p5-03-diagram-bg.png" $panels[2]
$ink = New-Pen ([System.Drawing.Color]::FromArgb(255, 28, 44, 58)) 5
$a = [System.Drawing.PointF]::new(112, 702)
$b = [System.Drawing.PointF]::new(514, 724)
$c = [System.Drawing.PointF]::new(458, 934)
$d = [System.Drawing.PointF]::new(56, 912)
$o = [System.Drawing.PointF]::new(285, 818)
$gfx.DrawPolygon($ink, [System.Drawing.PointF[]]@($a, $b, $c, $d))
$gfx.DrawLine($ink, $a, $c)
$gfx.DrawLine($ink, $b, $d)
Draw-Tick $gfx $ink 198 760 30 1
Draw-Tick $gfx $ink 372 876 30 1
Draw-Tick $gfx $ink 400 770 153 2
Draw-Tick $gfx $ink 170 866 153 2
$ink.Dispose()
Draw-Card $gfx "AO = OC,  BO = OD`nNOT AO = BO" `
    (New-Object System.Drawing.RectangleF(130, 952, 330, 78)) `
    ([System.Drawing.Color]::FromArgb(246, 239, 248, 255)) `
    ([System.Drawing.Color]::FromArgb(255, 28, 84, 143)) `
    ([System.Drawing.Color]::FromArgb(255, 28, 74, 126)) 20

$content4 = Draw-PanelBase $gfx 4 "RECTANGLE: BISECT + EQUAL" "jm29-v7-p5-03-diagram-bg.png" $panels[3]
$ink = New-Pen ([System.Drawing.Color]::FromArgb(255, 28, 44, 58)) 5
$a = [System.Drawing.PointF]::new(680, 702)
$b = [System.Drawing.PointF]::new(1110, 702)
$c = [System.Drawing.PointF]::new(1110, 930)
$d = [System.Drawing.PointF]::new(680, 930)
$gfx.DrawPolygon($ink, [System.Drawing.PointF[]]@($a, $b, $c, $d))
$gfx.DrawLine($ink, $a, $c)
$gfx.DrawLine($ink, $b, $d)
Draw-Tick $gfx $ink 785 758 28 1
Draw-Tick $gfx $ink 1005 874 28 1
Draw-Tick $gfx $ink 1005 758 152 2
Draw-Tick $gfx $ink 785 874 152 2
$equalPen = New-Pen ([System.Drawing.Color]::FromArgb(255, 30, 128, 78)) 5
Draw-Tick $gfx $equalPen 830 782 28 1
Draw-Tick $gfx $equalPen 960 782 152 1
$ink.Dispose(); $equalPen.Dispose()
Draw-Card $gfx "Diagonals bisect each other`nand AC = BD" `
    (New-Object System.Drawing.RectangleF(746, 952, 330, 78)) `
    ([System.Drawing.Color]::FromArgb(246, 239, 248, 255)) `
    ([System.Drawing.Color]::FromArgb(255, 28, 84, 143)) `
    ([System.Drawing.Color]::FromArgb(255, 28, 74, 126)) 20

$content5 = Draw-PanelBase $gfx 5 "RHOMBUS: BISECT + PERPENDICULAR" "jm29-v7-p5-03-diagram-bg.png" $panels[4]
$ink = New-Pen ([System.Drawing.Color]::FromArgb(255, 28, 44, 58)) 5
$a = [System.Drawing.PointF]::new(300, 1168)
$b = [System.Drawing.PointF]::new(526, 1328)
$c = [System.Drawing.PointF]::new(300, 1488)
$d = [System.Drawing.PointF]::new(72, 1328)
$o = [System.Drawing.PointF]::new(300, 1328)
$gfx.DrawPolygon($ink, [System.Drawing.PointF[]]@($a, $b, $c, $d))
$gfx.DrawLine($ink, $a, $c)
$gfx.DrawLine($ink, $d, $b)
Draw-Tick $gfx $ink 300 1248 90 1
Draw-Tick $gfx $ink 300 1408 90 1
Draw-Tick $gfx $ink 187 1328 0 2
Draw-Tick $gfx $ink 413 1328 0 2
Draw-RightAngle $gfx $ink $o $a $b 18
$ink.Dispose()
Draw-Card $gfx "Diagonals bisect each other`nand meet at 90 degrees" `
    (New-Object System.Drawing.RectangleF(130, 1500, 340, 70)) `
    ([System.Drawing.Color]::FromArgb(246, 239, 248, 255)) `
    ([System.Drawing.Color]::FromArgb(255, 28, 84, 143)) `
    ([System.Drawing.Color]::FromArgb(255, 28, 74, 126)) 19

$content6 = Draw-PanelBase $gfx 6 "IMPORTANT REMINDER" "jm29-v7-p5-06-summary.png" $panels[5]
Draw-Balloon $gfx "Read the exact fact - don't swap the words." `
    (New-Object System.Drawing.RectangleF(620, 1145, 270, 96)) `
    (New-Object System.Drawing.PointF(830, 1320)) 20
Draw-Card $gfx "PARALLELOGRAM - BISECT`nRECTANGLE - BISECT + EQUAL`nRHOMBUS - BISECT + PERPENDICULAR`nSQUARE - ALL THREE" `
    (New-Object System.Drawing.RectangleF(844, 1295, 320, 220)) `
    ([System.Drawing.Color]::FromArgb(238, 235, 250, 231)) `
    ([System.Drawing.Color]::FromArgb(255, 36, 126, 66)) `
    ([System.Drawing.Color]::FromArgb(255, 28, 92, 48)) 18

Save-Page $page "jm29-v7-05-diagonal-facts.png"

# V7 PAGE 6
$page = New-Page "QUADRILATERALS QUEST - PAGE 6: THE RHOMBUS DESIGN"
$gfx = $page.Graphics

$content1 = Draw-PanelBase $gfx 1 "THE MOSAIC WORKSHOP" "jm29-v7-p6-01-mosaic.png" $panels[0]
Draw-Balloon $gfx "This tile looks like a diamond!" `
    (New-Object System.Drawing.RectangleF(24, 132, 225, 92)) `
    (New-Object System.Drawing.PointF(225, 278)) 21

$content2 = Draw-PanelBase $gfx 2 "LOOK AT THE MARKS" "jm29-v7-p6-02-rotate-tile.png" $panels[1]
Draw-Card $gfx "Its direction does not name it. Its side marks do." `
    (New-Object System.Drawing.RectangleF(642, 474, 520, 72)) `
    ([System.Drawing.Color]::FromArgb(244, 238, 248, 255)) `
    ([System.Drawing.Color]::FromArgb(255, 22, 84, 145)) `
    ([System.Drawing.Color]::FromArgb(255, 22, 74, 126)) 20

$content3 = Draw-PanelBase $gfx 3 "FOUR EQUAL SIDES" "jm29-v7-p6-01-mosaic.png" $panels[2]
Draw-Card $gfx "" `
    (New-Object System.Drawing.RectangleF(50, 675, 500, 345)) `
    ([System.Drawing.Color]::FromArgb(238, 255, 253, 247)) `
    ([System.Drawing.Color]::FromArgb(255, 34, 102, 74)) `
    ([System.Drawing.Color]::FromArgb(255, 28, 84, 62)) 18
$ink = New-Pen ([System.Drawing.Color]::FromArgb(255, 28, 44, 58)) 5
$a = [System.Drawing.PointF]::new(300, 710)
$b = [System.Drawing.PointF]::new(510, 835)
$c = [System.Drawing.PointF]::new(300, 960)
$d = [System.Drawing.PointF]::new(90, 835)
$gfx.DrawPolygon($ink, [System.Drawing.PointF[]]@($a, $b, $c, $d))
Draw-Tick $gfx $ink 405 772 31 1
Draw-Tick $gfx $ink 405 898 149 1
Draw-Tick $gfx $ink 195 898 31 1
Draw-Tick $gfx $ink 195 772 149 1
$ink.Dispose()
Draw-Card $gfx "A RHOMBUS HAS ALL`nFOUR SIDES EQUAL." `
    (New-Object System.Drawing.RectangleF(150, 948, 300, 58)) `
    ([System.Drawing.Color]::FromArgb(246, 239, 248, 255)) `
    ([System.Drawing.Color]::FromArgb(255, 28, 84, 143)) `
    ([System.Drawing.Color]::FromArgb(255, 28, 74, 126)) 19

$content4 = Draw-PanelBase $gfx 4 "NOT ALWAYS A SQUARE" "jm29-v7-p6-04-compare.png" $panels[3]
Draw-Balloon $gfx "So every rhombus is a tilted square?" `
    (New-Object System.Drawing.RectangleF(620, 642, 238, 92)) `
    (New-Object System.Drawing.PointF(785, 795)) 20
Draw-Balloon $gfx "No. A square also needs four right angles." `
    (New-Object System.Drawing.RectangleF(942, 642, 225, 96)) `
    (New-Object System.Drawing.PointF(1025, 805)) 19
Draw-Card $gfx "RHOMBUS                          SQUARE" `
    (New-Object System.Drawing.RectangleF(675, 918, 448, 118)) `
    ([System.Drawing.Color]::FromArgb(242, 255, 253, 247)) `
    ([System.Drawing.Color]::FromArgb(255, 34, 102, 74)) `
    ([System.Drawing.Color]::FromArgb(255, 28, 84, 62)) 16
$ink = New-Pen ([System.Drawing.Color]::FromArgb(255, 28, 44, 58)) 4
$ra = [System.Drawing.PointF]::new(760, 955)
$rb = [System.Drawing.PointF]::new(825, 995)
$rc = [System.Drawing.PointF]::new(760, 1028)
$rd = [System.Drawing.PointF]::new(695, 995)
$gfx.DrawPolygon($ink, [System.Drawing.PointF[]]@($ra, $rb, $rc, $rd))
$sa = [System.Drawing.PointF]::new(958, 952)
$sb = [System.Drawing.PointF]::new(1040, 952)
$sc = [System.Drawing.PointF]::new(1040, 1032)
$sd = [System.Drawing.PointF]::new(958, 1032)
$gfx.DrawPolygon($ink, [System.Drawing.PointF[]]@($sa, $sb, $sc, $sd))
Draw-RightAngle $gfx $ink $sa $sb $sd 11
Draw-RightAngle $gfx $ink $sb $sa $sc 11
Draw-RightAngle $gfx $ink $sc $sb $sd 11
Draw-RightAngle $gfx $ink $sd $sa $sc 11
$ink.Dispose()

$content5 = Draw-PanelBase $gfx 5 "DIAGONAL CLUES" "jm29-v7-p5-03-diagram-bg.png" $panels[4]
$ink = New-Pen ([System.Drawing.Color]::FromArgb(255, 28, 44, 58)) 5
$a = [System.Drawing.PointF]::new(300, 1165)
$b = [System.Drawing.PointF]::new(530, 1330)
$c = [System.Drawing.PointF]::new(300, 1495)
$d = [System.Drawing.PointF]::new(70, 1330)
$o = [System.Drawing.PointF]::new(300, 1330)
$gfx.DrawPolygon($ink, [System.Drawing.PointF[]]@($a, $b, $c, $d))
$gfx.DrawLine($ink, $a, $c)
$gfx.DrawLine($ink, $d, $b)
Draw-RightAngle $gfx $ink $o $a $b 18
$blueArc = New-Pen ([System.Drawing.Color]::FromArgb(255, 39, 105, 190)) 5
$orangeArc = New-Pen ([System.Drawing.Color]::FromArgb(255, 218, 111, 31)) 4
Draw-AngleArc $gfx $blueArc $a $d $o 29
Draw-AngleArc $gfx $blueArc $a $o $b 29
Draw-AngleArc $gfx $blueArc $c $d $o 29
Draw-AngleArc $gfx $blueArc $c $o $b 29
Draw-AngleArc $gfx $orangeArc $d $a $o 25
Draw-AngleArc $gfx $orangeArc $d $o $c 25
Draw-AngleArc $gfx $orangeArc $b $a $o 25
Draw-AngleArc $gfx $orangeArc $b $o $c 25
$ink.Dispose(); $blueArc.Dispose(); $orangeArc.Dispose()
Draw-Card $gfx "Diagonals are perpendicular`nand bisect the vertex angles." `
    (New-Object System.Drawing.RectangleF(112, 1502, 375, 68)) `
    ([System.Drawing.Color]::FromArgb(246, 239, 248, 255)) `
    ([System.Drawing.Color]::FromArgb(255, 28, 84, 143)) `
    ([System.Drawing.Color]::FromArgb(255, 28, 74, 126)) 17

$content6 = Draw-PanelBase $gfx 6 "THE FINISHED MOSAIC" "jm29-v7-p6-06-finished.png" $panels[5]
Draw-Card $gfx "RHOMBUS`n4 EQUAL SIDES`nDIAGONALS ARE PERPENDICULAR`nDIAGONALS BISECT VERTEX ANGLES" `
    (New-Object System.Drawing.RectangleF(622, 1160, 300, 220)) `
    ([System.Drawing.Color]::FromArgb(245, 31, 83, 58)) `
    ([System.Drawing.Color]::FromArgb(255, 240, 247, 238)) `
    ([System.Drawing.Color]::FromArgb(255, 248, 251, 247)) 18
Draw-Card $gfx "Diagonals are not necessarily equal." `
    (New-Object System.Drawing.RectangleF(930, 1435, 245, 76)) `
    ([System.Drawing.Color]::FromArgb(245, 180, 64, 48)) `
    ([System.Drawing.Color]::FromArgb(255, 255, 245, 240)) `
    ([System.Drawing.Color]::FromArgb(255, 255, 250, 247)) 17

Save-Page $page "jm29-v7-06-rhombus-design.png"

# V7 PAGE 7
$page = New-Page "QUADRILATERALS QUEST - PAGE 7: DOOR, TILE, OR SQUARE?"
$gfx = $page.Graphics

$content1 = Draw-PanelBase $gfx 1 "DOOR AND TILE" "jm29-v7-p7-01-door-tile.png" $panels[0]
Draw-Balloon $gfx "They both have right angles. Are they both squares?" `
    (New-Object System.Drawing.RectangleF(24, 132, 245, 108)) `
    (New-Object System.Drawing.PointF(235, 290)) 20

$content2 = Draw-PanelBase $gfx 2 "RECTANGLE" "jm29-v7-p7-01-door-tile.png" $panels[1]
Draw-Balloon $gfx "Four right angles make a rectangle - not automatically a square." `
    (New-Object System.Drawing.RectangleF(900, 130, 265, 112)) `
    (New-Object System.Drawing.PointF(1010, 290)) 19
Draw-Card $gfx "" `
    (New-Object System.Drawing.RectangleF(650, 220, 220, 285)) `
    ([System.Drawing.Color]::FromArgb(235, 255, 253, 247)) `
    ([System.Drawing.Color]::FromArgb(255, 27, 70, 105)) `
    ([System.Drawing.Color]::FromArgb(255, 27, 70, 105)) 18
$ink = New-Pen ([System.Drawing.Color]::FromArgb(255, 28, 44, 58)) 5
$a = [System.Drawing.PointF]::new(705, 255)
$b = [System.Drawing.PointF]::new(820, 255)
$c = [System.Drawing.PointF]::new(820, 430)
$d = [System.Drawing.PointF]::new(705, 430)
$gfx.DrawPolygon($ink, [System.Drawing.PointF[]]@($a, $b, $c, $d))
Draw-RightAngle $gfx $ink $a $b $d 12
Draw-RightAngle $gfx $ink $b $a $c 12
Draw-RightAngle $gfx $ink $c $b $d 12
Draw-RightAngle $gfx $ink $d $a $c 12
$ink.Dispose()
Draw-Card $gfx "RECTANGLE =`n4 RIGHT ANGLES" `
    (New-Object System.Drawing.RectangleF(660, 446, 200, 52)) `
    ([System.Drawing.Color]::FromArgb(246, 239, 248, 255)) `
    ([System.Drawing.Color]::FromArgb(255, 28, 84, 143)) `
    ([System.Drawing.Color]::FromArgb(255, 28, 74, 126)) 17

$content3 = Draw-PanelBase $gfx 3 "RHOMBUS" "jm29-v7-p7-03-rhombus-tile.png" $panels[2]
Draw-Balloon $gfx "Four equal sides make a rhombus - not automatically a square." `
    (New-Object System.Drawing.RectangleF(20, 642, 270, 112)) `
    (New-Object System.Drawing.PointF(230, 800)) 19
Draw-Card $gfx "" `
    (New-Object System.Drawing.RectangleF(315, 835, 245, 190)) `
    ([System.Drawing.Color]::FromArgb(230, 255, 253, 247)) `
    ([System.Drawing.Color]::FromArgb(255, 34, 102, 74)) `
    ([System.Drawing.Color]::FromArgb(255, 28, 84, 62)) 16
$ink = New-Pen ([System.Drawing.Color]::FromArgb(255, 28, 44, 58)) 4
$a = [System.Drawing.PointF]::new(438, 862)
$b = [System.Drawing.PointF]::new(535, 930)
$c = [System.Drawing.PointF]::new(438, 997)
$d = [System.Drawing.PointF]::new(341, 930)
$gfx.DrawPolygon($ink, [System.Drawing.PointF[]]@($a, $b, $c, $d))
Draw-Tick $gfx $ink 486 896 35 1
Draw-Tick $gfx $ink 486 964 145 1
Draw-Tick $gfx $ink 390 964 35 1
Draw-Tick $gfx $ink 390 896 145 1
$ink.Dispose()

$content4 = Draw-PanelBase $gfx 4 "SQUARE NEEDS BOTH" "jm29-v7-p7-01-door-tile.png" $panels[3]
Draw-Balloon $gfx "A square needs both." `
    (New-Object System.Drawing.RectangleF(620, 642, 190, 76)) `
    (New-Object System.Drawing.PointF(735, 790)) 21
Draw-Card $gfx "" `
    (New-Object System.Drawing.RectangleF(790, 750, 315, 285)) `
    ([System.Drawing.Color]::FromArgb(235, 255, 253, 247)) `
    ([System.Drawing.Color]::FromArgb(255, 27, 70, 105)) `
    ([System.Drawing.Color]::FromArgb(255, 27, 70, 105)) 18
$ink = New-Pen ([System.Drawing.Color]::FromArgb(255, 28, 44, 58)) 5
$a = [System.Drawing.PointF]::new(852, 790)
$b = [System.Drawing.PointF]::new(1045, 790)
$c = [System.Drawing.PointF]::new(1045, 980)
$d = [System.Drawing.PointF]::new(852, 980)
$gfx.DrawPolygon($ink, [System.Drawing.PointF[]]@($a, $b, $c, $d))
Draw-Tick $gfx $ink 948 790 0 1
Draw-Tick $gfx $ink 1045 885 90 1
Draw-Tick $gfx $ink 948 980 0 1
Draw-Tick $gfx $ink 852 885 90 1
Draw-RightAngle $gfx $ink $a $b $d 13
Draw-RightAngle $gfx $ink $b $a $c 13
Draw-RightAngle $gfx $ink $c $b $d 13
Draw-RightAngle $gfx $ink $d $a $c 13
$ink.Dispose()
Draw-Card $gfx "4 EQUAL SIDES + 4 RIGHT ANGLES" `
    (New-Object System.Drawing.RectangleF(805, 987, 285, 42)) `
    ([System.Drawing.Color]::FromArgb(246, 239, 248, 255)) `
    ([System.Drawing.Color]::FromArgb(255, 28, 84, 143)) `
    ([System.Drawing.Color]::FromArgb(255, 28, 74, 126)) 15

$content5 = Draw-PanelBase $gfx 5 "BOTH FAMILIES" "jm29-v7-p5-03-diagram-bg.png" $panels[4]
Draw-Card $gfx "RECTANGLE" `
    (New-Object System.Drawing.RectangleF(45, 1180, 180, 58)) `
    ([System.Drawing.Color]::FromArgb(248, 238, 248, 255)) `
    ([System.Drawing.Color]::FromArgb(255, 28, 84, 143)) `
    ([System.Drawing.Color]::FromArgb(255, 28, 74, 126)) 18
Draw-Card $gfx "RHOMBUS" `
    (New-Object System.Drawing.RectangleF(370, 1180, 180, 58)) `
    ([System.Drawing.Color]::FromArgb(248, 255, 247, 232)) `
    ([System.Drawing.Color]::FromArgb(255, 42, 124, 68)) `
    ([System.Drawing.Color]::FromArgb(255, 33, 95, 51)) 18
Draw-Card $gfx "SQUARE" `
    (New-Object System.Drawing.RectangleF(205, 1425, 180, 62)) `
    ([System.Drawing.Color]::FromArgb(248, 248, 240, 255)) `
    ([System.Drawing.Color]::FromArgb(255, 105, 71, 150)) `
    ([System.Drawing.Color]::FromArgb(255, 84, 57, 120)) 20
$arrowPen = New-Pen ([System.Drawing.Color]::FromArgb(255, 28, 44, 58)) 5
Draw-Arrow $gfx $arrowPen 135 1240 255 1425
Draw-Arrow $gfx $arrowPen 460 1240 335 1425
$arrowPen.Dispose()
Draw-FittedText $gfx "A square belongs to both families." `
    (New-Object System.Drawing.RectangleF(125, 1500, 350, 54)) 19 14 ([System.Drawing.Color]::FromArgb(255, 28, 44, 58))

$content6 = Draw-PanelBase $gfx 6 "FULL CORRIDOR" "jm29-v7-p7-06-labels.png" $panels[5]
Draw-FittedText $gfx "RECTANGLE" `
    (New-Object System.Drawing.RectangleF(644, 131, 140, 42)) 18 14 ([System.Drawing.Color]::FromArgb(255, 28, 84, 143))
Draw-FittedText $gfx "SQUARE" `
    (New-Object System.Drawing.RectangleF(838, 1452, 135, 42)) 18 14 ([System.Drawing.Color]::FromArgb(255, 28, 84, 143))
Draw-Card $gfx "RIGHT ANGLES ONLY - RECTANGLE`nEQUAL SIDES ONLY - RHOMBUS`nBOTH - SQUARE" `
    (New-Object System.Drawing.RectangleF(935, 1190, 235, 190)) `
    ([System.Drawing.Color]::FromArgb(245, 235, 250, 231)) `
    ([System.Drawing.Color]::FromArgb(255, 36, 126, 66)) `
    ([System.Drawing.Color]::FromArgb(255, 28, 92, 48)) 16

Save-Page $page "jm29-v7-07-rectangle-square.png"

# V7 PAGE 8
$page = New-Page "QUADRILATERALS QUEST - PAGE 8: THE TRAPEZIUM BRIDGE"
$gfx = $page.Graphics

$content1 = Draw-PanelBase $gfx 1 "THE BRIDGE SUPPORT" "jm29-v7-p8-01-bridge.png" $panels[0]
Draw-Balloon $gfx "That support has a short top and a long bottom." `
    (New-Object System.Drawing.RectangleF(24, 132, 245, 104)) `
    (New-Object System.Drawing.PointF(225, 290)) 20

$content2 = Draw-PanelBase $gfx 2 "ONE PARALLEL PAIR" "jm29-v7-p8-01-bridge.png" $panels[1]
Draw-Balloon $gfx "Those two opposite sides are parallel." `
    (New-Object System.Drawing.RectangleF(910, 132, 250, 94)) `
    (New-Object System.Drawing.PointF(1030, 285)) 20
Draw-Card $gfx "" `
    (New-Object System.Drawing.RectangleF(638, 260, 290, 245)) `
    ([System.Drawing.Color]::FromArgb(230, 255, 253, 247)) `
    ([System.Drawing.Color]::FromArgb(255, 27, 70, 105)) `
    ([System.Drawing.Color]::FromArgb(255, 27, 70, 105)) 16
$ink = New-Pen ([System.Drawing.Color]::FromArgb(255, 28, 44, 58)) 5
$a = [System.Drawing.PointF]::new(710, 300)
$b = [System.Drawing.PointF]::new(860, 300)
$c = [System.Drawing.PointF]::new(905, 445)
$d = [System.Drawing.PointF]::new(665, 445)
$gfx.DrawPolygon($ink, [System.Drawing.PointF[]]@($a, $b, $c, $d))
Draw-Chevron $gfx $ink 785 300 0 1
Draw-Chevron $gfx $ink 785 445 0 1
$ink.Dispose()
Draw-FittedText $gfx "exactly ONE parallel pair" `
    (New-Object System.Drawing.RectangleF(660, 458, 245, 36)) 17 13 ([System.Drawing.Color]::FromArgb(255, 28, 74, 126))

$content3 = Draw-PanelBase $gfx 3 "WHAT ABOUT TWO PAIRS?" "jm29-v7-p8-03-two-pairs.png" $panels[2]
Draw-Balloon $gfx "Is that a trapezium too?" `
    (New-Object System.Drawing.RectangleF(24, 642, 205, 84)) `
    (New-Object System.Drawing.PointF(200, 790)) 20
Draw-Balloon $gfx "Both pairs are parallel, so it is a parallelogram in this course." `
    (New-Object System.Drawing.RectangleF(326, 642, 245, 112)) `
    (New-Object System.Drawing.PointF(430, 805)) 18
Draw-Card $gfx "" `
    (New-Object System.Drawing.RectangleF(132, 850, 330, 190)) `
    ([System.Drawing.Color]::FromArgb(225, 255, 253, 247)) `
    ([System.Drawing.Color]::FromArgb(255, 27, 70, 105)) `
    ([System.Drawing.Color]::FromArgb(255, 27, 70, 105)) 16
$ink = New-Pen ([System.Drawing.Color]::FromArgb(255, 28, 44, 58)) 5
$a = [System.Drawing.PointF]::new(202, 884)
$b = [System.Drawing.PointF]::new(422, 884)
$c = [System.Drawing.PointF]::new(388, 998)
$d = [System.Drawing.PointF]::new(168, 998)
$gfx.DrawPolygon($ink, [System.Drawing.PointF[]]@($a, $b, $c, $d))
Draw-Chevron $gfx $ink 312 884 0 1
Draw-Chevron $gfx $ink 278 998 0 1
Draw-Chevron $gfx $ink 185 941 107 2
Draw-Chevron $gfx $ink 405 941 107 2
$ink.Dispose()

$content4 = Draw-PanelBase $gfx 4 "DEFINITION" "jm29-v7-p5-03-diagram-bg.png" $panels[3]
$ink = New-Pen ([System.Drawing.Color]::FromArgb(255, 28, 44, 58)) 5
$a = [System.Drawing.PointF]::new(760, 708)
$b = [System.Drawing.PointF]::new(1025, 708)
$c = [System.Drawing.PointF]::new(1110, 900)
$d = [System.Drawing.PointF]::new(675, 900)
$gfx.DrawPolygon($ink, [System.Drawing.PointF[]]@($a, $b, $c, $d))
Draw-Chevron $gfx $ink 892 708 0 1
Draw-Chevron $gfx $ink 892 900 0 1
$ink.Dispose()
Draw-Card $gfx "A TRAPEZIUM HAS EXACTLY ONE PAIR`nOF OPPOSITE SIDES PARALLEL." `
    (New-Object System.Drawing.RectangleF(682, 930, 420, 92)) `
    ([System.Drawing.Color]::FromArgb(246, 239, 248, 255)) `
    ([System.Drawing.Color]::FromArgb(255, 28, 84, 143)) `
    ([System.Drawing.Color]::FromArgb(255, 28, 74, 126)) 18

$content5 = Draw-PanelBase $gfx 5 "ANGLES ALONG A LEG" "jm29-v7-p5-03-diagram-bg.png" $panels[4]
$ink = New-Pen ([System.Drawing.Color]::FromArgb(255, 28, 44, 58)) 5
$a = [System.Drawing.PointF]::new(150, 1192)
$b = [System.Drawing.PointF]::new(420, 1192)
$c = [System.Drawing.PointF]::new(505, 1420)
$d = [System.Drawing.PointF]::new(70, 1420)
$gfx.DrawPolygon($ink, [System.Drawing.PointF[]]@($a, $b, $c, $d))
Draw-Chevron $gfx $ink 285 1192 0 1
Draw-Chevron $gfx $ink 288 1420 0 1
$blueArc = New-Pen ([System.Drawing.Color]::FromArgb(255, 39, 105, 190)) 6
$orangeArc = New-Pen ([System.Drawing.Color]::FromArgb(255, 218, 111, 31)) 6
Draw-AngleArc $gfx $blueArc $a $b $d 32
Draw-AngleArc $gfx $orangeArc $d $a $c 32
$ink.Dispose(); $blueArc.Dispose(); $orangeArc.Dispose()
Draw-FittedText $gfx "x" (New-Object System.Drawing.RectangleF(160, 1220, 30, 30)) 21 17 ([System.Drawing.Color]::FromArgb(255, 39, 105, 190))
Draw-FittedText $gfx "y" (New-Object System.Drawing.RectangleF(92, 1368, 30, 30)) 21 17 ([System.Drawing.Color]::FromArgb(255, 218, 111, 31))
Draw-Card $gfx "Along one leg:  x + y = 180 degrees" `
    (New-Object System.Drawing.RectangleF(118, 1468, 360, 66)) `
    ([System.Drawing.Color]::FromArgb(246, 239, 248, 255)) `
    ([System.Drawing.Color]::FromArgb(255, 28, 84, 143)) `
    ([System.Drawing.Color]::FromArgb(255, 28, 74, 126)) 18

$content6 = Draw-PanelBase $gfx 6 "CROSSING THE BRIDGE" "jm29-v7-p8-06-walk.png" $panels[5]
Draw-Card $gfx "TRAPEZIUM = EXACTLY ONE PARALLEL PAIR`nTWO PAIRS = PARALLELOGRAM" `
    (New-Object System.Drawing.RectangleF(802, 1434, 350, 102)) `
    ([System.Drawing.Color]::FromArgb(245, 31, 102, 67)) `
    ([System.Drawing.Color]::FromArgb(255, 240, 247, 238)) `
    ([System.Drawing.Color]::FromArgb(255, 248, 251, 247)) 19

Save-Page $page "jm29-v7-08-trapezium-bridge.png"

# V7 PAGE 9
$page = New-Page "QUADRILATERALS QUEST - PAGE 9: THE SHAPE-SORTING CHALLENGE"
$gfx = $page.Graphics

$content1 = Draw-PanelBase $gfx 1 "FINAL CHALLENGE" "jm29-v7-p9-01-booth.png" $panels[0]
Draw-Balloon $gfx "Sort by facts, not by appearance." `
    (New-Object System.Drawing.RectangleF(24, 410, 250, 96)) `
    (New-Object System.Drawing.PointF(165, 350)) 21

$content2 = Draw-PanelBase $gfx 2 "USE DEFINING FACTS" "jm29-v7-p9-02-sort.png" $panels[1]
Draw-Balloon $gfx "Good - use the defining facts." `
    (New-Object System.Drawing.RectangleF(944, 132, 220, 84)) `
    (New-Object System.Drawing.PointF(1040, 280)) 20
Draw-Card $gfx "RECTANGLE`n4 RIGHT ANGLES" `
    (New-Object System.Drawing.RectangleF(632, 445, 245, 86)) `
    ([System.Drawing.Color]::FromArgb(248, 238, 248, 255)) `
    ([System.Drawing.Color]::FromArgb(255, 28, 84, 143)) `
    ([System.Drawing.Color]::FromArgb(255, 28, 74, 126)) 18
Draw-Card $gfx "RHOMBUS`n4 EQUAL SIDES" `
    (New-Object System.Drawing.RectangleF(918, 445, 245, 86)) `
    ([System.Drawing.Color]::FromArgb(248, 255, 247, 232)) `
    ([System.Drawing.Color]::FromArgb(255, 42, 124, 68)) `
    ([System.Drawing.Color]::FromArgb(255, 33, 95, 51)) 18

$content3 = Draw-PanelBase $gfx 3 "CATCH THE TRAPS" "jm29-v7-p5-03-diagram-bg.png" $panels[2]
Draw-Card $gfx "One parallel pair proves`na parallelogram" `
    (New-Object System.Drawing.RectangleF(28, 675, 260, 220)) `
    ([System.Drawing.Color]::FromArgb(248, 255, 252, 242)) `
    ([System.Drawing.Color]::FromArgb(255, 70, 82, 52)) `
    ([System.Drawing.Color]::FromArgb(255, 38, 48, 36)) 19
Draw-Card $gfx "Rhombus diagonals`nare equal" `
    (New-Object System.Drawing.RectangleF(308, 675, 260, 220)) `
    ([System.Drawing.Color]::FromArgb(248, 255, 252, 242)) `
    ([System.Drawing.Color]::FromArgb(255, 70, 82, 52)) `
    ([System.Drawing.Color]::FromArgb(255, 38, 48, 36)) 19
$cross = New-Pen ([System.Drawing.Color]::FromArgb(235, 202, 54, 44)) 14
$gfx.DrawLine($cross, 48, 695, 268, 875)
$gfx.DrawLine($cross, 268, 695, 48, 875)
$gfx.DrawLine($cross, 328, 695, 548, 875)
$gfx.DrawLine($cross, 548, 695, 328, 875)
$cross.Dispose()
Draw-Card $gfx "NOT ENOUGH" `
    (New-Object System.Drawing.RectangleF(68, 918, 180, 58)) `
    ([System.Drawing.Color]::FromArgb(250, 255, 240, 234)) `
    ([System.Drawing.Color]::FromArgb(255, 180, 59, 43)) `
    ([System.Drawing.Color]::FromArgb(255, 145, 42, 31)) 18
Draw-Card $gfx "NOT NECESSARILY" `
    (New-Object System.Drawing.RectangleF(340, 918, 205, 58)) `
    ([System.Drawing.Color]::FromArgb(250, 255, 240, 234)) `
    ([System.Drawing.Color]::FromArgb(255, 180, 59, 43)) `
    ([System.Drawing.Color]::FromArgb(255, 145, 42, 31)) 17

$content4 = Draw-PanelBase $gfx 4 "FIX THE CLAIMS" "jm29-v7-p5-03-diagram-bg.png" $panels[3]
Draw-Card $gfx "Four right angles`nmeans square" `
    (New-Object System.Drawing.RectangleF(624, 675, 260, 220)) `
    ([System.Drawing.Color]::FromArgb(248, 255, 252, 242)) `
    ([System.Drawing.Color]::FromArgb(255, 70, 82, 52)) `
    ([System.Drawing.Color]::FromArgb(255, 38, 48, 36)) 19
Draw-Card $gfx "Use a property before`nnaming the shape" `
    (New-Object System.Drawing.RectangleF(904, 675, 260, 220)) `
    ([System.Drawing.Color]::FromArgb(248, 255, 252, 242)) `
    ([System.Drawing.Color]::FromArgb(255, 70, 82, 52)) `
    ([System.Drawing.Color]::FromArgb(255, 38, 48, 36)) 18
$cross = New-Pen ([System.Drawing.Color]::FromArgb(235, 202, 54, 44)) 14
$gfx.DrawLine($cross, 644, 695, 864, 875)
$gfx.DrawLine($cross, 864, 695, 644, 875)
$gfx.DrawLine($cross, 924, 695, 1144, 875)
$gfx.DrawLine($cross, 1144, 695, 924, 875)
$cross.Dispose()
Draw-Card $gfx "RECTANGLE unless`nall sides are equal" `
    (New-Object System.Drawing.RectangleF(648, 910, 215, 76)) `
    ([System.Drawing.Color]::FromArgb(250, 255, 240, 234)) `
    ([System.Drawing.Color]::FromArgb(255, 180, 59, 43)) `
    ([System.Drawing.Color]::FromArgb(255, 145, 42, 31)) 16
Draw-Card $gfx "NAME FIRST, THEN`nUSE PROPERTIES" `
    (New-Object System.Drawing.RectangleF(928, 910, 215, 76)) `
    ([System.Drawing.Color]::FromArgb(250, 255, 240, 234)) `
    ([System.Drawing.Color]::FromArgb(255, 180, 59, 43)) `
    ([System.Drawing.Color]::FromArgb(255, 145, 42, 31)) 16

$content5 = Draw-PanelBase $gfx 5 "THE FAMILY TREE" "jm29-v7-p5-03-diagram-bg.png" $panels[4]
Draw-Card $gfx "QUADRILATERAL" `
    (New-Object System.Drawing.RectangleF(188, 1158, 220, 52)) `
    ([System.Drawing.Color]::FromArgb(250, 238, 248, 255)) `
    ([System.Drawing.Color]::FromArgb(255, 28, 84, 143)) `
    ([System.Drawing.Color]::FromArgb(255, 28, 74, 126)) 17
Draw-Card $gfx "PARALLELOGRAM" `
    (New-Object System.Drawing.RectangleF(40, 1265, 210, 52)) `
    ([System.Drawing.Color]::FromArgb(250, 240, 251, 238)) `
    ([System.Drawing.Color]::FromArgb(255, 42, 124, 68)) `
    ([System.Drawing.Color]::FromArgb(255, 33, 95, 51)) 15
Draw-Card $gfx "TRAPEZIUM" `
    (New-Object System.Drawing.RectangleF(346, 1265, 210, 52)) `
    ([System.Drawing.Color]::FromArgb(250, 255, 240, 234)) `
    ([System.Drawing.Color]::FromArgb(255, 180, 59, 43)) `
    ([System.Drawing.Color]::FromArgb(255, 145, 42, 31)) 16
Draw-Card $gfx "RECTANGLE" `
    (New-Object System.Drawing.RectangleF(35, 1370, 190, 52)) `
    ([System.Drawing.Color]::FromArgb(250, 238, 248, 255)) `
    ([System.Drawing.Color]::FromArgb(255, 28, 84, 143)) `
    ([System.Drawing.Color]::FromArgb(255, 28, 74, 126)) 16
Draw-Card $gfx "RHOMBUS" `
    (New-Object System.Drawing.RectangleF(260, 1370, 190, 52)) `
    ([System.Drawing.Color]::FromArgb(250, 255, 247, 232)) `
    ([System.Drawing.Color]::FromArgb(255, 42, 124, 68)) `
    ([System.Drawing.Color]::FromArgb(255, 33, 95, 51)) 16
Draw-Card $gfx "SQUARE" `
    (New-Object System.Drawing.RectangleF(150, 1495, 190, 54)) `
    ([System.Drawing.Color]::FromArgb(250, 248, 240, 255)) `
    ([System.Drawing.Color]::FromArgb(255, 105, 71, 150)) `
    ([System.Drawing.Color]::FromArgb(255, 84, 57, 120)) 18
$arrowPen = New-Pen ([System.Drawing.Color]::FromArgb(255, 28, 44, 58)) 4
Draw-Arrow $gfx $arrowPen 260 1210 145 1265
Draw-Arrow $gfx $arrowPen 335 1210 450 1265
Draw-Arrow $gfx $arrowPen 130 1317 130 1370
Draw-Arrow $gfx $arrowPen 185 1317 325 1370
Draw-Arrow $gfx $arrowPen 130 1422 205 1495
Draw-Arrow $gfx $arrowPen 350 1422 285 1495
$arrowPen.Dispose()

$content6 = Draw-PanelBase $gfx 6 "CELEBRATION" "jm29-v7-p9-06-celebrate.png" $panels[5]
Draw-Card $gfx "1`nREAD THE MARKS" `
    (New-Object System.Drawing.RectangleF(620, 1160, 165, 96)) `
    ([System.Drawing.Color]::FromArgb(250, 255, 252, 242)) `
    ([System.Drawing.Color]::FromArgb(255, 70, 82, 52)) `
    ([System.Drawing.Color]::FromArgb(255, 38, 48, 36)) 17
Draw-Card $gfx "2`nNAME THE SHAPE" `
    (New-Object System.Drawing.RectangleF(812, 1138, 165, 96)) `
    ([System.Drawing.Color]::FromArgb(250, 255, 252, 242)) `
    ([System.Drawing.Color]::FromArgb(255, 70, 82, 52)) `
    ([System.Drawing.Color]::FromArgb(255, 38, 48, 36)) 17
Draw-Card $gfx "3`nCHOOSE THE`nEXACT REASON" `
    (New-Object System.Drawing.RectangleF(1004, 1160, 165, 106)) `
    ([System.Drawing.Color]::FromArgb(250, 255, 252, 242)) `
    ([System.Drawing.Color]::FromArgb(255, 70, 82, 52)) `
    ([System.Drawing.Color]::FromArgb(255, 38, 48, 36)) 16
Draw-Balloon $gfx "Quest complete!" `
    (New-Object System.Drawing.RectangleF(760, 1472, 290, 72)) `
    (New-Object System.Drawing.PointF(900, 1428)) 24

Save-Page $page "jm29-v7-09-shape-sorting.png"

# V7 PAGE 10
$page = New-Page "QUADRILATERALS QUEST - PAGE 10: ENRICHMENT - MEET THE KITE"
$gfx = $page.Graphics

$content1 = Draw-PanelBase $gfx 1 "ONE MORE QUADRILATERAL" "jm29-v7-p10-01-kite.png" $panels[0]
Draw-Balloon $gfx "There is one more useful quadrilateral." `
    (New-Object System.Drawing.RectangleF(24, 132, 235, 94)) `
    (New-Object System.Drawing.PointF(220, 278)) 20
Draw-Balloon $gfx "It looks like a rhombus!" `
    (New-Object System.Drawing.RectangleF(360, 132, 210, 78)) `
    (New-Object System.Drawing.PointF(465, 275)) 20

$content2 = Draw-PanelBase $gfx 2 "KITE OR RHOMBUS?" "jm29-v7-p10-02-compare.png" $panels[1]
Draw-Balloon $gfx "A rhombus has all four sides equal. A kite has two adjacent equal pairs." `
    (New-Object System.Drawing.RectangleF(622, 132, 285, 114)) `
    (New-Object System.Drawing.PointF(850, 300)) 18
Draw-Card $gfx "TWO PAIRS OF ADJACENT`nSIDES ARE EQUAL." `
    (New-Object System.Drawing.RectangleF(910, 455, 250, 80)) `
    ([System.Drawing.Color]::FromArgb(246, 239, 248, 255)) `
    ([System.Drawing.Color]::FromArgb(255, 28, 84, 143)) `
    ([System.Drawing.Color]::FromArgb(255, 28, 74, 126)) 18

$content3 = Draw-PanelBase $gfx 3 "SIDE MARKS" "jm29-v7-p5-03-diagram-bg.png" $panels[2]
$ink = New-Pen ([System.Drawing.Color]::FromArgb(255, 28, 44, 58)) 5
$a = [System.Drawing.PointF]::new(300, 680)
$b = [System.Drawing.PointF]::new(78, 825)
$c = [System.Drawing.PointF]::new(522, 825)
$d = [System.Drawing.PointF]::new(300, 1005)
$gfx.DrawPolygon($ink, [System.Drawing.PointF[]]@($a, $c, $d, $b))
Draw-Tick $gfx $ink 189 752 147 1
Draw-Tick $gfx $ink 411 752 33 1
Draw-Tick $gfx $ink 189 915 39 2
Draw-Tick $gfx $ink 411 915 141 2
$ink.Dispose()
Draw-FittedText $gfx "A" (New-Object System.Drawing.RectangleF(285, 650, 30, 30)) 20 16 ([System.Drawing.Color]::FromArgb(255, 28, 44, 58))
Draw-FittedText $gfx "B" (New-Object System.Drawing.RectangleF(45, 810, 30, 30)) 20 16 ([System.Drawing.Color]::FromArgb(255, 28, 44, 58))
Draw-FittedText $gfx "C" (New-Object System.Drawing.RectangleF(525, 810, 30, 30)) 20 16 ([System.Drawing.Color]::FromArgb(255, 28, 44, 58))
Draw-FittedText $gfx "D" (New-Object System.Drawing.RectangleF(285, 1005, 30, 30)) 20 16 ([System.Drawing.Color]::FromArgb(255, 28, 44, 58))
Draw-Card $gfx "AB = AC        DB = DC`nTwo adjacent equal pairs - not a rhombus." `
    (New-Object System.Drawing.RectangleF(90, 930, 420, 96)) `
    ([System.Drawing.Color]::FromArgb(242, 255, 253, 247)) `
    ([System.Drawing.Color]::FromArgb(255, 34, 102, 74)) `
    ([System.Drawing.Color]::FromArgb(255, 28, 84, 62)) 17

$content4 = Draw-PanelBase $gfx 4 "THE SYMMETRY DIAGONAL" "jm29-v7-p5-03-diagram-bg.png" $panels[3]
$ink = New-Pen ([System.Drawing.Color]::FromArgb(255, 28, 44, 58)) 5
$a = [System.Drawing.PointF]::new(900, 680)
$b = [System.Drawing.PointF]::new(684, 820)
$c = [System.Drawing.PointF]::new(1116, 820)
$d = [System.Drawing.PointF]::new(900, 1005)
$o = [System.Drawing.PointF]::new(900, 820)
$gfx.DrawPolygon($ink, [System.Drawing.PointF[]]@($a, $c, $d, $b))
$gfx.DrawLine($ink, $a, $d)
$gfx.DrawLine($ink, $b, $c)
Draw-Tick $gfx $ink 792 820 0 1
Draw-Tick $gfx $ink 1008 820 0 1
Draw-RightAngle $gfx $ink $o $a $c 18
$ink.Dispose()
Draw-FittedText $gfx "O" (New-Object System.Drawing.RectangleF(912, 825, 30, 30)) 19 15 ([System.Drawing.Color]::FromArgb(255, 28, 44, 58))
Draw-Card $gfx "AD is perpendicular to BC`nand BO = OC." `
    (New-Object System.Drawing.RectangleF(742, 930, 320, 78)) `
    ([System.Drawing.Color]::FromArgb(246, 239, 248, 255)) `
    ([System.Drawing.Color]::FromArgb(255, 28, 84, 143)) `
    ([System.Drawing.Color]::FromArgb(255, 28, 74, 126)) 18

$content5 = Draw-PanelBase $gfx 5 "ONLY TWO ANGLES" "jm29-v7-p5-03-diagram-bg.png" $panels[4]
$ink = New-Pen ([System.Drawing.Color]::FromArgb(255, 28, 44, 58)) 5
$a = [System.Drawing.PointF]::new(300, 1162)
$b = [System.Drawing.PointF]::new(80, 1315)
$c = [System.Drawing.PointF]::new(520, 1315)
$d = [System.Drawing.PointF]::new(300, 1490)
$o = [System.Drawing.PointF]::new(300, 1315)
$gfx.DrawPolygon($ink, [System.Drawing.PointF[]]@($a, $c, $d, $b))
$axisPen = New-Pen ([System.Drawing.Color]::FromArgb(255, 32, 120, 74)) 6
$gfx.DrawLine($axisPen, $a, $d)
$guidePen = New-Pen ([System.Drawing.Color]::FromArgb(150, 90, 105, 112)) 3
$guidePen.DashStyle = [System.Drawing.Drawing2D.DashStyle]::Dash
$gfx.DrawLine($guidePen, $b, $c)
$blueArc = New-Pen ([System.Drawing.Color]::FromArgb(255, 39, 105, 190)) 5
$orangeArc = New-Pen ([System.Drawing.Color]::FromArgb(255, 218, 111, 31)) 4
Draw-AngleArc $gfx $blueArc $a $b $o 30
Draw-AngleArc $gfx $blueArc $a $o $c 30
Draw-AngleArc $gfx $orangeArc $d $b $o 27
Draw-AngleArc $gfx $orangeArc $d $o $c 27
Draw-AngleArc $gfx $orangeArc $d $b $o 36
Draw-AngleArc $gfx $orangeArc $d $o $c 36
$ink.Dispose(); $axisPen.Dispose(); $guidePen.Dispose(); $blueArc.Dispose(); $orangeArc.Dispose()
Draw-Card $gfx "Only AD bisects the top and bottom angles.`nONE LINE OF SYMMETRY" `
    (New-Object System.Drawing.RectangleF(78, 1500, 440, 70)) `
    ([System.Drawing.Color]::FromArgb(242, 255, 253, 247)) `
    ([System.Drawing.Color]::FromArgb(255, 34, 102, 74)) `
    ([System.Drawing.Color]::FromArgb(255, 28, 84, 62)) 16

$content6 = Draw-PanelBase $gfx 6 "LET IT FLY!" "jm29-v7-p10-06-fly.png" $panels[5]
Draw-Balloon $gfx "Enrichment unlocked!" `
    (New-Object System.Drawing.RectangleF(620, 1150, 215, 80)) `
    (New-Object System.Drawing.PointF(770, 1320)) 20
Draw-Balloon $gfx "Let it fly!" `
    (New-Object System.Drawing.RectangleF(1000, 1150, 165, 72)) `
    (New-Object System.Drawing.PointF(1060, 1300)) 22

Save-Page $page "jm29-v7-10-kite-enrichment.png"

# ---------------------------------------------------------------------------
# V9 - SIX-PAGE CLASSROOM STORY WITH EXPRESSION-SPECIFIC DIALOGUE PANELS
# ---------------------------------------------------------------------------

function Pt([float]$X, [float]$Y) {
    return [System.Drawing.PointF]::new($X, $Y)
}

function Draw-GateCells(
    [System.Drawing.Graphics]$Graphics,
    [System.Drawing.Pen]$Pen,
    [float]$StartX,
    [float]$TopY,
    [float]$CellW,
    [float]$CellH,
    [int]$Count
) {
    for ($i = 0; $i -lt $Count; $i++) {
        $x1 = $StartX + $i * $CellW
        $x2 = $x1 + $CellW
        $Graphics.DrawLine($Pen, $x1, $TopY, $x2, $TopY + $CellH)
        $Graphics.DrawLine($Pen, $x1, $TopY + $CellH, $x2, $TopY)
        $Graphics.FillEllipse([System.Drawing.Brushes]::White, $x1 + $CellW / 2 - 4, $TopY + $CellH / 2 - 4, 8, 8)
        $Graphics.DrawEllipse($Pen, $x1 + $CellW / 2 - 4, $TopY + $CellH / 2 - 4, 8, 8)
    }
}

function Draw-PlainBoard(
    [System.Drawing.Graphics]$Graphics,
    [System.Drawing.RectangleF]$Rect
) {
    Draw-Card $Graphics "" $Rect `
        ([System.Drawing.Color]::FromArgb(247, 255, 252, 243)) `
        ([System.Drawing.Color]::FromArgb(255, 28, 72, 112)) `
        ([System.Drawing.Color]::FromArgb(255, 28, 44, 58)) 18
}

# V8 PAGE 1
$page = New-Page "QUADRILATERALS QUEST - PAGE 1: THE TILTED SQUARE"
$gfx = $page.Graphics
$scene1 = "jm29-v11-p1-01-ms-tam-square-sze-braids.png"
$scene2 = "jm29-v11-p1-02-ms-tam-rotates-sze-braids.png"
$scene3 = "jm29-v13-p1-03-ming-speaks-sze-low-braids.png"
$scene4 = "jm29-v11-p1-04-sze-speaks-braids.png"
# Front-facing board. Its writable cream face, in page coordinates, is
#   left column  x 76..538   right column x 672..1134
#   row 1 y 195..500   row 2 y 702..1007   row 3 y 1209..1514
$board = "jm29-v13-board-front-rect.png"
# Board colours: marker black for shapes and body text, green for key labels. Never blue.
$BoardInk = [System.Drawing.Color]::FromArgb(255, 30, 34, 40)
$BoardGreen = [System.Drawing.Color]::FromArgb(255, 20, 108, 60)
$BoardRed = [System.Drawing.Color]::FromArgb(255, 166, 55, 45)

$content1 = Draw-PanelBase $gfx 1 "BEFORE THE TURN" $scene1 $panels[0]
Draw-Balloon $gfx "Ming, look at this square." `
    (New-Object System.Drawing.RectangleF(24, 430, 240, 82)) `
    (New-Object System.Drawing.PointF(180, 360)) 22

$content2 = Draw-PanelBase $gfx 2 "A 45-DEGREE TURN" $scene2 $panels[1]
Draw-Balloon $gfx "After I rotate it, what shape has it become?" `
    (New-Object System.Drawing.RectangleF(874, 430, 282, 96)) `
    (New-Object System.Drawing.PointF(850, 350)) 21

$content3 = Draw-PanelBase $gfx 3 "MING'S GUESS" $scene3 $panels[2]
Draw-Balloon $gfx "It is tilted, and all four sides are equal. It must have become a rhombus!" `
    (New-Object System.Drawing.RectangleF(24, 908, 330, 132)) `
    (New-Object System.Drawing.PointF(360, 825)) 19

$content4 = Draw-PanelBase $gfx 4 "SZE SZE CHECKS" $scene4 $panels[3]
Draw-Balloon $gfx "It is still a square. Turning it does not change its angles." `
    (New-Object System.Drawing.RectangleF(806, 912, 350, 118)) `
    (New-Object System.Drawing.PointF(1060, 825)) 20

$content5 = Draw-PanelBase $gfx 5 "FOUR RIGHT ANGLES REMAIN" $board $panels[4]
$sqPen = New-Pen $BoardInk 6
$sA = Pt 300 1235
$sB = Pt 405 1340
$sC = Pt 300 1445
$sD = Pt 195 1340
$gfx.DrawPolygon($sqPen, [System.Drawing.PointF[]]@($sA, $sB, $sC, $sD))
Draw-Tick $gfx $sqPen 352 1287 45 1
Draw-Tick $gfx $sqPen 352 1393 135 1
Draw-Tick $gfx $sqPen 248 1393 45 1
Draw-Tick $gfx $sqPen 248 1287 135 1
Draw-RightAngle $gfx $sqPen $sA $sB $sD 16
Draw-RightAngle $gfx $sqPen $sB $sA $sC 16
Draw-RightAngle $gfx $sqPen $sC $sB $sD 16
Draw-RightAngle $gfx $sqPen $sD $sA $sC 16
$sqPen.Dispose()
Draw-FittedText $gfx "4 EQUAL SIDES + 4 RIGHT ANGLES" `
    (New-Object System.Drawing.RectangleF(112, 1458, 376, 40)) 18 15 $BoardGreen

$content6 = Draw-PanelBase $gfx 6 "CONCLUSION" $board $panels[5]
Draw-FittedText $gfx "ROTATION CHANGES POSITION - NOT PROPERTIES.`n`nIt is still a square. It is also a rhombus and a parallelogram." `
    (New-Object System.Drawing.RectangleF(700, 1230, 400, 220)) 23 18 $BoardGreen

Save-Page $page "jm29-v11-01-tilted-square.png"

# V8 PAGE 2
$page = New-Page "QUADRILATERALS QUEST - PAGE 2: SAME PERSON, SAME SHAPE"
$gfx = $page.Graphics
$scene1 = "jm29-v11-p2-01-sze-front-ms-tam-asks.png"
$scene2 = "jm29-v11-p2-02-sze-front-ming-answers.png"
$scene3 = "jm29-v11-p2-03-ms-tam-analogy-sze-braids.png"
$scene6 = "jm29-v11-p2-06-formal-group.png"

$content1 = Draw-PanelBase $gfx 1 "TURN SIDEWAYS" $scene1 $panels[0]
Draw-Balloon $gfx "Ming, look at Sze Sze. If she turns sideways, does she become another person?" `
    (New-Object System.Drawing.RectangleF(24, 400, 330, 130)) `
    (New-Object System.Drawing.PointF(270, 340)) 19

$content2 = Draw-PanelBase $gfx 2 "STILL SZE SZE" $scene2 $panels[1]
Draw-Balloon $gfx "Of course not. She is still Sze Sze." `
    (New-Object System.Drawing.RectangleF(622, 440, 270, 92)) `
    (New-Object System.Drawing.PointF(720, 355)) 21

$content3 = Draw-PanelBase $gfx 3 "THE ANALOGY" $scene3 $panels[2]
Draw-Balloon $gfx "Exactly. A turn changes how something faces, not what it is." `
    (New-Object System.Drawing.RectangleF(24, 920, 340, 112)) `
    (New-Object System.Drawing.PointF(280, 840)) 20

$content4 = Draw-PanelBase $gfx 4 "BEFORE AND AFTER" $board $panels[3]
$shapePen = New-Pen $BoardInk 6
$gfx.DrawRectangle($shapePen, 700, 760, 145, 145)
$rA = Pt 1010 730
$rB = Pt 1110 830
$rC = Pt 1010 930
$rD = Pt 910 830
$gfx.DrawPolygon($shapePen, [System.Drawing.PointF[]]@($rA, $rB, $rC, $rD))
Draw-Arrow $gfx $shapePen 858 830 892 830
$shapePen.Dispose()
Draw-FittedText $gfx "SAME FOUR RIGHT ANGLES" `
    (New-Object System.Drawing.RectangleF(720, 942, 370, 40)) 20 15 $BoardGreen

$content5 = Draw-PanelBase $gfx 5 "THE DEFINING FACTS STAY" $board $panels[4]
Draw-FittedText $gfx "BEFORE`nTHE TURN`n`n4 equal sides`n4 right angles" `
    (New-Object System.Drawing.RectangleF(88, 1245, 200, 220)) 24 16 $BoardInk
$turnArrow = New-Pen $BoardInk 5
Draw-Arrow $gfx $turnArrow 292 1355 322 1355
$turnArrow.Dispose()
Draw-FittedText $gfx "AFTER`nTHE TURN`n`n4 equal sides`n4 right angles" `
    (New-Object System.Drawing.RectangleF(326, 1245, 200, 220)) 24 16 $BoardInk

$content6 = Draw-PanelBase $gfx 6 "MS TAM'S RULE" $scene6 $panels[5]
Draw-Card $gfx "A rotated square still has four right angles.`nSo it is still a SQUARE - not merely a rhombus." `
    (New-Object System.Drawing.RectangleF(650, 1382, 510, 164)) `
    ([System.Drawing.Color]::FromArgb(246, 235, 250, 231)) `
    ([System.Drawing.Color]::FromArgb(255, 36, 126, 66)) `
    ([System.Drawing.Color]::FromArgb(255, 28, 92, 48)) 22

Save-Page $page "jm29-v11-02-same-person-same-shape.png"

# V8 PAGE 3
$page = New-Page "QUADRILATERALS QUEST - PAGE 3: NEVER JUDGE BY EYE"
$gfx = $page.Graphics
$scene1 = "jm29-v13-p3-01-ming-realises-board-rectangle.png"
$scene2 = "jm29-v13-p3-02-ming-guesses-board-rectangle.png"
$scene4 = "jm29-v13-p3-04-ms-tam-warning-board-rectangle.png"

$content1 = Draw-PanelBase $gfx 1 "A RECTANGLE-LOOKING FIGURE" $scene1 $panels[0]
Draw-Balloon $gfx "I understand now! Those four angles look like right angles." `
    (New-Object System.Drawing.RectangleF(24, 420, 310, 104)) `
    (New-Object System.Drawing.PointF(330, 340)) 20

$content2 = Draw-PanelBase $gfx 2 "MING'S GUESS" $scene2 $panels[1]
Draw-Balloon $gfx "This must be a rectangle!" `
    (New-Object System.Drawing.RectangleF(886, 438, 260, 78)) `
    (New-Object System.Drawing.PointF(970, 350)) 23

$content3 = Draw-PanelBase $gfx 3 "WHAT IS ACTUALLY GIVEN?" $board $panels[2]
$paraPen = New-Pen $BoardInk 6
$qA = Pt 120 735
$qB = Pt 490 735
$qC = Pt 510 900
$qD = Pt 140 900
$gfx.DrawPolygon($paraPen, [System.Drawing.PointF[]]@($qA, $qB, $qC, $qD))
Draw-Chevron $gfx $paraPen 305 735 0 1
Draw-Chevron $gfx $paraPen 325 900 0 1
Draw-Chevron $gfx $paraPen 130 818 83 2
Draw-Chevron $gfx $paraPen 500 818 83 2
$paraPen.Dispose()
Draw-FittedText $gfx "GIVEN: BOTH PAIRS OF OPPOSITE SIDES PARALLEL`nNO RIGHT-ANGLE MARKS" `
    (New-Object System.Drawing.RectangleF(90, 918, 420, 70)) 17 14 $BoardGreen

$content4 = Draw-PanelBase $gfx 4 "MS TAM'S WARNING" $scene4 $panels[3]
Draw-Balloon $gfx "Wrong. In geometry, never judge by eye. Read only the facts that are marked or stated." `
    (New-Object System.Drawing.RectangleF(806, 902, 354, 132)) `
    (New-Object System.Drawing.PointF(760, 820)) 19

$content5 = Draw-PanelBase $gfx 5 "WHEN CAN WE SAY RECTANGLE?" $board $panels[4]
Draw-FittedText $gfx "VALID EVIDENCE`n`n- a right-angle mark`n- four right angles stated`n- equal diagonals, once a parallelogram is known" `
    (New-Object System.Drawing.RectangleF(92, 1225, 420, 270)) 21 16 $BoardInk

$content6 = Draw-PanelBase $gfx 6 "THE SAFE CONCLUSION" $board $panels[5]
Draw-FittedText $gfx "The parallel marks prove only a PARALLELOGRAM.`n`nWithout a rectangle test, do not call it a rectangle." `
    (New-Object System.Drawing.RectangleF(700, 1230, 410, 220)) 23 18 $BoardGreen

Save-Page $page "jm29-v11-03-never-judge-by-eye.png"

# V8 PAGE 4
$page = New-Page "QUADRILATERALS QUEST - PAGE 4: THE ALL-IN-ONE SQUARE"
$gfx = $page.Graphics
$scene1 = "jm29-v11-p4-01-ming-asks-sze-braids.png"
$scene2 = "jm29-v11-p4-02-sze-answers-braids.png"

$content1 = Draw-PanelBase $gfx 1 "A NOTEBOOK SURPRISE" $scene1 $panels[0]
Draw-Balloon $gfx "Ms Tam asked for a rectangle and a rhombus. Why did you draw a square?" `
    (New-Object System.Drawing.RectangleF(24, 414, 330, 116)) `
    (New-Object System.Drawing.PointF(330, 345)) 19

$content2 = Draw-PanelBase $gfx 2 "SZE SZE'S ANSWER" $scene2 $panels[1]
Draw-Balloon $gfx "Because a square belongs to several families." `
    (New-Object System.Drawing.RectangleF(876, 430, 282, 92)) `
    (New-Object System.Drawing.PointF(850, 350)) 21

$content3 = Draw-PanelBase $gfx 3 "IT PASSES THE RECTANGLE TEST" $board $panels[2]
$testPen = New-Pen $BoardInk 6
$a = Pt 194 728; $b = Pt 406 728; $c = Pt 406 940; $d = Pt 194 940
$gfx.DrawPolygon($testPen, [System.Drawing.PointF[]]@($a, $b, $c, $d))
Draw-RightAngle $gfx $testPen $a $b $d 16
Draw-RightAngle $gfx $testPen $b $a $c 16
Draw-RightAngle $gfx $testPen $c $b $d 16
Draw-RightAngle $gfx $testPen $d $a $c 16
$testPen.Dispose()
Draw-FittedText $gfx "4 RIGHT ANGLES = RECTANGLE" `
    (New-Object System.Drawing.RectangleF(105, 950, 390, 40)) 20 16 $BoardGreen

$content4 = Draw-PanelBase $gfx 4 "IT PASSES THE RHOMBUS TEST" $board $panels[3]
$testPen = New-Pen $BoardInk 6
$a = Pt 799 728; $b = Pt 1011 728; $c = Pt 1011 940; $d = Pt 799 940
$gfx.DrawPolygon($testPen, [System.Drawing.PointF[]]@($a, $b, $c, $d))
Draw-Tick $gfx $testPen 905 728 0 1
Draw-Tick $gfx $testPen 1011 834 90 1
Draw-Tick $gfx $testPen 905 940 0 1
Draw-Tick $gfx $testPen 799 834 90 1
$testPen.Dispose()
Draw-FittedText $gfx "4 EQUAL SIDES = RHOMBUS" `
    (New-Object System.Drawing.RectangleF(710, 950, 390, 40)) 20 16 $BoardGreen

$content5 = Draw-PanelBase $gfx 5 "THE FAMILY TREE" $board $panels[4]
Draw-FittedText $gfx "QUADRILATERAL" `
    (New-Object System.Drawing.RectangleF(188, 1220, 220, 36)) 17 14 $BoardInk
Draw-FittedText $gfx "PARALLELOGRAM" `
    (New-Object System.Drawing.RectangleF(173, 1284, 250, 36)) 16 14 $BoardGreen
Draw-FittedText $gfx "RECTANGLE" `
    (New-Object System.Drawing.RectangleF(80, 1366, 170, 36)) 16 14 $BoardInk
Draw-FittedText $gfx "RHOMBUS" `
    (New-Object System.Drawing.RectangleF(360, 1366, 190, 36)) 16 14 $BoardInk
Draw-FittedText $gfx "SQUARE" `
    (New-Object System.Drawing.RectangleF(188, 1456, 220, 38)) 18 15 $BoardGreen
$treePen = New-Pen $BoardInk 4
Draw-Arrow $gfx $treePen 298 1256 298 1284
Draw-Arrow $gfx $treePen 250 1320 175 1366
Draw-Arrow $gfx $treePen 346 1320 445 1366
Draw-Arrow $gfx $treePen 165 1402 240 1456
Draw-Arrow $gfx $treePen 455 1402 356 1456
$treePen.Dispose()

$content6 = Draw-PanelBase $gfx 6 "SZE SZE'S CONCLUSION" $scene2 $panels[5]
Draw-Card $gfx "A SQUARE IS ALSO A`nRECTANGLE, RHOMBUS`nAND PARALLELOGRAM." `
    (New-Object System.Drawing.RectangleF(620, 1148, 252, 118)) `
    ([System.Drawing.Color]::FromArgb(246, 235, 250, 231)) `
    ([System.Drawing.Color]::FromArgb(255, 36, 126, 66)) `
    ([System.Drawing.Color]::FromArgb(255, 28, 92, 48)) 17

Save-Page $page "jm29-v11-04-all-in-one-square.png"

# V8 PAGE 5
$page = New-Page "QUADRILATERALS QUEST - PAGE 5: MEET THE KITE"
$gfx = $page.Graphics
$scene1 = "jm29-v11-p5-01-ms-tam-kite-sze-braids.png"
$scene3 = "jm29-v11-p5-03-ms-tam-explains-sze-braids.png"

$content1 = Draw-PanelBase $gfx 1 "ONE MORE QUADRILATERAL" $scene1 $panels[0]
Draw-Balloon $gfx "Today I am introducing a quadrilateral that is not in your textbook: the KITE." `
    (New-Object System.Drawing.RectangleF(24, 400, 330, 130)) `
    (New-Object System.Drawing.PointF(280, 340)) 19

$content2 = Draw-PanelBase $gfx 2 "TWO ADJACENT PAIRS" $board $panels[1]
$kitePen = New-Pen $BoardInk 6
$kA = Pt 900 212; $kB = Pt 790 292; $kC = Pt 1010 292; $kD = Pt 900 440
$gfx.DrawPolygon($kitePen, [System.Drawing.PointF[]]@($kA, $kC, $kD, $kB))
Draw-Tick $gfx $kitePen 845 252 144 1
Draw-Tick $gfx $kitePen 955 252 36 1
Draw-Tick $gfx $kitePen 845 366 53 2
Draw-Tick $gfx $kitePen 955 366 127 2
$kitePen.Dispose()
Draw-FittedText $gfx "AB = AC     DB = DC" `
    (New-Object System.Drawing.RectangleF(746, 452, 310, 36)) 19 15 $BoardGreen

$content3 = Draw-PanelBase $gfx 3 "THE DEFINING PROPERTY" $scene3 $panels[2]
Draw-Balloon $gfx "A kite has two pairs of adjacent equal sides." `
    (New-Object System.Drawing.RectangleF(24, 920, 320, 98)) `
    (New-Object System.Drawing.PointF(280, 840)) 21

$content4 = Draw-PanelBase $gfx 4 "PERPENDICULAR DIAGONALS" $board $panels[3]
$kitePen = New-Pen $BoardInk 6
$kA = Pt 900 722; $kB = Pt 790 802; $kC = Pt 1010 802; $kD = Pt 900 950
$kO = Pt 900 802
$gfx.DrawPolygon($kitePen, [System.Drawing.PointF[]]@($kA, $kC, $kD, $kB))
$gfx.DrawLine($kitePen, $kA, $kD)
$gfx.DrawLine($kitePen, $kB, $kC)
Draw-Tick $gfx $kitePen 845 802 0 1
Draw-Tick $gfx $kitePen 955 802 0 1
Draw-RightAngle $gfx $kitePen $kO $kA $kC 18
$kitePen.Dispose()
Draw-FittedText $gfx "THE DIAGONALS MEET AT 90 DEGREES" `
    (New-Object System.Drawing.RectangleF(720, 960, 360, 36)) 18 14 $BoardGreen

$content5 = Draw-PanelBase $gfx 5 "A MORE PRECISE FACT" $board $panels[4]
Draw-FittedText $gfx "The symmetry diagonal is perpendicular to, and bisects, the other diagonal." `
    (New-Object System.Drawing.RectangleF(92, 1240, 420, 180)) 23 17 $BoardInk

$content6 = Draw-PanelBase $gfx 6 "KITE SUMMARY" $scene3 $panels[5]
Draw-Card $gfx "KITE`n2 adjacent equal-side pairs`nPerpendicular diagonals" `
    (New-Object System.Drawing.RectangleF(620, 1148, 238, 108)) `
    ([System.Drawing.Color]::FromArgb(246, 235, 250, 231)) `
    ([System.Drawing.Color]::FromArgb(255, 36, 126, 66)) `
    ([System.Drawing.Color]::FromArgb(255, 28, 92, 48)) 16

Save-Page $page "jm29-v11-05-meet-the-kite.png"

# V8 PAGE 6
$page = New-Page "QUADRILATERALS QUEST - PAGE 6: WHY THE GATE CAN FOLD"
$gfx = $page.Graphics
$scene1 = "jm29-v11-p6-01-ming-asks-sze-braids.png"
$scene2 = "jm29-v11-p6-02-ms-tam-gate-sze-braids.png"

$content1 = Draw-PanelBase $gfx 1 "THE EXPANDING GATE" $scene1 $panels[0]
Draw-Balloon $gfx "Why can this gate fold flat using parallelograms, while a rectangle cannot?" `
    (New-Object System.Drawing.RectangleF(24, 404, 334, 124)) `
    (New-Object System.Drawing.PointF(330, 340)) 19

$content2 = Draw-PanelBase $gfx 2 "HINGED BARS" $scene2 $panels[1]
Draw-Balloon $gfx "Watch what stays true as I pull it sideways." `
    (New-Object System.Drawing.RectangleF(864, 432, 294, 92)) `
    (New-Object System.Drawing.PointF(1030, 350)) 21

$content3 = Draw-PanelBase $gfx 3 "OPEN AND COMPRESSED" $board $panels[2]
# A row of true rhombi (constant side length): each one thinner and taller than the last.
$gatePen = New-Pen $BoardInk 5
$gateSide = 58.0
$gateHalfWidths = @(49, 43, 36, 29, 21, 13)
$gateGap = 9
$gateCy = 838
$gateX = 94
Draw-FittedText $gfx "always rhombus" `
    (New-Object System.Drawing.RectangleF(92, 722, 430, 44)) 26 18 $BoardGreen
for ($i = 0; $i -lt $gateHalfWidths.Count; $i++) {
    $halfW = [double]$gateHalfWidths[$i]
    $halfH = [Math]::Sqrt($gateSide * $gateSide - $halfW * $halfW)
    $cx = $gateX + $halfW
    $diamond = [System.Drawing.PointF[]]@(
        (Pt $cx ($gateCy - $halfH)),
        (Pt ($cx + $halfW) $gateCy),
        (Pt $cx ($gateCy + $halfH)),
        (Pt ($cx - $halfW) $gateCy)
    )
    $gfx.DrawPolygon($gatePen, $diamond)
    $gateX = $cx + $halfW + $gateGap
}
Draw-Arrow $gfx $gatePen 94 922 512 922
$gatePen.Dispose()
Draw-FittedText $gfx "WIDER / LOWER" `
    (New-Object System.Drawing.RectangleF(92, 936, 160, 34)) 16 12 $BoardInk
Draw-FittedText $gfx "THINNER / TALLER" `
    (New-Object System.Drawing.RectangleF(358, 936, 165, 34)) 16 12 $BoardInk

$content4 = Draw-PanelBase $gfx 4 "WHAT STAYS TRUE?" $board $panels[3]
$paraPen = New-Pen $BoardInk 6
$pA = Pt 745 745; $pB = Pt 1045 745; $pC = Pt 1110 930; $pD = Pt 810 930
$gfx.DrawPolygon($paraPen, [System.Drawing.PointF[]]@($pA, $pB, $pC, $pD))
Draw-Chevron $gfx $paraPen 895 745 0 1
Draw-Chevron $gfx $paraPen 960 930 0 1
Draw-Chevron $gfx $paraPen 778 838 71 2
Draw-Chevron $gfx $paraPen 1078 838 71 2
$paraPen.Dispose()
Draw-FittedText $gfx "BOTH PAIRS OF OPPOSITE SIDES STAY PARALLEL" `
    (New-Object System.Drawing.RectangleF(710, 936, 390, 56)) 17 14 $BoardGreen

$content5 = Draw-PanelBase $gfx 5 "WHAT A RECTANGLE LOSES" $board $panels[4]
$lossPen = New-Pen $BoardInk 5
$gfx.DrawRectangle($lossPen, 95, 1250, 160, 160)
$la = Pt 360 1250; $lb = Pt 495 1250; $lc = Pt 522 1410; $ld = Pt 387 1410
$gfx.DrawPolygon($lossPen, [System.Drawing.PointF[]]@($la, $lb, $lc, $ld))
Draw-RightAngle $gfx $lossPen (Pt 95 1250) (Pt 255 1250) (Pt 95 1410) 18
Draw-Arrow $gfx $lossPen 272 1330 342 1330
$lossPen.Dispose()
Draw-FittedText $gfx "4 RIGHT ANGLES" `
    (New-Object System.Drawing.RectangleF(95, 1418, 160, 34)) 17 13 $BoardGreen
Draw-FittedText $gfx "ANGLES CHANGED" `
    (New-Object System.Drawing.RectangleF(372, 1418, 170, 34)) 17 13 $BoardRed

$content6 = Draw-PanelBase $gfx 6 "MS TAM EXPLAINS" $scene2 $panels[5]
Draw-Card $gfx "PARALLELOGRAM:`nopposite sides stay parallel.`nRECTANGLE: must keep 4 right angles." `
    (New-Object System.Drawing.RectangleF(620, 1148, 250, 120)) `
    ([System.Drawing.Color]::FromArgb(246, 235, 250, 231)) `
    ([System.Drawing.Color]::FromArgb(255, 36, 126, 66)) `
    ([System.Drawing.Color]::FromArgb(255, 28, 92, 48)) 15

Save-Page $page "jm29-v11-06-expanding-gate.png"
