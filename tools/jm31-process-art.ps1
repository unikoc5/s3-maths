# JM31 Average Trial: turn the raw generated art into game assets.
#   sheets (sheet-<who>.png, 4 poses on magenta)  -> <who>-1..4.png  (keyed, split, same baseline)
#   furniture (fg-*.png on magenta)                -> fg-*.png        (keyed, cropped)
#   backgrounds (everything else)                  -> <name>.jpg      (resized to $BgWidth)
param(
  [string]$Raw = "C:\Users\tracy\Pictures\jm31-average-trial-raw",
  [string]$Out = (Join-Path $PSScriptRoot "..\topics\central_tendency\game"),
  [int]$BgWidth = 960,
  [string[]]$Only = @()
)
$ErrorActionPreference = "Stop"
Add-Type -AssemblyName System.Drawing

Add-Type -ReferencedAssemblies System.Drawing -TypeDefinition @"
using System;
using System.Collections.Generic;
using System.Drawing;
using System.Drawing.Imaging;
using System.Runtime.InteropServices;

public static class AtArt {
  static bool IsKey(int r, int g, int b) {
    if (r > 150 && b > 150 && g < 120) return true;
    int mn = Math.Min(r, b);
    return mn > 60 && g < mn - 60 && Math.Abs(r - b) < 90;
  }

  public static Bitmap Keyed(string path) {
    Bitmap src = new Bitmap(path);
    Bitmap bmp = new Bitmap(src.Width, src.Height, PixelFormat.Format32bppArgb);
    using (Graphics g = Graphics.FromImage(bmp)) g.DrawImage(src, 0, 0, src.Width, src.Height);
    src.Dispose();
    Rectangle rc = new Rectangle(0, 0, bmp.Width, bmp.Height);
    BitmapData d = bmp.LockBits(rc, ImageLockMode.ReadWrite, PixelFormat.Format32bppArgb);
    int n = d.Stride * bmp.Height;
    byte[] px = new byte[n];
    Marshal.Copy(d.Scan0, px, 0, n);
    int w = bmp.Width, h = bmp.Height;
    bool[] key = new bool[w * h];
    for (int y = 0; y < h; y++) for (int x = 0; x < w; x++) {
      int i = y * d.Stride + x * 4;
      key[y * w + x] = IsKey(px[i + 2], px[i + 1], px[i]);
    }
    const int R = 3;
    for (int y = 0; y < h; y++) for (int x = 0; x < w; x++) {
      int i = y * d.Stride + x * 4;
      if (key[y * w + x]) { px[i] = 0; px[i + 1] = 0; px[i + 2] = 0; px[i + 3] = 0; continue; }
      bool near = false;
      for (int dy = -R; dy <= R && !near; dy++) for (int dx = -R; dx <= R; dx++) {
        int nx = x + dx, ny = y + dy;
        if (nx >= 0 && ny >= 0 && nx < w && ny < h && key[ny * w + nx]) { near = true; break; }
      }
      if (!near) continue;
      int bb = px[i], gg = px[i + 1], rr = px[i + 2];
      int m = Math.Min(rr, bb) - gg;
      if (m > 0) { px[i + 2] = (byte)(rr - m); px[i] = (byte)(bb - m); }
    }
    Marshal.Copy(px, 0, d.Scan0, n);
    bmp.UnlockBits(d);
    return bmp;
  }

  static int[] Profile(Bitmap bmp, bool cols, out int[] firstLast) {
    Rectangle rc = new Rectangle(0, 0, bmp.Width, bmp.Height);
    BitmapData d = bmp.LockBits(rc, ImageLockMode.ReadOnly, PixelFormat.Format32bppArgb);
    int n = d.Stride * bmp.Height;
    byte[] px = new byte[n];
    Marshal.Copy(d.Scan0, px, 0, n);
    bmp.UnlockBits(d);
    int len = cols ? bmp.Width : bmp.Height;
    int[] c = new int[len];
    for (int y = 0; y < bmp.Height; y++) for (int x = 0; x < bmp.Width; x++) {
      if (px[y * d.Stride + x * 4 + 3] > 0) c[cols ? x : y]++;
    }
    int f = -1, l = -1;
    for (int i = 0; i < len; i++) if (c[i] >= 3) { if (f < 0) f = i; l = i; }
    firstLast = new int[] { f, l };
    return c;
  }

  public static int[] Bounds(Bitmap bmp) {
    int[] cx, cy;
    Profile(bmp, true, out cx);
    Profile(bmp, false, out cy);
    return new int[] { cx[0], cy[0], cx[1], cy[1] };
  }

  // Column runs of opaque pixels, merged into exactly 'want' segments.
  public static List<int[]> Segments(Bitmap bmp, int want) {
    int[] fl;
    int[] c = Profile(bmp, true, out fl);
    List<int[]> runs = new List<int[]>();
    int start = -1;
    for (int x = 0; x < c.Length; x++) {
      bool on = c[x] >= 3;
      if (on && start < 0) start = x;
      if (!on && start >= 0) { runs.Add(new int[] { start, x - 1 }); start = -1; }
    }
    if (start >= 0) runs.Add(new int[] { start, c.Length - 1 });
    runs.RemoveAll(r => r[1] - r[0] < 4);
    while (runs.Count > want) {
      int best = 1, gap = int.MaxValue;
      for (int i = 1; i < runs.Count; i++) {
        int gp = runs[i][0] - runs[i - 1][1];
        int wa = runs[i - 1][1] - runs[i - 1][0], wb = runs[i][1] - runs[i][0];
        int score = gp * 4 + Math.Min(wa, wb);
        if (score < gap) { gap = score; best = i; }
      }
      runs[best - 1] = new int[] { runs[best - 1][0], runs[best][1] };
      runs.RemoveAt(best);
    }
    while (runs.Count < want) {
      int wi = 0;
      for (int i = 1; i < runs.Count; i++) if (runs[i][1] - runs[i][0] > runs[wi][1] - runs[wi][0]) wi = i;
      int a = runs[wi][0], b = runs[wi][1], span = b - a;
      int cut = a + span / 2, low = int.MaxValue;
      for (int x = a + span * 3 / 10; x <= a + span * 7 / 10; x++) if (c[x] < low) { low = c[x]; cut = x; }
      runs[wi] = new int[] { a, cut - 1 };
      runs.Insert(wi + 1, new int[] { cut + 1, b });
    }
    return runs;
  }

  public static void Crop(Bitmap bmp, int x0, int y0, int x1, int y1, int pad, bool scraps, string path) {
    x0 = Math.Max(0, x0 - pad); x1 = Math.Min(bmp.Width - 1, x1 + pad);
    y0 = Math.Max(0, y0 - pad); y1 = Math.Min(bmp.Height - 1, y1);
    Rectangle r = new Rectangle(x0, y0, x1 - x0 + 1, y1 - y0 + 1);
    using (Bitmap c = bmp.Clone(r, PixelFormat.Format32bppArgb)) {
      if (scraps) DropSideScraps(c);
      double k = Scale / bmp.Width;
      if (k >= 1) { c.Save(path, ImageFormat.Png); return; }
      int w = Math.Max(1, (int)Math.Round(c.Width * k)), h = Math.Max(1, (int)Math.Round(c.Height * k));
      using (Bitmap o = new Bitmap(w, h, PixelFormat.Format32bppArgb))
      using (Graphics g = Graphics.FromImage(o)) {
        g.InterpolationMode = System.Drawing.Drawing2D.InterpolationMode.HighQualityBicubic;
        g.PixelOffsetMode = System.Drawing.Drawing2D.PixelOffsetMode.HighQuality;
        using (ImageAttributes ia = new ImageAttributes()) {
          ia.SetWrapMode(System.Drawing.Drawing2D.WrapMode.TileFlipXY);
          g.DrawImage(c, new Rectangle(0, 0, w, h), 0, 0, c.Width, c.Height, GraphicsUnit.Pixel, ia);
        }
        o.Save(path, ImageFormat.Png);
      }
    }
  }

  public static double Scale = 1e9;

  // Remove pieces of neighbouring poses: components touching the left/right edge that are not the main body.
  static void DropSideScraps(Bitmap bmp) {
    Rectangle rc = new Rectangle(0, 0, bmp.Width, bmp.Height);
    BitmapData d = bmp.LockBits(rc, ImageLockMode.ReadWrite, PixelFormat.Format32bppArgb);
    int n = d.Stride * bmp.Height, w = bmp.Width, h = bmp.Height;
    byte[] px = new byte[n];
    Marshal.Copy(d.Scan0, px, 0, n);
    int[] lab = new int[w * h];
    List<int> size = new List<int> { 0 };
    List<bool> side = new List<bool> { false };
    Stack<int> st = new Stack<int>();
    for (int s = 0; s < w * h; s++) {
      if (lab[s] != 0 || px[(s / w) * d.Stride + (s % w) * 4 + 3] == 0) continue;
      int id = size.Count; size.Add(0); side.Add(false);
      lab[s] = id; st.Push(s);
      while (st.Count > 0) {
        int p = st.Pop(), x = p % w, y = p / w;
        size[id]++;
        if (x == 0 || x == w - 1) side[id] = true;
        for (int k = 0; k < 4; k++) {
          int nx = x + (k == 0 ? 1 : k == 1 ? -1 : 0), ny = y + (k == 2 ? 1 : k == 3 ? -1 : 0);
          if (nx < 0 || ny < 0 || nx >= w || ny >= h) continue;
          int q = ny * w + nx;
          if (lab[q] != 0 || px[ny * d.Stride + nx * 4 + 3] == 0) continue;
          lab[q] = id; st.Push(q);
        }
      }
    }
    int main = 1;
    for (int i = 1; i < size.Count; i++) if (size[i] > size[main]) main = i;
    for (int p = 0; p < w * h; p++) {
      int id = lab[p];
      if (id != 0 && id != main && side[id]) px[(p / w) * d.Stride + (p % w) * 4 + 3] = 0;
    }
    Marshal.Copy(px, 0, d.Scan0, n);
    bmp.UnlockBits(d);
  }

  public static void Resize(string src, string dst, int width) {
    using (Bitmap s = new Bitmap(src)) {
      int h = (int)Math.Round(s.Height * (double)width / s.Width);
      using (Bitmap b = new Bitmap(width, h, PixelFormat.Format24bppRgb))
      using (Graphics g = Graphics.FromImage(b)) {
        g.InterpolationMode = System.Drawing.Drawing2D.InterpolationMode.HighQualityBicubic;
        g.PixelOffsetMode = System.Drawing.Drawing2D.PixelOffsetMode.HighQuality;
        g.DrawImage(s, new Rectangle(0, 0, width, h));
        ImageCodecInfo jpg = Array.Find(ImageCodecInfo.GetImageEncoders(), e => e.MimeType == "image/jpeg");
        EncoderParameters ep = new EncoderParameters(1);
        ep.Param[0] = new EncoderParameter(System.Drawing.Imaging.Encoder.Quality, 88L);
        b.Save(dst, jpg, ep);
      }
    }
  }
}
"@

New-Item -ItemType Directory -Force $Out | Out-Null
$Out = (Resolve-Path $Out).Path
[AtArt]::Scale = $BgWidth

foreach ($file in Get-ChildItem $Raw -Filter *.png) {
  $name = $file.BaseName
  if ($Only.Count -and ($Only -notcontains $name)) { continue }
  if ($name -like "sheet-*") {
    $who = $name.Substring(6)
    $bmp = [AtArt]::Keyed($file.FullName)
    $segs = [AtArt]::Segments($bmp, 4)
    $b = [AtArt]::Bounds($bmp)
    if ($segs.Count -ne 4) { Write-Warning "$name : found $($segs.Count) poses" }
    for ($i = 0; $i -lt $segs.Count; $i++) {
      [AtArt]::Crop($bmp, $segs[$i][0], $b[1], $segs[$i][1], $b[3], 4, $true, (Join-Path $Out "$who-$($i + 1).png"))
    }
    $bmp.Dispose()
    "sheet  $who  -> $($segs.Count) poses, rows $($b[1])..$($b[3])"
  } elseif ($name -like "fg-*") {
    $bmp = [AtArt]::Keyed($file.FullName)
    $b = [AtArt]::Bounds($bmp)
    [AtArt]::Crop($bmp, $b[0], $b[1], $b[2], $b[3], 0, $false, (Join-Path $Out "$name.png"))
    $bmp.Dispose()
    "fg     $name -> $($b[2] - $b[0] + 1) x $($b[3] - $b[1] + 1)"
  } else {
    Remove-Item (Join-Path $Out "$name.png") -ErrorAction SilentlyContinue
    [AtArt]::Resize($file.FullName, (Join-Path $Out "$name.jpg"), $BgWidth)
    "bg     $name"
  }
}

# Poses whose neighbour touches them on the sheet: keep only the left N pixels.
$TrimRight = @{ "max-3" = 218 }
foreach ($k in $TrimRight.Keys) {
  $p = Join-Path $Out "$k.png"
  if (-not (Test-Path $p)) { continue }
  $src = New-Object System.Drawing.Bitmap $p
  if ($src.Width -gt $TrimRight[$k]) {
    $c = $src.Clone((New-Object System.Drawing.Rectangle 0, 0, $TrimRight[$k], $src.Height), $src.PixelFormat)
    $src.Dispose(); $c.Save($p, [System.Drawing.Imaging.ImageFormat]::Png); $c.Dispose()
    "trim   $k -> $($TrimRight[$k]) px wide"
  } else { $src.Dispose() }
}

# victor-2's lower hand on the viewer's left is his own arm. Do not scrub it.
