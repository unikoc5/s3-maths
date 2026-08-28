# Export a PowerPoint deck to MP4 for Worked Solutions video viewer.
# Usage:
#   .\export_ppt_video.ps1 -Pptx "path\to\deck.pptx" -OutMp4 "path\to\main.mp4"
param(
  [Parameter(Mandatory = $true)][string]$Pptx,
  [Parameter(Mandatory = $true)][string]$OutMp4,
  [int]$VertResolution = 720,
  [int]$Fps = 30,
  [int]$Quality = 85,
  [int]$DefaultSlideDuration = 5
)
$ErrorActionPreference = "Stop"
if (-not (Test-Path $Pptx)) { Write-Error "PPTX not found: $Pptx"; exit 1 }
$outDir = Split-Path $OutMp4 -Parent
New-Item -ItemType Directory -Force -Path $outDir | Out-Null
if (Test-Path $OutMp4) { Remove-Item $OutMp4 -Force -ErrorAction SilentlyContinue }

Write-Host "Opening PowerPoint..." -ForegroundColor Cyan
$pp = New-Object -ComObject PowerPoint.Application
$pp.Visible = [Microsoft.Office.Core.MsoTriState]::msoTrue
$pres = $pp.Presentations.Open(
  (Resolve-Path $Pptx).Path,
  [Microsoft.Office.Core.MsoTriState]::msoTrue,
  [Microsoft.Office.Core.MsoTriState]::msoFalse,
  [Microsoft.Office.Core.MsoTriState]::msoFalse
)
Write-Host "Exporting video (this may take several minutes)..." -ForegroundColor Cyan
Write-Host "  -> $OutMp4"
$pres.CreateVideo($OutMp4, $false, $DefaultSlideDuration, $VertResolution, $Fps, $Quality)
$deadline = (Get-Date).AddMinutes(45)
while ($true) {
  $st = $pres.CreateVideoStatus
  if ($st -eq 3) { break }
  if ($st -eq 4) { Write-Error "Export failed (status Failed)"; exit 1 }
  if ((Get-Date) -gt $deadline) { Write-Error "Export timed out (last status $st)"; exit 1 }
  Start-Sleep 15
  $mb = if (Test-Path $OutMp4) { [math]::Round((Get-Item $OutMp4).Length / 1MB, 1) } else { 0 }
  Write-Host "  status $st ... ${mb}MB"
}
$pres.Close()
$pp.Quit()
[void][System.Runtime.Interopservices.Marshal]::ReleaseComObject($pres)
[void][System.Runtime.Interopservices.Marshal]::ReleaseComObject($pp)

if (-not (Test-Path $OutMp4)) { Write-Error "MP4 not created"; exit 1 }
$len = (Get-Item $OutMp4).Length
Write-Host "Done: $OutMp4 ($([math]::Round($len/1MB,1)) MB)" -ForegroundColor Green
