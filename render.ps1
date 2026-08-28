# Render a Manim-Slides scene and convert it to a self-contained HTML deck.
#
# Usage (from dashboard/):
#   .\render.ps1 -SceneFile manim\factorization\identities_geometry.py `
#                -SceneName PerfectSquareSum -Deck factorization\perfect-square-sum -Quality ql
param(
    [string]$SceneFile = "manim\factorization\identities_geometry.py",
    [Parameter(Mandatory = $true)][string]$SceneName,
    [Parameter(Mandatory = $true)][string]$Deck,
    [string]$Quality = "h"   # one of l|m|h|p|k  (NOTE: use long --quality; "-qh" trips manim-slides' -h)
)
# tolerate "qh"/"ql" style input
$Quality = $Quality -replace '^q', ''

# Native tools (LaTeX/MiKTeX) emit benign warnings on stderr; don't treat those as fatal.
# Real failures are caught via $LASTEXITCODE checks below.
$ErrorActionPreference = "Continue"
$Here = $PSScriptRoot
$Venv = Join-Path $Here ".venv-manim\Scripts\manim-slides.exe"
if (-not (Test-Path $Venv)) {
    $Venv = Join-Path $Here "..\KOC_web - reference\.venv\Scripts\manim-slides.exe"
}
if (-not (Test-Path $Venv)) { Write-Error "manim-slides not found (tried .venv-manim and KOC_web - reference)"; exit 1 }

Push-Location $Here
try {
    Write-Host "=== render $SceneName ($Quality) ===" -ForegroundColor Cyan
    # Keep all intermediates under dashboard/.manim-media
    & $Venv render $SceneFile $SceneName --quality $Quality --media_dir ".manim-media"
    if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

    $OutDir = Join-Path $Here "slides\$Deck"
    New-Item -ItemType Directory -Force -Path $OutDir | Out-Null
    $OutHtml = Join-Path $OutDir "index.html"

    Write-Host "=== convert -> $OutHtml ===" -ForegroundColor Cyan
    & $Venv convert --to=html $SceneName $OutHtml
    if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

    # Patch deck: CDN rewrite for CF + autoplay background videos.
    $DeckDir = Split-Path $OutHtml -Parent
    $html = Get-Content $OutHtml -Raw
    if ($html -notmatch 'shared/video-cdn\.js') {
        $html = $html -replace '(</body>)', "    <script src=`"../../../shared/video-cdn.js`"></script>`n  `$1"
    }
    $VideoPatch = Join-Path $Here "slides\slide-video-autoplay.js"
    if (Test-Path $VideoPatch) {
        Copy-Item -Force $VideoPatch (Join-Path $DeckDir "slide-video-autoplay.js")
        if ($html -notmatch 'slide-video-autoplay\.js') {
            $html = $html -replace '(</body>)', "    <script src=`"slide-video-autoplay.js`"></script>`n  `$1"
        }
    }
    Set-Content -Path $OutHtml -Value $html -NoNewline

    Write-Host "Done: $OutHtml" -ForegroundColor Green
}
finally {
    Pop-Location
}
