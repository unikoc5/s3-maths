Add-Type -AssemblyName System.Drawing
$ErrorActionPreference = "Stop"

$asset = "C:\Users\tracy\.cursor\projects\c-Users-tracy-OneDrive-Desktop-S3-Maths\assets"

function Load-Bmp([string]$path) {
    $img = [System.Drawing.Image]::FromFile($path)
    try { return New-Object System.Drawing.Bitmap $img }
    finally { $img.Dispose() }
}

function GFrom([System.Drawing.Bitmap]$bmp) {
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
    $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    $g.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::AntiAliasGridFit
    return $g
}

function Card($g, $x, $y, $w, $h, $argb) {
    $br = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb($argb[0], $argb[1], $argb[2], $argb[3]))
    $path = New-Object System.Drawing.Drawing2D.GraphicsPath
    $r = 10
    $path.AddArc($x, $y, $r, $r, 180, 90)
    $path.AddArc($x + $w - $r, $y, $r, $r, 270, 90)
    $path.AddArc($x + $w - $r, $y + $h - $r, $r, $r, 0, 90)
    $path.AddArc($x, $y + $h - $r, $r, $r, 90, 90)
    $path.CloseFigure()
    $g.FillPath($br, $path)
    $pen = New-Pen ([System.Drawing.Color]::FromArgb(80, 40, 60, 80)) 1.4
    $g.DrawPath($pen, $path)
    $br.Dispose(); $pen.Dispose(); $path.Dispose()
}

function Txt($g, $text, $x, $y, $size, $rr, $gg, $bb, $bold=$true) {
    $style = if ($bold) { [System.Drawing.FontStyle]::Bold } else { [System.Drawing.FontStyle]::Regular }
    $font = New-Object System.Drawing.Font "Calibri", $size, $style, ([System.Drawing.GraphicsUnit]::Pixel)
    $br = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(255, $rr, $gg, $bb))
    $g.DrawString($text, $font, $br, $x, $y)
    $font.Dispose(); $br.Dispose()
}

function Heading($g, $x, $y, $w, $text) {
    $br = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(255, 248, 250, 252))
    $g.FillRectangle($br, $x, $y, $w, 22)
    $br.Dispose()
    Txt $g $text ($x + 28) ($y + 1) 13 20 70 130 $true
}

function SegInfo($x1, $y1, $x2, $y2) {
    $dx = $x2 - $x1; $dy = $y2 - $y1
    $len = [math]::Sqrt($dx * $dx + $dy * $dy)
    if ($len -lt 1) { $len = 1 }
    return @{ dx = $dx; dy = $dy; len = $len; ux = $dx / $len; uy = $dy / $len; px = -$dy / $len; py = $dx / $len }
}

function Draw-Tick($g, $pen, $x1, $y1, $x2, $y2, $count, $t) {
    $s = SegInfo $x1 $y1 $x2 $y2
    $cx = $x1 + $s.dx * $t
    $cy = $y1 + $s.dy * $t
    $half = 7
    $gap = 5
    for ($i = 0; $i -lt $count; $i++) {
        $off = ($i - ($count - 1) / 2.0) * $gap
        $mx = $cx + $s.ux * $off
        $my = $cy + $s.uy * $off
        $g.DrawLine($pen, $mx - $s.px * $half, $my - $s.py * $half, $mx + $s.px * $half, $my + $s.py * $half)
    }
}

function Draw-Chevron($g, $pen, $x1, $y1, $x2, $y2, $count, $t) {
    # Open chevron sitting ON the segment, rotated with it. Not a filled arrow.
    $s = SegInfo $x1 $y1 $x2 $y2
    $cx = $x1 + $s.dx * $t
    $cy = $y1 + $s.dy * $t
    $arm = 8
    $spread = 5.5
    $gap = 7
    for ($i = 0; $i -lt $count; $i++) {
        $off = ($i - ($count - 1) / 2.0) * $gap
        $mx = $cx + $s.ux * $off
        $my = $cy + $s.uy * $off
        $tipX = $mx + $s.ux * 3
        $tipY = $my + $s.uy * 3
        $g.DrawLine($pen,
            $tipX - $s.ux * $arm + $s.px * $spread,
            $tipY - $s.uy * $arm + $s.py * $spread,
            $tipX, $tipY)
        $g.DrawLine($pen,
            $tipX - $s.ux * $arm - $s.px * $spread,
            $tipY - $s.uy * $arm - $s.py * $spread,
            $tipX, $tipY)
    }
}

function Draw-AngleArc($g, $pen, $vx, $vy, $ax, $ay, $bx, $by, $radius) {
    $a1 = [math]::Atan2($ay - $vy, $ax - $vx) * 180 / [math]::PI
    $a2 = [math]::Atan2($by - $vy, $bx - $vx) * 180 / [math]::PI
    $sweep = $a2 - $a1
    while ($sweep -le -180) { $sweep += 360 }
    while ($sweep -gt 180) { $sweep -= 360 }
    $g.DrawArc($pen, $vx - $radius, $vy - $radius, $radius * 2, $radius * 2, $a1, $sweep)
}

function Draw-RightAngle($g, $pen, $vx, $vy, $ax, $ay, $bx, $by, $size) {
    $s1 = SegInfo $vx $vy $ax $ay
    $s2 = SegInfo $vx $vy $bx $by
    $p1x = $vx + $s1.ux * $size; $p1y = $vy + $s1.uy * $size
    $p2x = $vx + $s2.ux * $size; $p2y = $vy + $s2.uy * $size
    $cx = $p1x + $s2.ux * $size; $cy = $p1y + $s2.uy * $size
    $g.DrawLine($pen, $p1x, $p1y, $cx, $cy)
    $g.DrawLine($pen, $p2x, $p2y, $cx, $cy)
}

function Draw-PolyLines($g, $pen, $pts) {
    $n = $pts.Count
    for ($i = 0; $i -lt $n; $i++) {
        $j = ($i + 1) % $n
        $g.DrawLine($pen, $pts[$i][0], $pts[$i][1], $pts[$j][0], $pts[$j][1])
    }
}

function New-Pen($color, $width) {
    return New-Object -TypeName System.Drawing.Pen -ArgumentList @($color, [float]$width)
}

function Save-Page($bmp, $name) {
    $tmp = Join-Path $asset ($name + ".tmp.png")
    $final = Join-Path $asset $name
    $bmp.Save($tmp, [System.Drawing.Imaging.ImageFormat]::Png)
    $bmp.Dispose()
    Move-Item -Force $tmp $final
}

$ink = [System.Drawing.Color]::FromArgb(255, 25, 40, 60)
$blue = [System.Drawing.Color]::FromArgb(255, 30, 90, 200)
$orange = [System.Drawing.Color]::FromArgb(255, 220, 110, 20)
$green = [System.Drawing.Color]::FromArgb(255, 20, 120, 70)

# ---------------- P1: mark-legend cards ----------------
$page = Load-Bmp (Join-Path $asset "jm29-v5-01-shapes-around-us.png")
$g = GFrom $page
Card $g 455 560 380 185 @(245, 255, 252, 245)
Txt $g "chevrons = parallel" 470 568 14 20 70 130
$pen = New-Pen $blue 2.4
$g.DrawLine($pen, 480, 610, 700, 610)
$g.DrawLine($pen, 480, 640, 700, 640)
Draw-Chevron $g $pen 480 610 700 610 1 0.5
Draw-Chevron $g $pen 480 640 700 640 1 0.5
$pen.Dispose()
$pen = New-Pen $green 2.4
Txt $g "ticks = equal length" 470 655 14 20 90 50
$g.DrawLine($pen, 480, 700, 700, 700)
$g.DrawLine($pen, 480, 725, 700, 725)
Draw-Tick $g $pen 480 700 700 700 1 0.5
Draw-Tick $g $pen 480 725 700 725 1 0.5
$pen.Dispose()

Card $g 20 930 400 190 @(245, 255, 252, 245)
Txt $g "same arcs = equal angles" 32 938 14 20 70 130
$pen = New-Pen $ink 2.2
$g.DrawLine($pen, 50, 1020, 160, 980)
$g.DrawLine($pen, 50, 1020, 160, 1060)
Draw-AngleArc $g $pen 50 1020 160 980 160 1060 28
$g.DrawLine($pen, 210, 1020, 320, 980)
$g.DrawLine($pen, 210, 1020, 320, 1060)
Draw-AngleArc $g $pen 210 1020 320 980 320 1060 28
Txt $g "small square = 90 degrees" 32 1072 14 20 90 50
$g.DrawLine($pen, 250, 1105, 360, 1105)
$g.DrawLine($pen, 250, 1105, 250, 1048)
Draw-RightAngle $g $pen 250 1105 360 1105 250 1048 14
$pen.Dispose()
$g.Dispose(); Save-Page $page "jm29-v5-01-shapes-around-us.png"

# ---------------- P2: parallelogram definition / ticks ----------------
$page = Load-Bmp (Join-Path $asset "jm29-v5-02-tilting-frame.png")
$g = GFrom $page
Card $g 30 455 390 290 @(250, 255, 250, 245)
$pen = New-Pen $ink 2.6
# parallelogram A B C D  (A top-left, B top-right, C bottom-right, D bottom-left)
$A = @(90, 500); $B = @(360, 500); $C = @(320, 680); $D = @(50, 680)
Draw-PolyLines $g $pen @($A, $B, $C, $D)
Draw-Chevron $g $pen $A[0] $A[1] $B[0] $B[1] 1 0.5
Draw-Chevron $g $pen $D[0] $D[1] $C[0] $C[1] 1 0.5
Draw-Chevron $g $pen $A[0] $A[1] $D[0] $D[1] 2 0.5
Draw-Chevron $g $pen $B[0] $B[1] $C[0] $C[1] 2 0.5
$pen.Dispose()
Txt $g "PARALLELOGRAM =" 50 700 13 20 70 130
Txt $g "both pairs of opposite sides //" 50 718 13 20 40 60

Card $g 455 455 385 290 @(250, 255, 250, 245)
$pen = New-Pen $ink 2.6
$A = @(515, 500); $B = @(785, 500); $C = @(745, 680); $D = @(475, 680)
Draw-PolyLines $g $pen @($A, $B, $C, $D)
Draw-Tick $g $pen $A[0] $A[1] $B[0] $B[1] 1 0.5
Draw-Tick $g $pen $D[0] $D[1] $C[0] $C[1] 1 0.5
Draw-Tick $g $pen $A[0] $A[1] $D[0] $D[1] 2 0.5
Draw-Tick $g $pen $B[0] $B[1] $C[0] $C[1] 2 0.5
$pen.Dispose()
Txt $g "opposite sides equal" 475 700 13 20 70 130
Txt $g "after the shape is named" 475 718 13 20 40 60
$g.Dispose(); Save-Page $page "jm29-v5-02-tilting-frame.png"

# ---------------- P3: one-pair frames ----------------
$page = Load-Bmp (Join-Path $asset "jm29-v5-03-stall-frame-tests.png")
$g = GFrom $page
Card $g 455 95 385 300 @(248, 255, 250, 245)
$pen = New-Pen $ink 2.6
# trapezium: only top // bottom
$A = @(520, 160); $B = @(760, 160); $C = @(800, 320); $D = @(480, 320)
Draw-PolyLines $g $pen @($A, $B, $C, $D)
Draw-Chevron $g $pen $A[0] $A[1] $B[0] $B[1] 1 0.5
Draw-Chevron $g $pen $D[0] $D[1] $C[0] $C[1] 1 0.5
$pen.Dispose()
Txt $g "only ONE pair //  -> not enough" 470 350 13 160 50 40

Card $g 20 455 400 290 @(248, 255, 250, 245)
$pen = New-Pen $ink 2.6
# irregular quad, only one opposite pair equal
$A = @(70, 500); $B = @(360, 520); $C = @(330, 690); $D = @(90, 660)
Draw-PolyLines $g $pen @($A, $B, $C, $D)
Draw-Tick $g $pen $A[0] $A[1] $B[0] $B[1] 1 0.5
Draw-Tick $g $pen $D[0] $D[1] $C[0] $C[1] 1 0.5
$pen.Dispose()
Txt $g "only ONE pair equal -> not enough" 40 710 13 160 50 40
$g.Dispose(); Save-Page $page "jm29-v5-03-stall-frame-tests.png"

# ---------------- P4: opposite / adjacent angles ----------------
$page = Load-Bmp (Join-Path $asset "jm29-v5-04-railing-angles.png")
$g = GFrom $page
function Draw-ParaAngles($g, $ox, $oy, $showAll, $showAdj) {
    $A = @(($ox + 20), ($oy + 20)); $B = @(($ox + 250), ($oy + 20))
    $C = @(($ox + 220), ($oy + 150)); $D = @(($ox + 0), ($oy + 150))
    $pen = New-Pen $ink 2.4
    Draw-PolyLines $g $pen @($A, $B, $C, $D)
    $pen.Dispose()
    if ($showAll) {
        $pb = New-Pen $blue 2.6
        $po = New-Pen $orange 2.6
        Draw-AngleArc $g $pb $A[0] $A[1] $B[0] $B[1] $D[0] $D[1] 22
        Draw-AngleArc $g $pb $C[0] $C[1] $B[0] $B[1] $D[0] $D[1] 22
        Draw-AngleArc $g $po $B[0] $B[1] $A[0] $A[1] $C[0] $C[1] 18
        Draw-AngleArc $g $po $B[0] $B[1] $A[0] $A[1] $C[0] $C[1] 26
        Draw-AngleArc $g $po $D[0] $D[1] $A[0] $A[1] $C[0] $C[1] 18
        Draw-AngleArc $g $po $D[0] $D[1] $A[0] $A[1] $C[0] $C[1] 26
        $pb.Dispose(); $po.Dispose()
    }
    if ($showAdj) {
        $pb = New-Pen $blue 2.6
        $po = New-Pen $orange 2.6
        Draw-AngleArc $g $pb $A[0] $A[1] $B[0] $B[1] $D[0] $D[1] 24
        Draw-AngleArc $g $po $B[0] $B[1] $A[0] $A[1] $C[0] $C[1] 20
        Draw-AngleArc $g $po $B[0] $B[1] $A[0] $A[1] $C[0] $C[1] 28
        Txt $g "x" ($A[0] + 28) ($A[1] + 18) 14 30 90 200
        Txt $g "y" ($B[0] - 40) ($B[1] + 18) 14 220 110 20
        $pb.Dispose(); $po.Dispose()
    }
}
Card $g 455 200 385 200 @(250, 255, 252, 248)
Draw-ParaAngles $g 500 220 $true $false
Txt $g "BLUE = BLUE   ORANGE = ORANGE" 470 360 13 20 70 130

Card $g 30 500 390 230 @(250, 255, 252, 248)
Draw-ParaAngles $g 80 520 $true $false
Txt $g "opposite angles are equal" 50 690 13 20 70 130

Card $g 455 500 385 230 @(250, 255, 252, 248)
Draw-ParaAngles $g 510 520 $false $true
Txt $g 'x + y = 180   adjacent' 475 690 13 20 70 130
$g.Dispose(); Save-Page $page "jm29-v5-04-railing-angles.png"

# ---------------- P5: three diagonal diagrams + headings ----------------
$page = Load-Bmp (Join-Path $asset "jm29-v5-05-diagonal-facts.png")
$g = GFrom $page
Heading $g 8 52 416 "THE GATE AND THE WINDOW"
Heading $g 432 52 424 "THREE FACTS, OFTEN MIXED"
Heading $g 8 430 416 "PARALLELOGRAM: BISECT"
Heading $g 432 430 424 "RECTANGLE: BISECT + EQUAL"
Heading $g 8 778 416 "RHOMBUS: BISECT + PERPENDICULAR"
Heading $g 432 778 424 "SQUARE HAS ALL THREE"

Card $g 20 458 400 300 @(252, 255, 255, 252)
$pen = New-Pen $ink 2.4
$A = @(90, 500); $B = @(370, 520); $C = @(340, 700); $D = @(50, 680)
Draw-PolyLines $g $pen @($A, $B, $C, $D)
$Ox = ($A[0] + $C[0]) / 2; $Oy = ($A[1] + $C[1]) / 2
$g.DrawLine($pen, $A[0], $A[1], $C[0], $C[1])
$g.DrawLine($pen, $B[0], $B[1], $D[0], $D[1])
Draw-Tick $g $pen $A[0] $A[1] $Ox $Oy 1 0.5
Draw-Tick $g $pen $C[0] $C[1] $Ox $Oy 1 0.5
Draw-Tick $g $pen $B[0] $B[1] $Ox $Oy 2 0.5
Draw-Tick $g $pen $D[0] $D[1] $Ox $Oy 2 0.5
$pen.Dispose()
Txt $g "A" ($A[0] - 12) ($A[1] - 16) 12 20 40 60
Txt $g "B" ($B[0] + 4) ($B[1] - 16) 12 20 40 60
Txt $g "C" ($C[0] + 4) ($C[1] + 2) 12 20 40 60
Txt $g "D" ($D[0] - 14) ($D[1] + 2) 12 20 40 60
Txt $g "O" ($Ox + 6) ($Oy - 14) 12 20 40 60
Txt $g "AO = OC ,  BO = OD" 40 720 13 20 70 130
Txt $g "NOT  AO = BO" 40 738 13 160 50 40

Card $g 450 458 390 300 @(252, 255, 255, 252)
$pen = New-Pen $ink 2.4
$A = @(490, 500); $B = @(800, 500); $C = @(800, 700); $D = @(490, 700)
Draw-PolyLines $g $pen @($A, $B, $C, $D)
$Ox = 645; $Oy = 600
$g.DrawLine($pen, $A[0], $A[1], $C[0], $C[1])
$g.DrawLine($pen, $B[0], $B[1], $D[0], $D[1])
Draw-Tick $g $pen $A[0] $A[1] $Ox $Oy 1 0.5
Draw-Tick $g $pen $C[0] $C[1] $Ox $Oy 1 0.5
Draw-Tick $g $pen $B[0] $B[1] $Ox $Oy 2 0.5
Draw-Tick $g $pen $D[0] $D[1] $Ox $Oy 2 0.5
# equal full diagonals: extra matching mark near mid of each diagonal, offset
$pen3 = New-Pen ([System.Drawing.Color]::FromArgb(255, 20, 120, 70)) 2.4
Draw-Tick $g $pen3 $A[0] $A[1] $C[0] $C[1] 1 0.28
Draw-Tick $g $pen3 $B[0] $B[1] $D[0] $D[1] 1 0.28
$pen.Dispose(); $pen3.Dispose()
Txt $g "A" ($A[0] - 14) ($A[1] - 16) 12 20 40 60
Txt $g "B" ($B[0] + 4) ($B[1] - 16) 12 20 40 60
Txt $g "C" ($C[0] + 4) ($C[1] + 2) 12 20 40 60
Txt $g "D" ($D[0] - 14) ($D[1] + 2) 12 20 40 60
Txt $g "O" ($Ox + 6) ($Oy - 14) 12 20 40 60
Txt $g "bisect, and AC = BD" 470 720 13 20 70 130
Txt $g "no right angle at O" 470 738 13 160 50 40

Card $g 20 805 400 320 @(252, 255, 255, 252)
$pen = New-Pen $ink 2.4
$A = @(210, 830); $B = @(390, 960); $C = @(210, 1090); $D = @(40, 960)
Draw-PolyLines $g $pen @($A, $B, $C, $D)
$Ox = 210; $Oy = 960
$g.DrawLine($pen, $A[0], $A[1], $C[0], $C[1])
$g.DrawLine($pen, $B[0], $B[1], $D[0], $D[1])
Draw-Tick $g $pen $A[0] $A[1] $Ox $Oy 1 0.5
Draw-Tick $g $pen $C[0] $C[1] $Ox $Oy 1 0.5
Draw-Tick $g $pen $B[0] $B[1] $Ox $Oy 2 0.5
Draw-Tick $g $pen $D[0] $D[1] $Ox $Oy 2 0.5
Draw-RightAngle $g $pen $Ox $Oy $A[0] $A[1] $B[0] $B[1] 14
$pen.Dispose()
Txt $g "A" ($A[0] + 8) ($A[1] - 4) 12 20 40 60
Txt $g "B" ($B[0] + 4) ($B[1] - 8) 12 20 40 60
Txt $g "C" ($C[0] + 8) ($C[1] - 2) 12 20 40 60
Txt $g "D" ($D[0] - 14) ($D[1] - 8) 12 20 40 60
Txt $g "O" ($Ox + 8) ($Oy - 16) 12 20 40 60
Txt $g "bisect + perpendicular at O" 36 1098 13 20 70 130

Card $g 450 900 390 220 @(236, 232, 250, 232)
Txt $g "parallelogram  - bisect" 465 910 14 20 50 70
Txt $g "rectangle      - bisect + equal" 465 932 14 20 50 70
Txt $g "rhombus        - bisect + perpendicular" 465 954 14 20 50 70
Txt $g "square         - all three" 465 976 14 20 50 70
Txt $g "Read the exact fact - don't swap words." 465 1010 13 20 70 130
$g.Dispose(); Save-Page $page "jm29-v5-05-diagonal-facts.png"

# ---------------- P6: rhombus ticks + diagonal clues ----------------
$page = Load-Bmp (Join-Path $asset "jm29-v5-06-rhombus-design.png")
$g = GFrom $page
# ticks on the large diamond in panel 3
$pen = New-Pen $ink 2.6
$A = @(216, 455); $B = @(400, 640); $C = @(216, 825); $D = @(32, 640)
# The generated diamond is large and centered in left-middle. Overlay ticks only.
Draw-Tick $g $pen $A[0] $A[1] $B[0] $B[1] 1 0.5
Draw-Tick $g $pen $B[0] $B[1] $C[0] $C[1] 1 0.5
Draw-Tick $g $pen $C[0] $C[1] $D[0] $D[1] 1 0.5
Draw-Tick $g $pen $D[0] $D[1] $A[0] $A[1] 1 0.5
$pen.Dispose()

Card $g 20 820 400 300 @(250, 255, 252, 248)
$pen = New-Pen $ink 2.4
$A = @(210, 845); $B = @(390, 975); $C = @(210, 1105); $D = @(40, 975)
Draw-PolyLines $g $pen @($A, $B, $C, $D)
$Ox = 210; $Oy = 975
$g.DrawLine($pen, $A[0], $A[1], $C[0], $C[1])
$g.DrawLine($pen, $B[0], $B[1], $D[0], $D[1])
Draw-RightAngle $g $pen $Ox $Oy $A[0] $A[1] $B[0] $B[1] 14
Draw-AngleArc $g $pen $A[0] $A[1] $B[0] $B[1] $D[0] $D[1] 20
Draw-AngleArc $g $pen $C[0] $C[1] $B[0] $B[1] $D[0] $D[1] 20
Draw-Tick $g $pen $A[0] $A[1] $B[0] $B[1] 1 0.5
Draw-Tick $g $pen $A[0] $A[1] $D[0] $D[1] 1 0.5
Draw-Tick $g $pen $C[0] $C[1] $B[0] $B[1] 1 0.5
Draw-Tick $g $pen $C[0] $C[1] $D[0] $D[1] 1 0.5
$pen.Dispose()
Txt $g "perpendicular at O" 40 1088 12 20 70 130
Txt $g "diagonals bisect vertex angles" 40 1104 12 20 70 130
$g.Dispose(); Save-Page $page "jm29-v5-06-rhombus-design.png"

# ---------------- P7: ticks on rhombus/square + family ----------------
$page = Load-Bmp (Join-Path $asset "jm29-v5-07-rectangle-square.png")
$g = GFrom $page
# Panel 3 tile is a wide diamond/rhombus held by girl - add side ticks, cover wrong corner squares with small cream dots then ticks
$pen = New-Pen $ink 2.5
# approximate rhombus in panel 3 (lower-left content)
$A = @(215, 500); $B = @(385, 600); $C = @(215, 700); $D = @(55, 600)
Draw-Tick $g $pen $A[0] $A[1] $B[0] $B[1] 1 0.5
Draw-Tick $g $pen $B[0] $B[1] $C[0] $C[1] 1 0.5
Draw-Tick $g $pen $C[0] $C[1] $D[0] $D[1] 1 0.5
Draw-Tick $g $pen $D[0] $D[1] $A[0] $A[1] 1 0.5
# Panel 4 square - add side ticks
$S1 = @(500, 520); $S2 = @(740, 520); $S3 = @(740, 740); $S4 = @(500, 740)
Draw-Tick $g $pen $S1[0] $S1[1] $S2[0] $S2[1] 1 0.5
Draw-Tick $g $pen $S2[0] $S2[1] $S3[0] $S3[1] 1 0.5
Draw-Tick $g $pen $S3[0] $S3[1] $S4[0] $S4[1] 1 0.5
Draw-Tick $g $pen $S4[0] $S4[1] $S1[0] $S1[1] 1 0.5
$pen.Dispose()

Card $g 20 820 400 300 @(252, 255, 255, 250)
Txt $g "BOTH FAMILIES" 40 828 14 20 70 130
$pen = New-Pen $ink 2
$g.DrawRectangle($pen, 40, 860, 130, 40)
$g.DrawRectangle($pen, 250, 860, 130, 40)
$g.DrawRectangle($pen, 145, 1000, 130, 40)
$g.DrawLine($pen, 105, 900, 180, 1000)
$g.DrawLine($pen, 315, 900, 240, 1000)
$pen.Dispose()
Txt $g "RECTANGLE" 52 868 13 20 50 70
Txt $g "RHOMBUS" 270 868 13 20 50 70
Txt $g "SQUARE" 170 1008 13 20 50 70
Txt $g "4 right angles" 48 902 11 80 80 80 $false
Txt $g "4 equal sides" 262 902 11 80 80 80 $false
Txt $g "needs BOTH" 160 1048 12 20 70 130
$g.Dispose(); Save-Page $page "jm29-v5-07-rectangle-square.png"

# ---------------- P8: trapezium marks ----------------
$page = Load-Bmp (Join-Path $asset "jm29-v5-08-trapezium-bridge.png")
$g = GFrom $page
Card $g 450 120 390 280 @(250, 255, 252, 248)
$pen = New-Pen $ink 2.5
$A = @(530, 170); $B = @(760, 170); $C = @(810, 330); $D = @(470, 330)
Draw-PolyLines $g $pen @($A, $B, $C, $D)
Draw-Chevron $g $pen $A[0] $A[1] $B[0] $B[1] 1 0.5
Draw-Chevron $g $pen $D[0] $D[1] $C[0] $C[1] 1 0.5
$pen.Dispose()
Txt $g "exactly ONE pair //" 470 350 13 20 70 130

Card $g 450 455 390 290 @(250, 255, 252, 248)
$pen = New-Pen $ink 2.5
$A = @(500, 500); $B = @(780, 500); $C = @(740, 680); $D = @(470, 680)
Draw-PolyLines $g $pen @($A, $B, $C, $D)
Draw-Chevron $g $pen $A[0] $A[1] $B[0] $B[1] 1 0.5
Draw-Chevron $g $pen $D[0] $D[1] $C[0] $C[1] 1 0.5
Draw-Chevron $g $pen $A[0] $A[1] $D[0] $D[1] 2 0.5
Draw-Chevron $g $pen $B[0] $B[1] $C[0] $C[1] 2 0.5
$pen.Dispose()
Txt $g "TWO pairs //  -> parallelogram" 470 700 13 160 50 40

Card $g 20 820 400 300 @(250, 255, 252, 248)
$pen = New-Pen $ink 2.5
$A = @(90, 870); $B = @(300, 870); $C = @(370, 1050); $D = @(50, 1050)
Draw-PolyLines $g $pen @($A, $B, $C, $D)
Draw-Chevron $g $pen $A[0] $A[1] $B[0] $B[1] 1 0.5
Draw-Chevron $g $pen $D[0] $D[1] $C[0] $C[1] 1 0.5
$pb = New-Pen $blue 2.5
$po = New-Pen $orange 2.5
Draw-AngleArc $g $pb $A[0] $A[1] $B[0] $B[1] $D[0] $D[1] 24
Draw-AngleArc $g $po $D[0] $D[1] $A[0] $A[1] $C[0] $C[1] 24
$pen.Dispose(); $pb.Dispose(); $po.Dispose()
Txt $g "x" 115 900 14 30 90 200
Txt $g "y" 70 990 14 220 110 20
Txt $g 'x + y = 180  along one leg' 50 1070 13 20 70 130
$g.Dispose(); Save-Page $page "jm29-v5-08-trapezium-bridge.png"

# ---------------- P10: kite diagrams ----------------
$page = Load-Bmp (Join-Path $asset "jm29-v5-10-kite-enrichment.png")
$g = GFrom $page
function Draw-KiteOutline($g, $pen, $A, $B, $C, $D) {
    Draw-PolyLines $g $pen @($A, $B, $D, $C)
}

Card $g 20 455 400 300 @(252, 255, 255, 250)
$pen = New-Pen $ink 2.5
$A = @(220, 480); $B = @(70, 620); $C = @(370, 620); $D = @(220, 730)
Draw-KiteOutline $g $pen $A $B $C $D
Draw-Tick $g $pen $A[0] $A[1] $B[0] $B[1] 1 0.5
Draw-Tick $g $pen $A[0] $A[1] $C[0] $C[1] 1 0.5
Draw-Tick $g $pen $D[0] $D[1] $B[0] $B[1] 2 0.5
Draw-Tick $g $pen $D[0] $D[1] $C[0] $C[1] 2 0.5
$pen.Dispose()
Txt $g "A" ($A[0] + 8) ($A[1] - 16) 12 20 40 60
Txt $g "B" ($B[0] - 14) ($B[1] - 8) 12 20 40 60
Txt $g "C" ($C[0] + 4) ($C[1] - 8) 12 20 40 60
Txt $g "D" ($D[0] + 8) ($D[1] + 2) 12 20 40 60
Txt $g "AB = AC   DB = DC" 50 700 13 20 70 130
Txt $g "two adjacent pairs  - not a rhombus" 50 718 12 160 50 40

Card $g 450 455 390 300 @(252, 255, 255, 250)
$pen = New-Pen $ink 2.5
$A = @(645, 480); $B = @(500, 620); $C = @(790, 620); $D = @(645, 730)
Draw-KiteOutline $g $pen $A $B $C $D
$g.DrawLine($pen, $A[0], $A[1], $D[0], $D[1])
$g.DrawLine($pen, $B[0], $B[1], $C[0], $C[1])
$Ox = 645; $Oy = 620
Draw-RightAngle $g $pen $Ox $Oy $A[0] $A[1] $C[0] $C[1] 14
Draw-Tick $g $pen $B[0] $B[1] $Ox $Oy 1 0.5
Draw-Tick $g $pen $C[0] $C[1] $Ox $Oy 1 0.5
$pen.Dispose()
Txt $g "A" ($A[0] + 8) ($A[1] - 16) 12 20 40 60
Txt $g "B" ($B[0] - 14) ($B[1] - 8) 12 20 40 60
Txt $g "C" ($C[0] + 4) ($C[1] - 8) 12 20 40 60
Txt $g "D" ($D[0] + 8) ($D[1] + 2) 12 20 40 60
Txt $g "O" ($Ox + 8) ($Oy - 16) 12 20 40 60
Txt $g "AD  _|_  BC    and    BO = OC" 470 700 13 20 70 130
Txt $g "do not mark AO = OD" 470 718 12 160 50 40

Card $g 20 805 400 320 @(252, 255, 255, 250)
$pen = New-Pen $ink 2.5
$A = @(220, 830); $B = @(70, 975); $C = @(370, 975); $D = @(220, 1090)
Draw-KiteOutline $g $pen $A $B $C $D
$g.DrawLine($pen, $A[0], $A[1], $D[0], $D[1])
Draw-AngleArc $g $pen $A[0] $A[1] $B[0] $B[1] $D[0] $D[1] 22
# wait: AD splits angle BAC? Angle at A is angle BAC between AB and AC.
# AD is the bisector of angle BAC (and of BDC).
Draw-AngleArc $g $pen $A[0] $A[1] $B[0] $B[1] $C[0] $C[1] 22
# That's the whole angle. Need TWO equal arcs, one in ABD-side and one in ACD-side.
# Redraw properly: arc AB-AD and arc AD-AC
$pen.Dispose()
$pen = New-Pen $ink 2.5
Draw-KiteOutline $g $pen $A $B $C $D
$g.DrawLine($pen, $A[0], $A[1], $D[0], $D[1])
Draw-AngleArc $g $pen $A[0] $A[1] $B[0] $B[1] $D[0] $D[1] 24
Draw-AngleArc $g $pen $A[0] $A[1] $C[0] $C[1] $D[0] $D[1] 24
Draw-AngleArc $g $pen $D[0] $D[1] $B[0] $B[1] $A[0] $A[1] 20
Draw-AngleArc $g $pen $D[0] $D[1] $C[0] $C[1] $A[0] $A[1] 20
Draw-AngleArc $g $pen $D[0] $D[1] $B[0] $B[1] $A[0] $A[1] 28
Draw-AngleArc $g $pen $D[0] $D[1] $C[0] $C[1] $A[0] $A[1] 28
$pen.Dispose()
Txt $g "only AD bisects top & bottom angles" 36 1100 12 20 70 130
Txt $g "one line of symmetry" 36 1116 12 20 70 130
$g.Dispose(); Save-Page $page "jm29-v5-10-kite-enrichment.png"

Write-Output "V5 geometry overlays written."
